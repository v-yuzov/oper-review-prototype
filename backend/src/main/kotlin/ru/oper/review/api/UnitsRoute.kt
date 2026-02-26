package ru.oper.review.api

import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.innerJoin
import org.jetbrains.exposed.sql.leftJoin
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import ru.oper.review.storage.EmployeeTable
import ru.oper.review.storage.UnitEmployeeTable
import ru.oper.review.storage.UnitTable

fun Application.configureUnitsRouting() {
    routing {
        get("/api/units/root") {
            val rootId = transaction { rootUnitId() } ?: run {
                call.respond(io.ktor.http.HttpStatusCode.NotFound, mapOf("error" to "Root unit not found"))
                return@get
            }
            val view = transaction { buildUnitView(rootId) }
            if (view == null) {
                call.respond(io.ktor.http.HttpStatusCode.NotFound, mapOf("error" to "Root unit not found"))
                return@get
            }
            call.respond(view)
        }
        get("/api/units/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()
            if (id == null) {
                call.respond(io.ktor.http.HttpStatusCode.BadRequest, mapOf("error" to "Invalid unit id"))
                return@get
            }
            val view = transaction {
                buildUnitView(id)
            }
            if (view == null) {
                call.respond(io.ktor.http.HttpStatusCode.NotFound, mapOf("error" to "Unit not found"))
                return@get
            }
            call.respond(view)
        }
    }
}

private fun rootUnitId(): Int? = UnitTable
    .selectAll()
    .where { UnitTable.parentUnitId.isNull() }
    .limit(1)
    .firstOrNull()
    ?.get(UnitTable.id)?.value

private fun buildUnitView(unitId: Int): UnitViewDto? {
    val unitRow = UnitTable.selectAll().where { UnitTable.id eq unitId }.firstOrNull() ?: return null
    val unitName = unitRow.getOrNull(UnitTable.name) ?: ""
    val parentId = unitRow[UnitTable.parentUnitId]?.value

    val managerDto = unitRow[UnitTable.managerId]?.value?.let { managerId ->
        EmployeeTable.selectAll().where { EmployeeTable.id eq managerId }.firstOrNull()?.let { r ->
            EmployeeDto(
                id = r[EmployeeTable.id].value,
                name = r.getOrNull(EmployeeTable.name) ?: "",
                position = r.getOrNull(EmployeeTable.position)
            )
        }
    }

    val children = UnitTable
        .leftJoin(EmployeeTable) { UnitTable.managerId eq EmployeeTable.id }
        .selectAll()
        .where { UnitTable.parentUnitId eq EntityID(unitId, UnitTable) }
        .map { r ->
            ChildUnitDto(
                id = r[UnitTable.id].value,
                name = r.getOrNull(UnitTable.name) ?: "",
                managerName = r.getOrNull(EmployeeTable.name)
            )
        }

    val employees = UnitEmployeeTable
        .innerJoin(EmployeeTable) { UnitEmployeeTable.employeeId eq EmployeeTable.id }
        .selectAll()
        .where { UnitEmployeeTable.unitId eq EntityID(unitId, UnitTable) }
        .map { r ->
            EmployeeDto(
                id = r[EmployeeTable.id].value,
                name = r.getOrNull(EmployeeTable.name) ?: "",
                position = r.getOrNull(EmployeeTable.position)
            )
        }

    return UnitViewDto(
        id = unitId,
        name = unitName,
        parentId = parentId,
        manager = managerDto,
        children = children,
        employees = employees
    )
}
