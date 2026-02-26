#!/usr/bin/env bash
#
# Подготовка окружения на macOS для сборки и деплоя в Colima.
# Проверяет необходимое ПО (Homebrew, SQLite, Colima, Docker, Docker Compose, Buildx),
# при отсутствии устанавливает через Homebrew. Сборку и деплой не выполняет.
#
# Использование: ./scripts/setup-env-mac.sh
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

# --- Homebrew ---
ensure_brew() {
  if check_cmd brew; then
    log_info "Homebrew уже установлен: $(brew --version | head -1)"
    return 0
  fi
  log_warn "Homebrew не найден. Установка..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
  if ! check_cmd brew; then
    log_error "Установите Homebrew вручную: https://brew.sh. Затем перезапустите скрипт."
    exit 1
  fi
  log_info "Homebrew установлен."
}

# --- SQLite (CLI и библиотеки; backend использует JDBC-драйвер, sqlite3 полезен для отладки) ---
ensure_sqlite() {
  if check_cmd sqlite3; then
    log_info "SQLite уже установлен: $(sqlite3 --version 2>/dev/null || true)"
    return 0
  fi
  log_warn "SQLite не найден. Установка через brew..."
  brew install sqlite
  log_info "SQLite установлен."
}

# --- Colima ---
ensure_colima() {
  if check_cmd colima; then
    log_info "Colima уже установлен: $(colima version 2>/dev/null | head -1 || true)"
    return 0
  fi
  log_warn "Colima не найден. Установка через brew..."
  brew install colima
  log_info "Colima установлен."
}

# --- Docker CLI ---
ensure_docker_cli() {
  if check_cmd docker; then
    log_info "Docker CLI уже установлен: $(docker --version 2>/dev/null || true)"
    return 0
  fi
  log_warn "Docker CLI не найден. Установка через brew..."
  brew install docker
  log_info "Docker CLI установлен."
}

# --- Docker Compose (V1, отдельная утилита — стабильно работает с Colima) ---
ensure_docker_compose() {
  if check_cmd docker-compose; then
    log_info "Docker Compose уже установлен: $(docker-compose --version 2>/dev/null || true)"
    return 0
  fi
  if docker compose version &>/dev/null; then
    log_info "Docker Compose (V2 plugin) доступен: $(docker compose version 2>/dev/null || true)"
    return 0
  fi
  log_warn "Docker Compose не найден. Установка через brew..."
  brew install docker-compose
  log_info "Docker Compose установлен."
}

# --- Docker Buildx (нужен для docker-compose build) ---
ensure_docker_buildx() {
  local plugins_dir="${HOME}/.docker/cli-plugins"
  local buildx_plugin="${plugins_dir}/docker-buildx"
  if docker buildx version &>/dev/null; then
    log_info "Docker Buildx уже доступен: $(docker buildx version 2>/dev/null | head -1 || true)"
    return 0
  fi
  log_warn "Docker Buildx не найден. Установка через brew..."
  brew install docker-buildx
  mkdir -p "${plugins_dir}"
  local brew_buildx
  brew_buildx="$(brew --prefix docker-buildx 2>/dev/null)/bin/docker-buildx"
  if [[ -x "${brew_buildx}" ]]; then
    ln -sfn "${brew_buildx}" "${buildx_plugin}"
    log_info "Docker Buildx установлен и добавлен в cli-plugins."
  else
    log_warn "Docker Buildx установлен через brew; если сборка падает, добавьте в PATH: $(brew --prefix docker-buildx)/bin"
  fi
}

# --- Credential helper для Colima (без Docker Desktop) ---
fix_docker_credentials() {
  local config="${HOME}/.docker/config.json"
  if [[ ! -f "${config}" ]]; then
    return 0
  fi
  if grep -q '"credsStore"[[:space:]]*:[[:space:]]*"desktop"' "${config}" 2>/dev/null; then
    log_warn "В config.json указан credsStore=desktop (Docker Desktop). Для Colima меняем на osxkeychain..."
    cp -a "${config}" "${config}.bak"
    sed 's/"credsStore"[[:space:]]*:[[:space:]]*"desktop"/"credsStore": "osxkeychain"/g' "${config}" > "${config}.new" && mv "${config}.new" "${config}"
    log_info "Готово. Бэкап: ${config}.bak"
  fi
  if ! command -v docker-credential-osxkeychain &>/dev/null; then
    log_warn "Рекомендуется установить credential helper: brew install docker-credential-helper"
  fi
}

# --- Запуск Colima, если не запущен ---
ensure_colima_running() {
  if ! check_cmd colima; then
    return 0
  fi
  if colima status &>/dev/null; then
    log_info "Colima уже запущен."
    return 0
  fi
  log_warn "Colima не запущен. Запуск (это может занять минуту)..."
  colima start
  log_info "Colima запущен."
}

# --- main ---
main() {
  log_info "Подготовка окружения (проект: ${PROJECT_ROOT})"
  ensure_brew
  ensure_sqlite
  ensure_colima
  ensure_docker_cli
  ensure_docker_compose
  ensure_docker_buildx
  fix_docker_credentials
  ensure_colima_running
  log_info "Окружение готово."
  echo ""
  log_info "Для сборки и деплоя выполните из корня проекта:"
  echo "  cd ${PROJECT_ROOT}"
  echo "  docker-compose up --build   # или: docker compose up --build"
  echo ""
}

main "$@"
