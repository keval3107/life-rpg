import mysql.connector
from config import DB_CONFIG


def get_db():
    return mysql.connector.connect(**DB_CONFIG)


def fetch_one(query, params=()):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(query, params)
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()


def fetch_all(query, params=()):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def execute(query, params=()):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        conn.commit()
        return cur.lastrowid
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def ensure_schema():
    """Create only missing support structures; existing user data is not deleted or rewritten."""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS quest_timers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          quest_id INT NOT NULL UNIQUE,
          elapsed_seconds INT NOT NULL DEFAULT 0,
          status ENUM('idle','running','paused','completed') NOT NULL DEFAULT 'idle',
          started_at DATETIME NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
          INDEX idx_timer_user (user_id),
          INDEX idx_timer_status (user_id, status)
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token_hash CHAR(64) NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          used_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_reset_user (user_id),
          INDEX idx_reset_expiry (expires_at)
        )
        """)
        cur.execute("SHOW COLUMNS FROM quests LIKE 'difficulty'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE quests ADD COLUMN difficulty VARCHAR(20) NOT NULL DEFAULT 'Easy'")
        cur.execute("SHOW COLUMNS FROM quests LIKE 'focus_seconds'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE quests ADD COLUMN focus_seconds INT NOT NULL DEFAULT 0")
        cur.execute("SHOW COLUMNS FROM quests LIKE 'deleted_at'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE quests ADD COLUMN deleted_at DATETIME NULL")
        cur.execute("SHOW COLUMNS FROM characters LIKE 'total_focus_seconds'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE characters ADD COLUMN total_focus_seconds BIGINT NOT NULL DEFAULT 0")
        conn.commit()
    finally:
        cur.close()
        conn.close()
