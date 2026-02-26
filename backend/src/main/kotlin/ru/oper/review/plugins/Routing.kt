package ru.oper.review.plugins

import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import ru.oper.review.storage.HealthTable
import java.time.Instant

fun Application.configureRouting() {
    routing {
        get("/health") {
            transaction {
                HealthTable.insert {
                    it[checkedAt] = Instant.now().toString()
                }
            }
            call.respond(mapOf("status" to "ok", "service" to "oper-review-backend"))
        }
    }
}
