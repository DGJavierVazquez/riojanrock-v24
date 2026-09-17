import json
import mimetypes
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
AGENDA = ROOT / "assets" / "agenda"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def agenda_items():
    items = []
    for path in sorted(AGENDA.iterdir(), key=lambda p: p.name.lower()):
        if path.is_file() and path.suffix.lower() in EXTENSIONS:
            items.append({
                "src": f"assets/agenda/{path.name}",
                "href": "https://www.instagram.com/riojanrock/",
                "alt": f"Agenda RIOJANROCK — {path.stem.replace('_', ' ')}"
            })
    return items


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/agenda":
            payload = json.dumps(agenda_items(), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        return super().do_GET()

    def log_message(self, fmt, *args):
        if self.path.startswith("/api/agenda"):
            return
        super().log_message(fmt, *args)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("RIOJANROCK local: http://127.0.0.1:8000")
    print("Agrega flyers en assets\\agenda. La web los detecta al actualizar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
