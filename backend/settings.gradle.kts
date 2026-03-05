rootProject.name = "oper-review-backend"

// Репозитории соответствуют Maven settings.xml (mirror central → maven-proxy; tinkoff-maven-releases-hosted; ins-integration).
// Учётные данные (опционально): ARTIFACTORY_USERNAME, ARTIFACTORY_PASSWORD. Читаем через System.getenv в каждом блоке.

// Сначала внешние репозитории; при недоступности (например, в корп. сети) Gradle перейдёт к Artifactory
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        maven {
            name = "maven-proxy"
            url = uri("https://artifactory.tcsbank.ru/artifactory/maven-proxy/")
            isAllowInsecureProtocol = false
            val u = System.getenv("ARTIFACTORY_USERNAME") ?: ""
            val p = System.getenv("ARTIFACTORY_PASSWORD") ?: ""
            if (u.isNotBlank()) credentials { username = u; password = p }
        }
        maven {
            name = "tinkoff-maven-releases-hosted"
            url = uri("https://artifactory.tcsbank.ru/artifactory/maven-all/")
            isAllowInsecureProtocol = false
            val u = System.getenv("ARTIFACTORY_USERNAME") ?: ""
            val p = System.getenv("ARTIFACTORY_PASSWORD") ?: ""
            if (u.isNotBlank()) credentials { username = u; password = p }
        }
        maven {
            name = "ins-integration-maven-releases-hosted"
            url = uri("https://artifactory.tcsbank.ru/artifactory/maven-all/ins-integration/")
            isAllowInsecureProtocol = false
            val u = System.getenv("ARTIFACTORY_USERNAME") ?: ""
            val p = System.getenv("ARTIFACTORY_PASSWORD") ?: ""
            if (u.isNotBlank()) credentials { username = u; password = p }
        }
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        mavenCentral()
        maven {
            name = "maven-proxy"
            url = uri("https://artifactory.tcsbank.ru/artifactory/maven-proxy/")
            isAllowInsecureProtocol = false
            val u = System.getenv("ARTIFACTORY_USERNAME") ?: ""
            val p = System.getenv("ARTIFACTORY_PASSWORD") ?: ""
            if (u.isNotBlank()) credentials { username = u; password = p }
        }
        maven {
            name = "tinkoff-maven-releases-hosted"
            url = uri("https://artifactory.tcsbank.ru/artifactory/maven-all/")
            isAllowInsecureProtocol = false
            val u = System.getenv("ARTIFACTORY_USERNAME") ?: ""
            val p = System.getenv("ARTIFACTORY_PASSWORD") ?: ""
            if (u.isNotBlank()) credentials { username = u; password = p }
        }
        maven {
            name = "ins-integration-maven-releases-hosted"
            url = uri("https://artifactory.tcsbank.ru/artifactory/maven-all/ins-integration/")
            isAllowInsecureProtocol = false
            val u = System.getenv("ARTIFACTORY_USERNAME") ?: ""
            val p = System.getenv("ARTIFACTORY_PASSWORD") ?: ""
            if (u.isNotBlank()) credentials { username = u; password = p }
        }
    }
}
