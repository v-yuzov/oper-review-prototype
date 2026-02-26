package ru.oper.review

import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.routing
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import ru.oper.review.api.configureUnitsRouting
import ru.oper.review.plugins.configureRouting
import ru.oper.review.storage.EmployeeTable
import org.slf4j.LoggerFactory
import ru.oper.review.storage.HealthTable
import ru.oper.review.storage.ReportTable
import ru.oper.review.storage.UnitEmployeeTable
import ru.oper.review.storage.UnitTable

private val log = LoggerFactory.getLogger("ru.oper.review.Application")

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module).start(wait = true)
}

fun Application.module() {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            prettyPrint = true
        })
    }
    install(CORS) {
        anyHost()
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            log.error("Unhandled exception", cause)
            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to (cause.message ?: "Unknown error")))
        }
    }

    val jdbcUrl = environment.config.propertyOrNull("storage.jdbcUrl")?.getString()
        ?: "jdbc:sqlite:./data/review.db"
    val driver = environment.config.propertyOrNull("storage.driver")?.getString() ?: "org.sqlite.JDBC"
    Database.connect(jdbcUrl, driver = driver)

    transaction {
        SchemaUtils.createMissingTablesAndColumns(
            EmployeeTable,
            UnitTable,
            UnitEmployeeTable,
            HealthTable,
            ReportTable
        )
    }

    routing {
        configureRouting()
        configureUnitsRouting()
    }
}
