# Сборка: образ с Gradle 9 и JDK 21 (тег без alpine — официальный на Docker Hub)
FROM gradle:9.0.0-jdk21 AS build
WORKDIR /app

COPY build.gradle.kts settings.gradle.kts gradle.properties ./
RUN gradle --no-daemon dependencies --refresh-dependencies || true

COPY src src
RUN gradle --no-daemon installDist

# Рантайм
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN adduser -D -h /app appuser

COPY --from=build /app/build/install/oper-review-backend /app/install
RUN chown -R appuser:appuser /app && \
    chmod +x /app/install/oper-review-backend/bin/oper-review-backend 2>/dev/null || true

USER appuser
EXPOSE 8080

# Запуск через sh по полному пути (обход entrypoint temurin, не подхватывающего PATH)
ENTRYPOINT []
CMD ["/bin/sh", "-c", "exec /app/install/oper-review-backend/bin/oper-review-backend"]
