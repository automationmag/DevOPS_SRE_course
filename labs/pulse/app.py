# Учебное приложение «Пульс»
# Только стандартная библиотека Python. Секретов в коде нет.

from __future__ import annotations

import html
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DATA_DIR = Path(os.environ.get("PULSE_DATA_DIR", "/data"))
NOTE_FILE = DATA_DIR / "note.txt"
HOST = os.environ.get("PULSE_HOST", "0.0.0.0")
PORT = int(os.environ.get("PULSE_PORT", "8080"))
TITLE = os.environ.get("PULSE_TITLE", "Пульс")


def read_note() -> str:
    if NOTE_FILE.is_file():
        return NOTE_FILE.read_text(encoding="utf-8")
    return "Пока пусто. Сохраните заметку ниже — она останется в томе на диске."


def write_note(text: str) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    NOTE_FILE.write_text(text, encoding="utf-8")


PAGE = """<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    body {{ font-family: sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }}
    .ok {{ color: #0a7; font-weight: 700; }}
    textarea {{ width: 100%; min-height: 8rem; }}
    button {{ padding: 0.4rem 0.8rem; }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <p class="ok">Сервис жив.</p>
  <p>Это учебное приложение курса DevOps. Данные пишутся в файл на диске сервера, не в контейнер.</p>
  <form method="post" action="/">
    <label>Заметка</label>
    <textarea name="note">{note}</textarea>
    <p><button type="submit">Сохранить</button></p>
  </form>
</body>
</html>
"""


class PulseHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        extra = self.headers.get("X-Request-Id", "-")
        sys_stderr = __import__("sys").stderr
        sys_stderr.write(f"{self.address_string()} req={extra} " + (fmt % args) + "\n")

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/health":
            body = b'{"status":"ok"}\n'
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path not in ("/", ""):
            self.send_error(404)
            return
        page = PAGE.format(title=html.escape(TITLE), note=html.escape(read_note()))
        data = page.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        if self.path not in ("/", ""):
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8", errors="replace")
        note = ""
        for pair in raw.split("&"):
            if pair.startswith("note="):
                from urllib.parse import unquote_plus

                note = unquote_plus(pair[5:])
        write_note(note)
        self.send_response(303)
        self.send_header("Location", "/")
        self.end_headers()


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), PulseHandler)
    print(f"pulse listening on {HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
