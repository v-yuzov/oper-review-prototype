#!/usr/bin/env bash
#
# Полная сборка проекта и запуск в Colima.
# Останавливает контейнеры (docker-compose down), затем собирает и запускает заново (up --build).
# Frontend в контейнере доступен по http://localhost:4201 (порт выбран свободным, без конфликта с ng serve на 4200).
# При необходимости запускает Colima.
#
# Использование:
#   ./scripts/build-and-run-colima.sh       # сборка и запуск (логи в консоль)
#   ./scripts/build-and-run-colima.sh -d    # сборка и запуск в фоне (detached)
#

set -euo pipefail

readonly SCRIPT_DIR="${BASH_SOURCE%/*}"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

check_cmd() { command -v "$1" &>/dev/null; }

# --- Проверка Colima и доступности Docker ---
ensure_colima_running() {
  if ! check_cmd colima; then
    log_error "Colima не установлен. Сначала выполните: ./scripts/setup-env-mac.sh"
    exit 1
  fi
  if ! colima status &>/dev/null; then
    log_warn "Colima не запущен. Запуск..."
    colima start
    log_info "Colima запущен."
  else
    log_info "Colima уже запущен."
  fi
  # Контекст Docker должен указывать на Colima
  if docker context show &>/dev/null && [[ "$(docker context show)" != "colima" ]]; then
    log_info "Переключение Docker context на colima..."
    docker context use colima
  fi
  if ! docker info &>/dev/null; then
    log_error "Docker не отвечает (Cannot connect to the Docker daemon)."
    echo ""
    echo "  Попробуйте перезапустить Colima:"
    echo "    colima stop"
    echo "    colima start"
    echo ""
    echo "  Затем снова: ./scripts/build-and-run-colima.sh"
    exit 1
  fi
}

# --- Команда compose ---
get_compose_cmd() {
  if check_cmd docker-compose && docker-compose version &>/dev/null; then
    echo "docker-compose"
    return 0
  fi
  if docker compose version &>/dev/null; then
    echo "docker compose"
    return 0
  fi
  log_error "Не найдена команда docker-compose или docker compose. Выполните: ./scripts/setup-env-mac.sh"
  exit 1
}

# --- Сборка и запуск ---
main() {
  local detach=""
  [[ "${1:-}" == "-d" ]] && detach="-d"

  log_info "Проект: ${PROJECT_ROOT}"
  ensure_colima_running

  if [[ ! -f "${PROJECT_ROOT}/docker-compose.yml" ]]; then
    log_error "Не найден docker-compose.yml в корне проекта."
    exit 1
  fi

  local cmd
  cmd=$(get_compose_cmd)

  cd "${PROJECT_ROOT}"
  log_info "Остановка контейнеров проекта (если запущены): ${cmd} down"
  eval "${cmd} down" 2>/dev/null || true
  # Сборка по очереди, чтобы избежать EOF при параллельной сборке (нехватка памяти BuildKit)
  log_info "Сборка backend..."
  eval "${cmd} build backend"
  log_info "Сборка frontend..."
  eval "${cmd} build frontend"
  log_info "Запуск контейнеров: ${cmd} up ${detach}"
  echo ""
  eval "${cmd} up ${detach}"
}

main "$@"
