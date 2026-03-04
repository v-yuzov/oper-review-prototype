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

cd "${PROJECT_ROOT}"

if [[ ! -f "gradlew" ]]; then
  echo "[ERROR] В корне проекта не найден gradlew. Запускайте из репозитория oper-review-prototype." >&2
  exit 1
fi

./gradlew -p backend seed "$@"
