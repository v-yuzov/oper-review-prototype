package ru.oper.review.api

import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.routing
import io.ktor.http.HttpStatusCode
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.slf4j.LoggerFactory
import ru.oper.review.storage.ReportPluginDataTable
import ru.oper.review.storage.ReportTable
import ru.oper.review.storage.ReportTemplatePluginTable
import ru.oper.review.storage.ReportTemplateTable
import ru.oper.review.storage.UnitTable

private val log = LoggerFactory.getLogger("ru.oper.review.api.ReportRoute")

fun Application.configureReportsRouting() {
    routing {
        get("/api/units/{id}/report-template-by-hierarchy") {
            val unitId = call.parameters["id"]?.toIntOrNull()
            if (unitId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid unit id"))
                return@get
            }
            val templateUnitId = transaction { findUnitIdWithTemplate(unitId) }
            if (templateUnitId == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Report template not found in hierarchy"))
                return@get
            }
            val template = transaction {
                val row = ReportTemplateTable.selectAll()
                    .where { ReportTemplateTable.unitId eq EntityID(templateUnitId, UnitTable) }
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
                    unitId = templateUnitId,
                    plugins = plugins
                )
            }
            if (template == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Report template not found"))
                return@get
            }
            call.respond(template)
        }

        get("/api/units/{id}/reports") {
            val unitId = call.parameters["id"]?.toIntOrNull()
            if (unitId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid unit id"))
                return@get
            }
            val list = transaction {
                ReportTable.selectAll()
                    .where { ReportTable.unitId eq EntityID(unitId, UnitTable) }
                    .orderBy(ReportTable.reportDate, SortOrder.DESC)
                    .map { r ->
                        ReportListItemDto(
                            id = r[ReportTable.id].value,
                            unitId = r[ReportTable.unitId].value,
                            reportDate = r[ReportTable.reportDate]
                        )
                    }
            }
            call.respond(list)
        }

        get("/api/units/{unitId}/reports/{reportId}") {
            val unitId = call.parameters["unitId"]?.toIntOrNull()
            val reportId = call.parameters["reportId"]?.toIntOrNull()
            if (unitId == null || reportId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid id"))
                return@get
            }
            val report = transaction {
                val row = ReportTable.selectAll()
                    .where { ReportTable.id eq reportId }
                    .firstOrNull()
                    ?: return@transaction null
                if (row[ReportTable.unitId].value != unitId) return@transaction null
                val reportIdRef = EntityID(reportId, ReportTable)
                val plugins = ReportPluginDataTable.selectAll()
                    .where { ReportPluginDataTable.reportId eq reportIdRef }
                    .orderBy(ReportPluginDataTable.sortOrder)
                    .map { r ->
                        ReportPluginDataDto(
                            pluginId = r[ReportPluginDataTable.pluginId],
                            customTitle = r.getOrNull(ReportPluginDataTable.customTitle),
                            sortOrder = r[ReportPluginDataTable.sortOrder],
                            llmMarkdown = r[ReportPluginDataTable.llmMarkdown],
                            userAnalysis = r[ReportPluginDataTable.userAnalysis],
                            rating = r.getOrNull(ReportPluginDataTable.rating)
                        )
                    }
                ReportDto(
                    id = reportId,
                    unitId = unitId,
                    reportDate = row[ReportTable.reportDate],
                    snapshotBase64 = row.getOrNull(ReportTable.snapshotBase64),
                    plugins = plugins
                )
            }
            if (report == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Report not found"))
                return@get
            }
            call.respond(report)
        }

        post("/api/units/{id}/reports") {
            val unitId = call.parameters["id"]?.toIntOrNull()
            if (unitId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid unit id"))
                return@post
            }
            val body = try {
                call.receive<ReportPutDto>()
            } catch (e: Exception) {
                log.error("POST reports: failed to parse body", e)
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid body: ${e.message}"))
                return@post
            }
            val reportId = transaction {
                val unitExists = UnitTable.selectAll().where { UnitTable.id eq unitId }.any()
                if (!unitExists) return@transaction null
                val insert = ReportTable.insert {
                    it[ReportTable.unitId] = EntityID(unitId, UnitTable)
                    it[ReportTable.reportDate] = body.reportDate
                    it[ReportTable.snapshotBase64] = body.snapshotBase64
                }
                val id = insert.resultedValues?.singleOrNull()?.get(ReportTable.id)?.value
                    ?: return@transaction null
                body.plugins.forEachIndexed { index, dto ->
                    ReportPluginDataTable.insert {
                        it[ReportPluginDataTable.reportId] = EntityID(id, ReportTable)
                        it[ReportPluginDataTable.pluginId] = dto.pluginId
                        it[ReportPluginDataTable.customTitle] = dto.customTitle
                        it[ReportPluginDataTable.sortOrder] = dto.sortOrder
                        it[ReportPluginDataTable.llmMarkdown] = dto.llmMarkdown
                        it[ReportPluginDataTable.userAnalysis] = dto.userAnalysis
                        it[ReportPluginDataTable.rating] = dto.rating
                    }
                }
                id
            }
            if (reportId == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Unit not found"))
                return@post
            }
            val created = transaction {
                val row = ReportTable.selectAll().where { ReportTable.id eq reportId }.firstOrNull() ?: return@transaction null
                val reportIdRef = EntityID(reportId, ReportTable)
                val plugins = ReportPluginDataTable.selectAll()
                    .where { ReportPluginDataTable.reportId eq reportIdRef }
                    .orderBy(ReportPluginDataTable.sortOrder)
                    .map { r ->
                        ReportPluginDataDto(
                            pluginId = r[ReportPluginDataTable.pluginId],
                            customTitle = r.getOrNull(ReportPluginDataTable.customTitle),
                            sortOrder = r[ReportPluginDataTable.sortOrder],
                            llmMarkdown = r[ReportPluginDataTable.llmMarkdown],
                            userAnalysis = r[ReportPluginDataTable.userAnalysis],
                            rating = r.getOrNull(ReportPluginDataTable.rating)
                        )
                    }
                ReportDto(
                    id = reportId,
                    unitId = unitId,
                    reportDate = row[ReportTable.reportDate],
                    snapshotBase64 = row.getOrNull(ReportTable.snapshotBase64),
                    plugins = plugins
                )
            }
            call.respond(HttpStatusCode.Created, created!!)
        }

        put("/api/units/{unitId}/reports/{reportId}") {
            val unitId = call.parameters["unitId"]?.toIntOrNull()
            val reportId = call.parameters["reportId"]?.toIntOrNull()
            if (unitId == null || reportId == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid id"))
                return@put
            }
            val body = try {
                call.receive<ReportPutDto>()
            } catch (e: Exception) {
                log.error("PUT report: failed to parse body", e)
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid body: ${e.message}"))
                return@put
            }
            val ok = transaction {
                val row = ReportTable.selectAll()
                    .where { ReportTable.id eq reportId }
                    .firstOrNull() ?: return@transaction false
                if (row[ReportTable.unitId].value != unitId) return@transaction false
                ReportTable.update({ ReportTable.id eq reportId }) {
                    it[ReportTable.reportDate] = body.reportDate
                    it[ReportTable.snapshotBase64] = body.snapshotBase64
                }
                val reportIdRef = EntityID(reportId, ReportTable)
                ReportPluginDataTable.deleteWhere { ReportPluginDataTable.reportId eq reportIdRef }
                body.plugins.forEach { dto ->
                    ReportPluginDataTable.insert {
                        it[ReportPluginDataTable.reportId] = reportIdRef
                        it[ReportPluginDataTable.pluginId] = dto.pluginId
                        it[ReportPluginDataTable.customTitle] = dto.customTitle
                        it[ReportPluginDataTable.sortOrder] = dto.sortOrder
                        it[ReportPluginDataTable.llmMarkdown] = dto.llmMarkdown
                        it[ReportPluginDataTable.userAnalysis] = dto.userAnalysis
                        it[ReportPluginDataTable.rating] = dto.rating
                    }
                }
                true
            }
            if (!ok) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Report not found"))
                return@put
            }
            val updated = transaction {
                val row = ReportTable.selectAll().where { ReportTable.id eq reportId }.firstOrNull() ?: return@transaction null
                val reportIdRef = EntityID(reportId, ReportTable)
                val plugins = ReportPluginDataTable.selectAll()
                    .where { ReportPluginDataTable.reportId eq reportIdRef }
                    .orderBy(ReportPluginDataTable.sortOrder)
                    .map { r ->
                        ReportPluginDataDto(
                            pluginId = r[ReportPluginDataTable.pluginId],
                            customTitle = r.getOrNull(ReportPluginDataTable.customTitle),
                            sortOrder = r[ReportPluginDataTable.sortOrder],
                            llmMarkdown = r[ReportPluginDataTable.llmMarkdown],
                            userAnalysis = r[ReportPluginDataTable.userAnalysis],
                            rating = r.getOrNull(ReportPluginDataTable.rating)
                        )
                    }
                ReportDto(
                    id = reportId,
                    unitId = unitId,
                    reportDate = row[ReportTable.reportDate],
                    snapshotBase64 = row.getOrNull(ReportTable.snapshotBase64),
                    plugins = plugins
                )
            }
            call.respond(updated!!)
        }
    }
}

/**
 * Поднимается по иерархии (unit → parent → …) и возвращает id первого юнита, у которого есть шаблон отчёта.
 */
private fun findUnitIdWithTemplate(unitId: Int): Int? {
    var currentId: Int? = unitId
    while (currentId != null) {
        val id = currentId
        val hasTemplate = ReportTemplateTable.selectAll()
            .where { ReportTemplateTable.unitId eq EntityID(id, UnitTable) }
            .any()
        if (hasTemplate) return id
        val parentId = UnitTable.selectAll()
            .where { UnitTable.id eq id }
            .firstOrNull()
            ?.get(UnitTable.parentUnitId)?.value
        currentId = parentId
    }
    return null
}
