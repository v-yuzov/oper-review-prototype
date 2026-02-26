# Прототип проекта оперревью

## Стек (версии не ниже)
- **Gradle**: 9.0.0
- **Kotlin**: 2.2.10
- **JVM**: 21
- **Angular**: 21.0.0
- **Taiga UI**: 4.0.0

Совместимый набор для frontend: **Angular 21.2.0** + **Taiga UI 4.x** (см. `frontend/package.json`). Taiga UI 4 поддерживает Angular 16+, в том числе 21; overrides не требуются, предупреждения `npm audit` по Angular устранены.

## Легковесные БД для прототипа

| Вариант | Плюсы | Минусы | Рекомендация |
|--------|--------|--------|--------------|
| **SQLite** | Один файл, кроссплатформенность, нет отдельного процесса | Один писатель в момент времени | ✅ Выбран по умолчанию для прототипа |
| **H2** | In-memory или файл, нулевая настройка, встроен в JVM-экосистему | Не подходит для высоконагруженного продакшена | Хорошая альтернатива |
| **Embedded PostgreSQL** (Flapdoodle, Testcontainers) | Настоящий Postgres, совместимость с продакшеном | Тяжелее, дольше старт, больше ресурсов | Если планируете сразу деплой Postgres в Colima |

Для прототипа в репозитории настроена **SQLite**: один файл `review.db` в `backend/data/` (в Docker — в volume), при необходимости легко заменить на H2 или Postgres.

## Структура проекта

```
oper-review-prototype/
├── readme.md
├── docker-compose.yml          # Запуск backend + frontend в Colima
├── scripts/
│   └── setup-env-mac.sh        # Подготовка окружения на macOS (Colima, Docker, buildx, credentials)
│   └── build-and-run-colima.sh # Полная сборка и запуск в Colima
│   └── commit-and-push.sh     # Коммит и пуш в GitHub (из корня: ./scripts/commit-and-push.sh)
├── backend/                    # Kotlin (Ktor), Gradle 9, JVM 21
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── src/main/kotlin/
│   ├── src/main/resources/
│   └── src/test/kotlin/
├── frontend/                   # Angular 21 + Taiga UI 4
│   ├── src/
│   ├── angular.json
│   └── package.json
└── .gitignore
```

## Запуск (Colima)

**Подготовка окружения на macOS:** скрипт проверит и при необходимости установит через Homebrew: Homebrew, Colima, Docker CLI, Docker Compose; при необходимости запустит Colima. Сборку и деплой не выполняет:
```bash
./scripts/setup-env-mac.sh
```
После этого выполните сборку и деплой вручную (см. ниже).

**Полная сборка и запуск в Colima (одной командой):**
```bash
./scripts/build-and-run-colima.sh       # логи в консоль
./scripts/build-and-run-colima.sh -d    # запуск в фоне
```
Скрипт при необходимости запустит Colima, затем выполнит `docker-compose up --build`.

**Вручную:**
1. Запустить Colima: `colima start`
2. Сборка и запуск (из корня репозитория):
   - **Compose V2** (плагин Docker): `docker compose up --build`
   - **Compose V1** (отдельная утилита): `docker-compose up --build`
   Если видите `unknown flag: --build`, значит вызывается не compose — проверьте `docker compose version` или используйте `docker-compose`.
3. Backend: http://localhost:8080, Frontend: http://localhost:4201

Если при `docker-compose up --build` появляются ошибки **docker-credential-desktop** или **buildx plugin**: перезапустите подготовку окружения `./scripts/setup-env-mac.sh` (скрипт поправит config.json и установит buildx). Либо вручную: `brew install docker-buildx docker-credential-helper` и в `~/.docker/config.json` заменить `"credsStore": "desktop"` на `"osxkeychain"`.

**Ошибка `failed to receive status: rpc error: ... error reading from server: EOF`** при сборке обычно связана с обрывом соединения с BuildKit при параллельной сборке (таймаут или нехватка памяти). Решение: собирать образы по очереди, затем поднимать контейнеры:
```bash
docker compose build backend && docker compose build frontend && docker compose up -d
```
Либо увеличить память для Colima/Docker (например, в Colima: `colima stop` → настройки → больше RAM/CPU) и повторить `docker compose up --build`.

**Ошибка `Could not download ... Could not GET ... repo.maven.apache.org` / `Name or service not known`** при сборке backend — контейнер не имеет доступа в интернет или не резолвит Maven Central. Что проверить:
1. Сеть Colima: после `colima start` проверьте с хоста `ping repo.maven.apache.org` или откройте в браузере https://repo.maven.apache.org — если с хоста не работает, в контейнере тоже не будет.
2. VPN/прокси: отключите VPN или настройте прокси для Docker (переменные окружения в Dockerfile или docker-compose).
3. Обходной путь — собрать backend на хосте и не тянуть зависимости в Docker: в `backend/` выполнить `./gradlew installDist`, затем собрать только frontend: `docker compose build frontend && docker compose up -d` — backend при этом не пересоберётся; для полной пересборки backend нужна сеть в Docker.

Локальная разработка без Docker:
- Backend: в `backend/` при первом запуске сгенерируйте wrapper: `gradle wrapper --gradle-version 9.0`, затем `./gradlew run`. Либо собирайте через Docker.
- Frontend: `cd frontend && npm install && npm start`

**Наполнение БД фейковыми данными** (ИТ-департамент Галактической Империи — сотрудники, юниты, назначения):
```bash
cd backend && ./gradlew seed
```
Скрипт перезаписывает таблицы `employee`, `unit`, `unit_employee` (данные в `backend/data/review.db`). Бэкенд на это время лучше остановить.
