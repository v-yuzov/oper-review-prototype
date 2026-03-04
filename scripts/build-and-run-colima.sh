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
  log_info "Проверка Colima..."
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
  log_info "Проверка Docker context..."
  if docker context show &>/dev/null && [[ "$(docker context show)" != "colima" ]]; then
    log_info "Переключение Docker context на colima..."
    docker context use colima
  else
    log_info "Docker context: $(docker context show 2>/dev/null || echo 'не удалось получить')"
  fi
  log_info "Проверка доступности Docker daemon..."
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
  log_info "Docker доступен, продолжаем."
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
  log_error "Не найдена команда docker-compose или docker compose. Установите Docker и выполните: ./scripts/setup-env-mac.sh"
  exit 1
}

# --- Сборка и запуск ---
main() {
  local detach=""
  [[ "${1:-}" == "-d" ]] && detach="-d"

  echo ""
  log_info "========== Старт скрипта сборки и деплоя =========="
  log_info "Проект: ${PROJECT_ROOT}"
  echo ""

  log_info "Шаг 1/6: Проверка Colima и Docker"
  ensure_colima_running
  echo ""

  log_info "Шаг 2/6: Проверка docker-compose.yml"
  if [[ ! -f "${PROJECT_ROOT}/docker-compose.yml" ]]; then
    log_error "Не найден docker-compose.yml в корне проекта."
    exit 1
  fi
  log_info "Файл docker-compose.yml найден."
  echo ""

  log_info "Шаг 3/6: Выбор команды compose"
  local cmd
  cmd=$(get_compose_cmd)
  log_info "Используется команда: ${cmd}"
  echo ""

  log_info "Шаг 4/6: Переход в каталог проекта и остановка контейнеров"
  cd "${PROJECT_ROOT}"
  log_info "Текущий каталог: $(pwd)"
  log_info "Выполняю: ${cmd} down"
  if ! eval "${cmd} down" 2>&1; then
    log_warn "Остановка контейнеров завершилась с кодом $? (возможно, контейнеры не были запущены)."
  fi
  log_info "Контейнеры остановлены (или не были запущены)."
  echo ""

  log_info "Шаг 5/6: Сборка образов"
  log_info "Сборка backend (это может занять несколько минут)..."
  if ! eval "${cmd} build backend"; then
    log_error "Сборка backend не удалась."
    exit 1
  fi
  log_info "Сборка backend завершена."
  log_info "Сборка frontend (это может занять несколько минут)..."
  if ! eval "${cmd} build frontend"; then
    log_error "Сборка frontend не удалась."
    exit 1
  fi
  log_info "Сборка frontend завершена."
  echo ""

  log_info "Шаг 6/6: Запуск контейнеров"
  log_info "Выполняю: ${cmd} up ${detach}"
  echo ""
  eval "${cmd} up ${detach}"
}

main "$@"
