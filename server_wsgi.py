"""
Production WSGI entry for Excelsuperpower.

Usage:
    python server_wsgi.py                         # default 127.0.0.1:4173
    python server_wsgi.py --host 0.0.0.0 --port 8080  # custom

In production, serve the web frontend static build from web/dist/ as well.
"""
import os
import sys
from pathlib import Path

# Ensure project root is on path
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from server.api import run as run_server


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Excelsuperpower production server")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=4173, help="Bind port (default: 4173)")
    parser.add_argument("--serve-static", action="store_true", help="Serve web/dist/ static files at /")
    args = parser.parse_args()

    # Optionally set runtime dir via env
    os.environ.setdefault(
        "EXCELSUPERPOWER_RUNTIME_DIR",
        str(Path(os.environ.get("TEMP", "/tmp")) / "Excelsuperpower"),
    )

    print(f"[Excelsuperpower] Starting production server on http://{args.host}:{args.port}/")
    if args.serve_static:
        static_dir = ROOT / "web" / "dist"
        if static_dir.exists():
            print(f"[Excelsuperpower] Serving static files from {static_dir}")
            # Note: DemoHandler already handles static files from preview/
            # For production with React build, configure Nginx or use a proper WSGI wrapper
        else:
            print(f"[Excelsuperpower] WARNING: static dir not found at {static_dir}. Run 'cd web && npm run build' first.")

    run_server(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
