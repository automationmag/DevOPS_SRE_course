#!/bin/sh
# Учебный архив данных «Пульса». Не кладёт .env в архив.
# Запуск на сервере: sh /opt/pulse/backup-pulse.sh

set -eu
PULSE_DIR="${PULSE_DIR:-/opt/pulse}"
STAMP=$(date +%Y%m%d-%H%M)
OUT="/tmp/pulse-data-${STAMP}.tgz"

if [ ! -d "$PULSE_DIR/data" ]; then
  echo "Нет папки $PULSE_DIR/data" >&2
  exit 1
fi

tar -czf "$OUT" -C "$PULSE_DIR" data
echo "$OUT"
ls -l "$OUT"
