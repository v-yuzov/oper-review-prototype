#!/usr/bin/env bash
#
# Проверка доступа к Artifactory и передачи учётных данных в Docker-сборку.
# Запуск из корня репозитория: ./scripts/check-artifactory-access.sh
#

set -euo pipefail

SCRIPT_DIR="${BASH_SOURCE%/*}"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ARTIFACTORY_HOST="artifactory.tcsbank.ru"
ARTIFACTORY_MAVEN_URL="https://${ARTIFACTORY_HOST}/artifactory/maven-proxy/"

echo "=== 1. Переменные окружения (ARTIFACTORY_*, GRADLE_BASE_IMAGE) ==="
if [[ -n "${ARTIFACTORY_USERNAME:-}" ]]; then
  echo "  ARTIFACTORY_USERNAME задан (длина=${#ARTIFACTORY_USERNAME})"
else
  echo "  ARTIFACTORY_USERNAME не задан"
fi
if [[ -n "${ARTIFACTORY_PASSWORD:-}" ]]; then
  echo "  ARTIFACTORY_PASSWORD задан (длина=${#ARTIFACTORY_PASSWORD})"
else
  echo "  ARTIFACTORY_PASSWORD не задан"
fi
echo "  GRADLE_BASE_IMAGE=${GRADLE_BASE_IMAGE:-<не задан>}"
echo "  RUNTIME_BASE_IMAGE=${RUNTIME_BASE_IMAGE:-<не задан>}"
echo ""

echo "=== 2. Файл .env в корне проекта ==="
if [[ -f "${PROJECT_ROOT}/.env" ]]; then
  echo "  .env существует"
  if grep -q "ARTIFACTORY_USERNAME" "${PROJECT_ROOT}/.env" 2>/dev/null; then
    echo "  ARTIFACTORY_USERNAME есть в .env"
  else
    echo "  ARTIFACTORY_USERNAME нет в .env"
  fi
  if grep -q "ARTIFACTORY_PASSWORD" "${PROJECT_ROOT}/.env" 2>/dev/null; then
    echo "  ARTIFACTORY_PASSWORD есть в .env"
  else
    echo "  ARTIFACTORY_PASSWORD нет в .env"
  fi
else
  echo "  .env не найден"
fi
echo ""

echo "=== 3. Доступ к Artifactory с хоста (curl) ==="
if command -v curl &>/dev/null; then
  if curl -sSf --connect-timeout 5 -o /dev/null -w "  HTTP %{http_code}, время %{time_total}s\n" "${ARTIFACTORY_MAVEN_URL}" 2>/dev/null; then
    echo "  Доступ с хоста есть"
  else
    echo "  Ошибка доступа с хоста (таймаут, сеть или 401/403)"
    echo "  Проверьте VPN и сеть."
  fi
else
  echo "  curl не найден, пропуск"
fi
echo ""

echo "=== 4. Доступ к Artifactory из контейнера (Docker) ==="
if command -v docker &>/dev/null && docker info &>/dev/null; then
  if docker run --rm curlimages/curl:latest curl -sSf --connect-timeout 10 -o /dev/null -w "  HTTP %{http_code}\n" "${ARTIFACTORY_MAVEN_URL}" 2>/dev/null; then
    echo "  Доступ из контейнера есть"
  else
    echo "  Ошибка или образ curl недоступен (на маке без доступа в интернет образ не скачается)"
    echo "  Вручную: docker run --rm curlimages/curl:latest curl -sS -o /dev/null -w '%{http_code}' ${ARTIFACTORY_MAVEN_URL}"
  fi
else
  echo "  Docker недоступен или не запущен"
fi
echo ""

echo "=== 5. Проверка передачи build-args в docker compose ==="
cd "${PROJECT_ROOT}"
if docker compose config 2>/dev/null | grep -A 20 "backend:" | grep -E "ARTIFACTORY|GRADLE_BASE|RUNTIME_BASE" >/dev/null 2>&1; then
  echo "  В конфиге compose есть build args для backend"
  docker compose config 2>/dev/null | grep -A 30 "backend:" | grep -A 15 "args:" || true
else
  echo "  Запустите: docker compose config (и посмотрите секцию backend.build.args)"
fi
echo ""
echo "Готово. Если с хоста доступ есть, а из контейнера нет — проверьте сеть Docker (Colima/VPN)."
