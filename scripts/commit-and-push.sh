#!/bin/bash
#
# Коммит и пуш в GitHub (те же креды и окружение, что в DreamTeam/pr.sh).
# Использует стандартный git и текущую настройку origin (credential helper / SSH).
#
# Использование: ./scripts/commit-and-push.sh
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; }

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Это не git репозиторий!"
    exit 1
fi

current_branch=$(git branch --show-current)
if [ -z "$current_branch" ]; then
    log_error "Не удалось определить текущую ветку"
    exit 1
fi

log_info "Ветка: $current_branch"
log_info "Remote: $(git remote get-url origin 2>/dev/null || echo 'не настроен')"

if git diff-index --quiet HEAD -- 2>/dev/null && [ -z "$(git status --porcelain)" ]; then
    log_info "Нет изменений для коммита"
    exit 0
fi

log_info "Изменения:"
git status --short
echo

log_info "Введите сообщение коммита:"
read -r commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update $(date '+%Y-%m-%d %H:%M:%S')"
    log_warning "Используется сообщение по умолчанию: $commit_message"
fi

log_info "Добавляем все изменения..."
git add .

if git diff --cached --quiet; then
    log_info "Нет изменений для коммита (всё уже в индексе или отменено)"
    exit 0
fi

log_info "Создаём коммит..."
if ! git commit -m "$commit_message"; then
    log_error "Ошибка при создании коммита"
    exit 1
fi
log_success "Коммит создан"

log_info "Отправляем в origin/$current_branch..."
if git push origin "$current_branch"; then
    log_success "Изменения отправлены в GitHub"
else
    log_error "Ошибка при push (проверьте доступ и origin)"
    exit 1
fi

log_success "Готово."
