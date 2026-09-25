# Пульс — крошечный учебный сайт «я жив» + заметка на диске.

Скопируйте эту папку на сервер в `/opt/pulse`. Секреты — в `.env` из `.env.example`.

```bash
cp .env.example .env
docker compose up -d --build
```

Проверка на сервере: `curl -s http://127.0.0.1:8080/health`
Должно быть `{"status":"ok"}`.
