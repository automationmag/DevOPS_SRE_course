#!/bin/sh
# Проверка health и диск. Пишет в Telegram только при смене состояния
# (чтобы не долбить каждую минуту).
# Секреты — в /opt/pulse/alert.env или /opt/pulse/.env, не в этот файл.

set -eu

ENV_FILE="${ALERT_ENV_FILE:-/opt/pulse/alert.env}"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/opt/pulse/.env"
fi
# shellcheck disable=SC1090
. "$ENV_FILE"

STATE_DIR="${ALERT_STATE_DIR:-/opt/pulse/alert-state}"
URL="${PULSE_HEALTH_URL:-http://127.0.0.1:8080/health}"
DISK_LIMIT="${DISK_ALERT_PERCENT:-85}"

mkdir -p "$STATE_DIR"

send() {
  text="$1"
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    echo "Нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID" >&2
    return 1
  fi
  curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${text}" >/dev/null
}

flag_on() {
  name="$1"
  text="$2"
  if [ ! -f "$STATE_DIR/$name" ]; then
    send "$text"
    date -Iseconds > "$STATE_DIR/$name"
  fi
}

flag_off() {
  name="$1"
  text="$2"
  if [ -f "$STATE_DIR/$name" ]; then
    send "$text"
    rm -f "$STATE_DIR/$name"
  fi
}

code=$(curl -sS -o /tmp/pulse-health.body -w "%{http_code}" --max-time 15 "$URL" || echo "000")
if [ "$code" = "200" ]; then
  flag_off health "Пульс снова отвечает 200: $URL"
else
  flag_on health "CRITICAL Пульс health=$code URL=$URL Смотри runbook «сайт не открывается»."
fi

used=$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')
if [ "$used" -ge "$DISK_LIMIT" ]; then
  flag_on disk "WARNING диск / занят ${used}% (порог ${DISK_LIMIT}%). Runbook «диск кончается»."
else
  flag_off disk "Диск / снова ниже порога: ${used}%."
fi
