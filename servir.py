"""Servidor local do portfolio.

Serve a pasta atual em http://localhost:8899 com cache desligado — durante o
desenvolvimento o navegador guardava CSS/JS antigos e escondia as mudanças.

Uso:  python servir.py
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

PORTA = 8899


class SemCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass  # silencia o log de cada requisicao


if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    with ThreadingHTTPServer(("127.0.0.1", PORTA), SemCache) as s:
        print(f"portfolio em http://localhost:{PORTA}  (Ctrl+C para parar)")
        s.serve_forever()
