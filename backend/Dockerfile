# Базовые образы по умолчанию — Docker Hub. При доступе только к Artifactory задать через build-arg:
#   GRADLE_BASE_IMAGE=...  RUNTIME_BASE_IMAGE=...  (URL образов из внутреннего Docker-реестра)
# Учётные данные Artifactory для Gradle: ARTIFACTORY_USERNAME, ARTIFACTORY_PASSWORD
ARG GRADLE_BASE_IMAGE=gradle:9.0.0-jdk21
ARG RUNTIME_BASE_IMAGE=eclipse-temurin:21-jre-alpine

FROM ${GRADLE_BASE_IMAGE} AS build
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
FROM ${RUNTIME_BASE_IMAGE}
WORKDIR /app

RUN adduser -D -h /app appuser

COPY --from=build /app/build/install/oper-review-backend /app/install
COPY entrypoint.sh /app/entrypoint.sh
RUN chown -R appuser:appuser /app && \
    chmod +x /app/install/bin/oper-review-backend /app/entrypoint.sh 2>/dev/null || true

EXPOSE 8080
# Entrypoint от root: выставляет права на /app/data, затем запускает приложение от appuser
ENTRYPOINT ["/app/entrypoint.sh"]
