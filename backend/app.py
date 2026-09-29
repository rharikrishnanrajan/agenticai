"""
TechDesk Assistant – Flask Backend API
Connects with React frontend, manages agent sessions, memory, tools and API configuration.
"""

import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv, set_key

from agent import techdesk_agent, TOOL_METADATA, get_llm, clean_api_key

load_dotenv(override=True)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
ROOT_ENV_PATH = os.path.join(BASE_DIR, ".env")
REACT_DIST = os.path.join(BASE_DIR, "frontend", "dist")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# ─────────────────────────────────────────────
# Security Configuration
# ─────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "4000"))

app = Flask(
    __name__,
    static_folder=REACT_DIST if os.path.exists(REACT_DIST) else STATIC_DIR,
    static_url_path=""
)

# Restrict CORS to explicit allowed origins — never use wildcard "*" in production
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=False)

# Limit incoming request body size to 1 MB to prevent DoS via large payloads
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024  # 1 MB


@app.after_request
def set_security_headers(response):
    """Attach security headers to every response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    return response


# ─────────────────────────────────────────────
# Static / React Frontend Routes
# ─────────────────────────────────────────────

@app.route("/")
def index():
    if os.path.exists(os.path.join(REACT_DIST, "index.html")):
        return send_from_directory(REACT_DIST, "index.html")
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/<path:path>")
def static_proxy(path):
    target_dir = REACT_DIST if os.path.exists(REACT_DIST) else STATIC_DIR
    if os.path.exists(os.path.join(target_dir, path)):
        return send_from_directory(target_dir, path)
    if os.path.exists(os.path.join(REACT_DIST, "index.html")):
        return send_from_directory(REACT_DIST, "index.html")
    return send_from_directory(STATIC_DIR, "index.html")


# ─────────────────────────────────────────────
# Session & Chat APIs
# ─────────────────────────────────────────────

@app.route("/api/session", methods=["POST"])
def create_session():
    """Create a new conversational session ID."""
    session_id = str(uuid.uuid4())
    return jsonify({
        "session_id": session_id,
        "created_at": "now",
        "agent": "TechDesk Assistant"
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat messages with LangChain memory and tools."""
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    user_input = data.get("message", "").strip()

    if not session_id:
        return jsonify({"success": False, "error": "session_id is required"}), 400
    if not user_input:
        return jsonify({"success": False, "error": "message is required"}), 400

    # [SECURITY] Enforce max message length to prevent prompt injection via huge payloads
    if len(user_input) > MAX_MESSAGE_LENGTH:
        return jsonify({
            "success": False,
            "error": f"Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters."
        }), 413

    # [SECURITY] Validate session_id is a valid UUID to prevent path traversal / injection
    try:
        uuid.UUID(session_id)
    except (ValueError, AttributeError):
        return jsonify({"success": False, "error": "Invalid session_id format."}), 400

    result = techdesk_agent.chat(session_id, user_input)
    return jsonify(result)


@app.route("/api/history/<session_id>", methods=["GET"])
def get_history(session_id: str):
    """Retrieve multi-turn conversation memory for a session."""
    history = techdesk_agent.get_history(session_id)
    return jsonify({
        "success": True,
        "session_id": session_id,
        "history": history
    })


@app.route("/api/clear/<session_id>", methods=["DELETE"])
def clear_session(session_id: str):
    """Wipe memory checkpoints for a session."""
    techdesk_agent.clear_session(session_id)
    return jsonify({
        "success": True,
        "message": "Session memory cleared",
        "session_id": session_id
    })


# ─────────────────────────────────────────────
# Tools & Direct Execution APIs
# ─────────────────────────────────────────────

@app.route("/api/tools", methods=["GET"])
def get_tools():
    """Return available tools with metadata."""
    return jsonify({
        "success": True,
        "tools": TOOL_METADATA
    })


