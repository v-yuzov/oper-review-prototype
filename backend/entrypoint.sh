#!/bin/sh
set -e
# Том backend-data монтируется в /app/data и по умолчанию принадлежит root.
# Выдаём права appuser, чтобы приложение могло писать review.db
mkdir -p /app/data
chown -R appuser:appuser /app/data
exec su appuser -s /bin/sh -c "exec /app/install/bin/oper-review-backend"
