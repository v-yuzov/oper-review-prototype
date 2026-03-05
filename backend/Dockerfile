# Сборка: образ с Gradle 9 и JDK 21
# Кэш Gradle (--mount=type=cache) сохраняется между сборками — зависимости не перекачиваются при каждом build
FROM gradle:9.0.0-jdk21 AS build
WORKDIR /app

COPY build.gradle.kts settings.gradle.kts gradle.properties ./
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    gradle --no-daemon dependencies

COPY src src
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    gradle --no-daemon installDist

# Рантайм
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN adduser -D -h /app appuser

COPY --from=build /app/build/install/oper-review-backend /app/install
COPY entrypoint.sh /app/entrypoint.sh
RUN chown -R appuser:appuser /app && \
    chmod +x /app/install/bin/oper-review-backend /app/entrypoint.sh 2>/dev/null || true

EXPOSE 8080
# Entrypoint от root: выставляет права на /app/data, затем запускает приложение от appuser
ENTRYPOINT ["/app/entrypoint.sh"]
