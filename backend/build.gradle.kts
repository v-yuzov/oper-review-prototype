plugins {
    kotlin("jvm") version "2.2.10"
    kotlin("plugin.serialization") version "2.2.10"
    application
}

group = "ru.oper.review"
version = "0.1.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

// Учётные данные Artifactory (опционально): gradle.properties (artifactoryUsername, artifactoryPassword)
// или переменные окружения ARTIFACTORY_USERNAME, ARTIFACTORY_PASSWORD
val artifactoryUsername = project.findProperty("artifactoryUsername") as String? ?: System.getenv("ARTIFACTORY_USERNAME") ?: ""
val artifactoryPassword = project.findProperty("artifactoryPassword") as String? ?: System.getenv("ARTIFACTORY_PASSWORD") ?: ""

repositories {
    // Artifactory: зеркало Maven Central и хосты (как в settings.xml)
    maven {
        name = "maven-proxy"
        url = uri("https://artifactory.tcsbank.ru/artifactory/maven-proxy/")
        isAllowInsecureProtocol = false
        if (artifactoryUsername.isNotBlank()) {
            credentials {
                username = artifactoryUsername
                password = artifactoryPassword
            }
        }
    }
    maven {
        name = "tinkoff-maven-releases-hosted"
        url = uri("https://artifactory.tcsbank.ru/artifactory/maven-all/")
        isAllowInsecureProtocol = false
        if (artifactoryUsername.isNotBlank()) {
            credentials {
                username = artifactoryUsername
                password = artifactoryPassword
            }
        }
    }
    maven {
        name = "ins-integration-maven-releases-hosted"
        url = uri("https://artifactory.tcsbank.ru/artifactory/maven-all/ins-integration/")
        isAllowInsecureProtocol = false
        if (artifactoryUsername.isNotBlank()) {
            credentials {
                username = artifactoryUsername
                password = artifactoryPassword
            }
        }
    }
    mavenCentral()
}

val ktorVersion = "3.0.3"
val exposedVersion = "0.54.0"

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-cors-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-status-pages-jvm:$ktorVersion")
    implementation("io.ktor:ktor-client-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-client-cio-jvm:$ktorVersion")
    implementation("io.ktor:ktor-client-content-negotiation-jvm:$ktorVersion")

    implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")
    implementation("org.xerial:sqlite-jdbc:3.47.1.0")

    implementation("ch.qos.logback:logback-classic:1.5.16")

    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5:2.2.10")
    testImplementation("io.ktor:ktor-server-test-host-jvm:$ktorVersion")
    testImplementation("io.ktor:ktor-client-content-negotiation-jvm:$ktorVersion")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

application {
    mainClass.set("ru.oper.review.ApplicationKt")
}

tasks.register<JavaExec>("seed") {
    group = "application"
    description = "Наполнение БД фейковыми данными (ИТ-департамент)"
    mainClass.set("ru.oper.review.SeedDataKt")
    classpath = sourceSets["main"].runtimeClasspath
    workingDir = project.projectDir
}

tasks.test {
    useJUnitPlatform()
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    }
}
