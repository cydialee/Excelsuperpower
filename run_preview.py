from __future__ import annotations

import argparse

from server.api import run


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Excelsuperpower local web preview.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=4173, type=int)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(host=args.host, port=args.port)
