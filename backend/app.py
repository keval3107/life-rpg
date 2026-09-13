from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import IntegrityError
from datetime import datetime, date, timedelta
from email.message import EmailMessage
import os
import hashlib
import secrets
import smtplib

from config import FRONTEND_URL, NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM
from database import get_db, fetch_one, fetch_all, execute, ensure_schema
from auth import create_token, require_auth

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL, "http://localhost:5173"]}})

ATTRIBUTE_MAP = {
    "Study": "intellect",
    "Coding": "intellect",
    "Fitness": "strength",
    "Focus": "focus",
    "Reading": "wisdom",
    "Other": "focus",
}
DIFFICULTY_MULTIPLIER = {"Easy": 1.0, "Medium": 1.25, "Hard": 1.5, "Epic": 2.0}


def get_character(user_id):
    return fetch_one("SELECT * FROM characters WHERE user_id=%s", (user_id,))


def level_required(level):
    return int(100 * (level ** 1.35))


def calculate_timer_rewards(seconds, difficulty, streak):
    minutes = max(1, int((seconds + 59) // 60))
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty or "Easy", 1.0)
    focus_xp = int(minutes * 10 * multiplier)
    focus_gold = int(minutes * 3 * multiplier)
    streak_bonus = min(0.50, max(0, (streak - 1) * 0.05))
    xp = int(focus_xp * (1 + streak_bonus))
    gold = int(focus_gold * (1 + streak_bonus))
    attribute_gain = min(10, max(1, 1 + minutes // 10))
    return minutes, xp, gold, attribute_gain


def maybe_level_up(user_id, conn=None):
    own_conn = conn is None
    if own_conn:
        conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT level,xp FROM characters WHERE user_id=%s FOR UPDATE", (user_id,))
        c = cur.fetchone()
        level, xp = c["level"], c["xp"]
        leveled = False
        while xp >= level_required(level + 1):
            level += 1
            leveled = True
        cur.execute("UPDATE characters SET level=%s WHERE user_id=%s", (level, user_id))
        if own_conn:
            conn.commit()
        return level, leveled
    finally:
        cur.close()
        if own_conn:
            conn.close()


def get_timer_state(user_id, quest_id, conn=None):
    own_conn = conn is None
    if own_conn:
        conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM quest_timers WHERE user_id=%s AND quest_id=%s", (user_id, quest_id))
        timer = cur.fetchone()
        if not timer:
            return {"elapsed_seconds": 0, "status": "idle", "started_at": None}
        elapsed = int(timer["elapsed_seconds"] or 0)
        if timer["status"] == "running" and timer["started_at"]:
            elapsed += max(0, int((datetime.now() - timer["started_at"]).total_seconds()))
        return {"id": timer["id"], "elapsed_seconds": elapsed, "status": timer["status"], "started_at": timer["started_at"].isoformat() if timer["started_at"] else None}
    finally:
        cur.close()
        if own_conn:
            conn.close()


def send_reset_email(to_email, reset_url):
    if not SMTP_HOST:
        return False
    msg = EmailMessage()
    msg["Subject"] = "Reset your LifeRPG password"
    msg["From"] = MAIL_FROM
    msg["To"] = to_email
    msg.set_content(
        f"You requested a LifeRPG password reset. This link expires in 30 minutes:\n\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
    return True


try:
    ensure_schema()
except Exception as schema_error:
    # Keep importable for local tooling, but surface the database issue when the app is actually used.
    print(f"Database schema check warning: {schema_error}")


@app.get("/api/health")
def health():
    try:
        fetch_one("SELECT 1 AS ok")
        return jsonify({"status": "ok", "database": "connected", "service": "life-rpg-api"})
    except Exception:
        return jsonify({"status": "error", "database": "unavailable", "service": "life-rpg-api"}), 503


@app.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if len(username) < 3 or len(password) < 6 or "@" not in email:
        return jsonify({"message": "Enter a valid username, email and password (6+ characters)."}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (username,email,password_hash) VALUES (%s,%s,%s)",
                    (username, email, generate_password_hash(password)))
        user_id = cur.lastrowid
        cur.execute("INSERT INTO characters (user_id) VALUES (%s)", (user_id,))
        conn.commit()
        cur.close(); conn.close()
        user = fetch_one("SELECT id,username,email FROM users WHERE id=%s", (user_id,))
        return jsonify({"token": create_token(user_id), "user": user}), 201
    except IntegrityError:
        return jsonify({"message": "Username or email already exists."}), 409


@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    user = fetch_one("SELECT * FROM users WHERE email=%s", (data.get("email", "").strip().lower(),))
    if not user or not check_password_hash(user["password_hash"], data.get("password", "")):
        return jsonify({"message": "Invalid email or password."}), 401
    return jsonify({"token": create_token(user["id"]), "user": {"id": user["id"], "username": user["username"], "email": user["email"]}})


@app.post("/api/auth/forgot-password")
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    generic = "If an account exists for that email, a password reset link has been created."
    user = fetch_one("SELECT id,email FROM users WHERE email=%s", (email,))
    if not user:
        return jsonify({"message": generic})
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    execute("DELETE FROM password_reset_tokens WHERE user_id=%s OR expires_at < NOW()", (user["id"],))
    execute(
        "INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (%s,%s,%s)",
        (user["id"], token_hash, datetime.now() + timedelta(minutes=30)),
    )
    reset_url = f"{FRONTEND_URL.rstrip('/')}/reset-password?token={raw_token}"
    email_sent = False
    try:
        email_sent = send_reset_email(user["email"], reset_url)
    except Exception:
        email_sent = False
    response = {"message": generic, "email_sent": email_sent}
    if NODE_ENV != "production" or os.getenv("RESET_EXPOSE_LINK") == "true":
        response["reset_url"] = reset_url
    return jsonify(response)


@app.post("/api/auth/reset-password")
def reset_password():
    data = request.get_json() or {}
    token = data.get("token", "")
    password = data.get("password", "")
    if len(password) < 6 or not token:
        return jsonify({"message": "A valid reset token and a 6+ character password are required."}), 400
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    conn = get_db(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM password_reset_tokens WHERE token_hash=%s AND used_at IS NULL AND expires_at > NOW() FOR UPDATE", (token_hash,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "This reset link is invalid or expired."}), 400
        cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (generate_password_hash(password), row["user_id"]))
        cur.execute("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=%s", (row["id"],))
        conn.commit()
        return jsonify({"message": "Password updated successfully. You can now sign in."})
    finally:
        cur.close(); conn.close()


@app.get("/api/auth/me")
@require_auth
def me():
    return jsonify({"user": request.user})


@app.get("/api/dashboard")
@require_auth
def dashboard():
    uid = request.user["id"]
    character = get_character(uid)
    quests = fetch_all("""
        SELECT q.*, COALESCE(t.elapsed_seconds,0) AS focus_seconds,
               COALESCE(t.status,'idle') AS timer_status, t.started_at AS timer_started_at
        FROM quests q LEFT JOIN quest_timers t ON t.quest_id=q.id AND t.user_id=q.user_id
        WHERE q.user_id=%s AND q.deleted_at IS NULL
        ORDER BY q.completed ASC, q.created_at DESC
    """, (uid,))
    recent = fetch_all("SELECT * FROM quests WHERE user_id=%s AND completed=1 AND deleted_at IS NULL ORDER BY completed_at DESC LIMIT 5", (uid,))
    active_timer = next((q for q in quests if q["timer_status"] == "running"), None)
    return jsonify({"character": character, "quests": quests, "recent": recent, "active_timer": active_timer})


@app.get("/api/quests")
@require_auth
def quests():
    uid = request.user["id"]
    rows = fetch_all("""
        SELECT q.*, COALESCE(t.elapsed_seconds,0) AS focus_seconds,
               COALESCE(t.status,'idle') AS timer_status, t.started_at AS timer_started_at
        FROM quests q LEFT JOIN quest_timers t ON t.quest_id=q.id AND t.user_id=q.user_id
        WHERE q.user_id=%s AND q.deleted_at IS NULL
        ORDER BY q.completed ASC, q.created_at DESC
    """, (uid,))
    return jsonify({"quests": rows})


@app.post("/api/quests")
@require_auth
def create_quest():
    d = request.get_json() or {}
    title = d.get("title", "").strip()
    category = d.get("category", "Other")
    difficulty = d.get("difficulty", "Easy")
    if difficulty not in DIFFICULTY_MULTIPLIER:
        difficulty = "Easy"
    if not title:
        return jsonify({"message": "Quest title is required."}), 400
    qid = execute(
        "INSERT INTO quests (user_id,title,description,category,difficulty,xp_reward,gold_reward,attribute) VALUES (%s,%s,%s,%s,%s,0,0,%s)",
        (request.user["id"], title, d.get("description", ""), category, difficulty, ATTRIBUTE_MAP.get(category, "focus")),
    )
    return jsonify({"quest_id": qid}), 201


@app.put("/api/quests/<int:qid>")
@require_auth
def update_quest(qid):
    d = request.get_json() or {}
    owned = fetch_one("SELECT id,completed FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NULL", (qid, request.user["id"]))
    if not owned:
        return jsonify({"message": "Quest not found."}), 404
    if owned["completed"]:
        return jsonify({"message": "Completed quests are part of your adventure history and cannot be edited."}), 409
    category = d.get("category", "Other")
    difficulty = d.get("difficulty", "Easy")
    if difficulty not in DIFFICULTY_MULTIPLIER:
        difficulty = "Easy"
    execute(
        "UPDATE quests SET title=%s,description=%s,category=%s,difficulty=%s,attribute=%s WHERE id=%s AND user_id=%s AND deleted_at IS NULL",
        (d.get("title", "").strip(), d.get("description", ""), category, difficulty, ATTRIBUTE_MAP.get(category, "focus"), qid, request.user["id"]),
    )
    return jsonify({"message": "Quest updated."})


@app.delete("/api/quests/<int:qid>")
@require_auth
def delete_quest(qid):
    owned = fetch_one("SELECT id,completed FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NULL", (qid, request.user["id"]))
    if not owned:
        return jsonify({"message": "Quest not found."}), 404
    execute("UPDATE quests SET deleted_at=NOW() WHERE id=%s AND user_id=%s AND deleted_at IS NULL", (qid, request.user["id"]))
    return jsonify({"message": "Quest moved to Recycle Bin. Your earned progress remains safe."})


@app.get("/api/recycle-bin")
@require_auth
def recycle_bin():
    rows = fetch_all("""
        SELECT id,title,description,category,completed,xp_reward,gold_reward,focus_seconds,created_at,completed_at,deleted_at
        FROM quests WHERE user_id=%s AND deleted_at IS NOT NULL ORDER BY deleted_at DESC
    """, (request.user["id"],))
    return jsonify({"quests": rows})


@app.post("/api/recycle-bin/<int:qid>/restore")
@require_auth
def restore_quest(qid):
    owned = fetch_one("SELECT id FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NOT NULL", (qid, request.user["id"]))
    if not owned:
        return jsonify({"message": "Deleted quest not found."}), 404
    execute("UPDATE quests SET deleted_at=NULL WHERE id=%s AND user_id=%s", (qid, request.user["id"]))
    return jsonify({"message": "Quest restored to your quest list."})


@app.delete("/api/recycle-bin/<int:qid>")
@require_auth
def permanently_delete_quest(qid):
    owned = fetch_one("SELECT id FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NOT NULL", (qid, request.user["id"]))
    if not owned:
        return jsonify({"message": "Deleted quest not found."}), 404
    execute("DELETE FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NOT NULL", (qid, request.user["id"]))
    return jsonify({"message": "Quest permanently deleted."})


@app.get("/api/quests/<int:qid>/timer")
@require_auth
def get_quest_timer(qid):
    owned = fetch_one("SELECT id FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NULL", (qid, request.user["id"]))
    if not owned:
        return jsonify({"message": "Quest not found."}), 404
    return jsonify({"timer": get_timer_state(request.user["id"], qid)})


@app.post("/api/quests/<int:qid>/timer/<action>")
@require_auth
def timer_action(qid, action):
    uid = request.user["id"]
    if action not in {"start", "pause", "resume", "reset"}:
        return jsonify({"message": "Unsupported timer action."}), 400
    conn = get_db(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NULL FOR UPDATE", (qid, uid))
        quest = cur.fetchone()
        if not quest:
            return jsonify({"message": "Quest not found."}), 404
        if quest["completed"]:
            return jsonify({"message": "Completed quests no longer need a focus timer."}), 409
        cur.execute("SELECT * FROM quest_timers WHERE user_id=%s AND quest_id=%s FOR UPDATE", (uid, qid))
        timer = cur.fetchone()
        now = datetime.now()
        if action == "start":
            if timer and timer["status"] == "running":
                pass
            elif timer:
                cur.execute("UPDATE quest_timers SET status='running',started_at=%s WHERE id=%s", (now, timer["id"]))
            else:
                cur.execute("INSERT INTO quest_timers (user_id,quest_id,status,started_at) VALUES (%s,%s,'running',%s)", (uid,qid,now))
        elif action == "resume":
            if not timer:
                cur.execute("INSERT INTO quest_timers (user_id,quest_id,status,started_at) VALUES (%s,%s,'running',%s)", (uid,qid,now))
            elif timer["status"] != "running":
                cur.execute("UPDATE quest_timers SET status='running',started_at=%s WHERE id=%s", (now,timer["id"]))
        elif action == "pause":
            if timer and timer["status"] == "running" and timer["started_at"]:
                extra = max(0, int((now - timer["started_at"]).total_seconds()))
                cur.execute("UPDATE quest_timers SET elapsed_seconds=elapsed_seconds+%s,status='paused',started_at=NULL WHERE id=%s", (extra,timer["id"]))
        elif action == "reset":
            if timer:
                cur.execute("UPDATE quest_timers SET elapsed_seconds=0,status='idle',started_at=NULL WHERE id=%s", (timer["id"],))
        conn.commit()
        return jsonify({"timer": get_timer_state(uid, qid, conn)})
    finally:
        cur.close(); conn.close()


@app.post("/api/quests/<int:qid>/complete")
@require_auth
def complete_quest(qid):
    uid = request.user["id"]
    conn = get_db(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM quests WHERE id=%s AND user_id=%s AND deleted_at IS NULL FOR UPDATE", (qid, uid))
        q = cur.fetchone()
        if not q:
            return jsonify({"message": "Quest not found."}), 404
        if q["completed"]:
            return jsonify({"message": "Quest already completed.", "xp_gained": 0}), 409
        cur.execute("SELECT * FROM characters WHERE user_id=%s FOR UPDATE", (uid,))
        c = cur.fetchone()
        cur.execute("SELECT * FROM quest_timers WHERE user_id=%s AND quest_id=%s FOR UPDATE", (uid, qid))
        timer = cur.fetchone()
        elapsed = int(timer["elapsed_seconds"] if timer else 0)
        if timer and timer["status"] == "running" and timer["started_at"]:
            elapsed += max(0, int((datetime.now() - timer["started_at"]).total_seconds()))
        if elapsed < 30:
            return jsonify({"message": "Focus for at least 30 seconds before claiming this quest reward.", "seconds_required": 30, "seconds_focused": elapsed}), 400
        today = date.today()
        new_streak = c["streak"] if c["last_activity"] == today else (c["streak"] + 1 if c["last_activity"] == today - timedelta(days=1) else 1)
        minutes, xp_gain, gold_gain, attribute_gain = calculate_timer_rewards(elapsed, q.get("difficulty", "Easy"), new_streak)
        attr = q["attribute"] or "focus"
        cur.execute("UPDATE quests SET completed=1,completed_at=NOW(),focus_seconds=%s,xp_reward=%s,gold_reward=%s WHERE id=%s", (elapsed,xp_gain,gold_gain,qid))
        cur.execute(f"UPDATE characters SET xp=xp+%s,gold=gold+%s,streak=%s,last_activity=%s,{attr}={attr}+%s,total_focus_seconds=total_focus_seconds+%s WHERE user_id=%s",
                    (xp_gain,gold_gain,new_streak,today,attribute_gain,elapsed,uid))
        if timer:
            cur.execute("UPDATE quest_timers SET elapsed_seconds=%s,status='completed',started_at=NULL WHERE id=%s", (elapsed,timer["id"]))
        else:
            cur.execute("INSERT INTO quest_timers (user_id,quest_id,elapsed_seconds,status) VALUES (%s,%s,%s,'completed')", (uid,qid,elapsed))
        conn.commit()
    finally:
        cur.close(); conn.close()
    level, leveled = maybe_level_up(uid)
    c = get_character(uid)
    return jsonify({"message": "Quest completed!", "xp_gained": xp_gain, "gold_gained": gold_gain, "attribute": attr, "attribute_gained": attribute_gain, "focus_seconds": elapsed, "focus_minutes": minutes, "streak": new_streak, "level": level, "level_up": leveled, "total_xp": c["xp"], "gold_balance": c["gold"]})


@app.get("/api/rewards")
@require_auth
def rewards():
    uid = request.user["id"]
    available = fetch_all("SELECT * FROM rewards WHERE active=1 ORDER BY cost ASC")
    owned = fetch_all("""SELECT i.id AS inventory_id, i.purchased_at, r.id, r.name, r.description, r.icon, r.cost
                        FROM inventory i JOIN rewards r ON r.id=i.reward_id
                        WHERE i.user_id=%s ORDER BY i.purchased_at DESC""", (uid,))
    return jsonify({"rewards": available, "owned_rewards": owned, "character": get_character(uid)})


@app.post("/api/rewards/<int:rid>/buy")
@require_auth
def buy_reward(rid):
    uid = request.user["id"]
    conn = get_db(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM rewards WHERE id=%s AND active=1 FOR UPDATE", (rid,))
        reward = cur.fetchone()
        if not reward:
            return jsonify({"message": "Reward not found."}), 404
        cur.execute("SELECT * FROM characters WHERE user_id=%s FOR UPDATE", (uid,))
        c = cur.fetchone()
        if c["gold"] < reward["cost"]:
            return jsonify({"message": "Not enough Gold for this reward."}), 400
        cur.execute("UPDATE characters SET gold=gold-%s WHERE user_id=%s", (reward["cost"], uid))
        cur.execute("INSERT INTO inventory (user_id,reward_id) VALUES (%s,%s)", (uid,rid))
        conn.commit()
        return jsonify({"message": f"You unlocked {reward['name']}!", "gold_left": c["gold"] - reward["cost"]})
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close(); conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
