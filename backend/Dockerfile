# Сборка: образ с Gradle 9 и JDK 21 (тег без alpine — официальный на Docker Hub)
# Передать учётные данные Artifactory при сборке: docker build --build-arg ARTIFACTORY_USERNAME=... --build-arg ARTIFACTORY_PASSWORD=...
FROM gradle:9.0.0-jdk21 AS build
WORKDIR /app

ARG ARTIFACTORY_USERNAME
ARG ARTIFACTORY_PASSWORD
ENV ARTIFACTORY_USERNAME=${ARTIFACTORY_USERNAME}
ENV ARTIFACTORY_PASSWORD=${ARTIFACTORY_PASSWORD}

COPY build.gradle.kts settings.gradle.kts gradle.properties ./
RUN gradle --no-daemon dependencies --refresh-dependencies || true

COPY src src
RUN gradle --no-daemon installDist

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
