#!/usr/bin/env bash
#
# Запуск SeedData.kt — наполнение БД фейковыми данными (ИТ-департамент).
# Вызывает Gradle-задачу backend:seed.
#
# Использование:
#   ./scripts/run-seed.sh
#   STORAGE_JDBC_URL=jdbc:sqlite:./data/review.db ./scripts/run-seed.sh
#
# По умолчанию БД: jdbc:sqlite:./data/review.db (относительно backend/).
#

set -euo pipefail

readonly SCRIPT_DIR="${BASH_SOURCE%/*}"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly BACKEND_DIR="${PROJECT_ROOT}/backend"

if [[ ! -f "${BACKEND_DIR}/gradlew" ]]; then
  echo "[ERROR] Не найден backend/gradlew. Запускайте из репозитория oper-review-prototype (в нём должна быть папка backend с gradlew)." >&2
  exit 1
fi

cd "${BACKEND_DIR}"
./gradlew seed "$@"
