package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Шаблон отчёта: один на юнит (unit_id уникален).
 */
object ReportTemplateTable : IntIdTable("report_template") {
    val unitId = reference("unit_id", UnitTable, onDelete = ReferenceOption.CASCADE).uniqueIndex()
}
