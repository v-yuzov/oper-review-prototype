package ru.oper.review.api

import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import io.ktor.server.routing.routing
import io.ktor.http.HttpStatusCode
import org.jetbrains.exposed.dao.id.EntityID
import org.slf4j.LoggerFactory
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import ru.oper.review.storage.ReportTemplatePluginTable
import ru.oper.review.storage.ReportTemplateTable
import ru.oper.review.storage.UnitTable

private val log = LoggerFactory.getLogger("ru.oper.review.api.ReportTemplateRoute")

fun Application.configureReportTemplateRouting() {
    routing {
        get("/api/units/{id}/report-template") {
            val unitId = call.parameters["id"]?.toIntOrNull()
            if (unitId == null) {
                log.warn("GET report-template: invalid unit id")
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid unit id"))
                return@get
            }
            log.debug("GET report-template unitId={}", unitId)
            val template = transaction {
                val unitExists = UnitTable.selectAll().where { UnitTable.id eq unitId }.any()
                if (!unitExists) return@transaction null
                val row = ReportTemplateTable.selectAll()
                    .where { ReportTemplateTable.unitId eq unitId }
                    .firstOrNull() ?: return@transaction null
                val templateId = row[ReportTemplateTable.id].value
                val templateIdRef = EntityID(templateId, ReportTemplateTable)
                val plugins = ReportTemplatePluginTable.selectAll()
                    .where { ReportTemplatePluginTable.reportTemplateId eq templateIdRef }
                    .orderBy(ReportTemplatePluginTable.sortOrder)
                    .map { r ->
                        ReportTemplatePluginDto(
                            pluginId = r[ReportTemplatePluginTable.pluginId],
                            customTitle = r.getOrNull(ReportTemplatePluginTable.customTitle),
                            sortOrder = r[ReportTemplatePluginTable.sortOrder]
                        )
                    }
                ReportTemplateDto(
                    id = templateId,
                    unitId = unitId,
                    plugins = plugins
                )
            }
            if (template == null) {
                log.debug("GET report-template unitId={}: not found", unitId)
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Report template not found"))
                return@get
            }
            log.debug("GET report-template unitId={}: ok, plugins={}", unitId, template.plugins.size)
            call.respond(template)
        }

        put("/api/units/{id}/report-template") {
            val unitId = call.parameters["id"]?.toIntOrNull()
            if (unitId == null) {
                log.warn("PUT report-template: invalid unit id")
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid unit id"))
                return@put
            }
            val body = try {
                call.receive<ReportTemplatePutDto>()
            } catch (e: Exception) {
                log.error("PUT report-template unitId={}: failed to parse body", unitId, e)
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid body: ${e.message}"))
                return@put
            }
            log.info("PUT report-template unitId={} plugins={}", unitId, body.plugins.size)
            val result = try {
                transaction {
                val unitExists = UnitTable.selectAll().where { UnitTable.id eq unitId }.any()
                if (!unitExists) return@transaction null
                var templateId = ReportTemplateTable.selectAll()
                    .where { ReportTemplateTable.unitId eq unitId }
                    .firstOrNull()?.get(ReportTemplateTable.id)?.value
                if (templateId == null) {
                    ReportTemplateTable.insert {
                        it[ReportTemplateTable.unitId] = EntityID(unitId, UnitTable)
                    }
                    templateId = ReportTemplateTable.selectAll()
                        .where { ReportTemplateTable.unitId eq unitId }
                        .first()[ReportTemplateTable.id].value
                }
                val templateIdRef = EntityID(templateId!!, ReportTemplateTable)
                ReportTemplatePluginTable.deleteWhere {
                    reportTemplateId eq templateIdRef
                }
                body.plugins.forEachIndexed { index, dto ->
                    ReportTemplatePluginTable.insert {
                        it[reportTemplateId] = templateIdRef
                        it[pluginId] = dto.pluginId
                        it[customTitle] = dto.customTitle
                        it[sortOrder] = dto.sortOrder
                    }
                }
                val plugins = ReportTemplatePluginTable.selectAll()
                    .where { ReportTemplatePluginTable.reportTemplateId eq templateIdRef }
                    .orderBy(ReportTemplatePluginTable.sortOrder)
                    .map { r ->
                        ReportTemplatePluginDto(
                            pluginId = r[ReportTemplatePluginTable.pluginId],
                            customTitle = r.getOrNull(ReportTemplatePluginTable.customTitle),
                            sortOrder = r[ReportTemplatePluginTable.sortOrder]
                        )
                    }
                ReportTemplateDto(
                    id = templateId,
                    unitId = unitId,
                    plugins = plugins
                )
                }
            } catch (e: Exception) {
                log.error("PUT report-template unitId={}: transaction failed", unitId, e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("error" to (e.message ?: "Transaction failed"))
                )
                return@put
            }
            if (result == null) {
                log.warn("PUT report-template unitId={}: unit not found", unitId)
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Unit not found"))
                return@put
            }
            log.info("PUT report-template unitId={}: saved, templateId={}", unitId, result.id)
            call.respond(result)
        }
    }
}