@app.route("/api/tool-direct", methods=["POST"])
def tool_direct():
    """Directly execute a tool (e.g. for Docs Explorer or Error Debugger)."""
    data = request.get_json(silent=True) or {}
    tool_id = data.get("tool_id", "").strip()
    query = data.get("query", "").strip()

    if not tool_id or not query:
        return jsonify({"success": False, "error": "tool_id and query are required"}), 400

    output = techdesk_agent.execute_tool_direct(tool_id, query)
    return jsonify({
        "success": True,
        "tool_id": tool_id,
        "query": query,
        "output": output
    })


# ─────────────────────────────────────────────
# Configuration & API Key APIs
# ─────────────────────────────────────────────

@app.route("/api/config", methods=["GET"])
def get_config():
    """Check system status and API key configuration."""
    is_conf = techdesk_agent.is_configured()
    masked = techdesk_agent.get_masked_key()
    return jsonify({
        "success": True,
        "model": "gemini-3.8-flash",
        "provider": "Google Gemini",
        "framework": "LangChain 1.4 + LangGraph Memory",
        "is_configured": is_conf,
        "masked_key": masked,
        "tools_count": len(TOOL_METADATA)
    })


@app.route("/api/config", methods=["POST"])
def update_config():
    """Update Google Gemini API key in .env and reload agent."""
    data = request.get_json(silent=True) or {}
    new_key = data.get("api_key", "").strip()

    if not new_key:
        return jsonify({"success": False, "error": "API key cannot be empty"}), 400

    # [SECURITY] Basic format validation — Gemini keys start with 'AIzaSy' (39 chars)
    # or newer AIza/AQ format. Reject keys that are suspiciously short.
    if len(new_key) < 20:
        return jsonify({"success": False, "error": "API key format appears invalid (too short)."}), 400

    # [SECURITY] Only allow printable ASCII, no control characters or whitespace inside
    if not new_key.isprintable() or " " in new_key:
        return jsonify({"success": False, "error": "API key contains invalid characters."}), 400

    clean_key = clean_api_key(new_key)
    try:
        set_key(ENV_PATH, "GOOGLE_API_KEY", clean_key)
        if os.path.exists(ROOT_ENV_PATH):
            try:
                set_key(ROOT_ENV_PATH, "GOOGLE_API_KEY", clean_key)
            except Exception:
                pass
        os.environ["GOOGLE_API_KEY"] = clean_key
        load_dotenv(ENV_PATH, override=True)

        success, msg = techdesk_agent.init_agent(clean_key)
        return jsonify({
            "success": success,
            "message": msg if success else f"Key saved but initialization failed: {msg}",
            "masked_key": techdesk_agent.get_masked_key()
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/test-key", methods=["POST"])
def test_key():
    """Validate an API key directly against Google Gemini."""
    data = request.get_json(silent=True) or {}
    test_k = data.get("api_key", "").strip() or os.getenv("GOOGLE_API_KEY")
    clean_k = clean_api_key(test_k)

    if not clean_k:
        return jsonify({"success": False, "valid": False, "message": "No API key provided to test"}), 400

    try:
        llm = get_llm(clean_k)
        res = llm.invoke("Ping")
        return jsonify({
            "success": True,
            "valid": True,
            "message": "API key is valid and connected to Google Gemini!",
            "response_sample": str(res.content)[:60]
        })
    except Exception as e:
        err_msg = str(e)
        return jsonify({
            "success": False,
            "valid": False,
            "message": f"API key validation failed: {err_msg}"
        }), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "agent": "TechDesk Assistant",
        "version": "2.0.0"
    })


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # [SECURITY] Bind to 127.0.0.1 (loopback) in development.
    # Set HOST=0.0.0.0 in production only behind a reverse proxy (nginx/caddy).
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "development") == "development"

    print(f"\n[TechDesk] Backend server running at http://{host}:{port}")
    print("           React frontend running at http://127.0.0.1:5173")
    print(f"           CORS allowed origins: {ALLOWED_ORIGINS}\n")

    # [SECURITY] Never run with debug=True in production — it exposes an interactive shell
    app.run(debug=debug, host=host, port=port)
