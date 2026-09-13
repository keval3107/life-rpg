from functools import wraps
from flask import request, jsonify
import jwt
from config import SECRET_KEY
from database import fetch_one


def create_token(user_id):
    import datetime
    return jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        },
        SECRET_KEY,
        algorithm="HS256",
    )


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"message": "Authentication required"}), 401
        try:
            payload = jwt.decode(header.split(" ", 1)[1], SECRET_KEY, algorithms=["HS256"])
            user = fetch_one("SELECT id, username, email FROM users WHERE id=%s", (payload["user_id"],))
            if not user:
                return jsonify({"message": "User not found"}), 401
            request.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Session expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 401
        return fn(*args, **kwargs)
    return wrapper
