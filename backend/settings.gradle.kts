rootProject.name = "oper-review-backend"

// Учётные данные Artifactory (опционально): ARTIFACTORY_USERNAME, ARTIFACTORY_PASSWORD.
// Читаем в каждом блоке через System.getenv — в settings.gradle.kts вложенные блоки не видят top-level переменные.

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
