package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Отчёт: привязка к юниту и дата (без времени).
 * Хранится в формате YYYY-MM-DD.
 */
object ReportTable : IntIdTable("report") {
    val unitId = reference("unit_id", UnitTable, onDelete = ReferenceOption.CASCADE)
    val reportDate = varchar("report_date", 10)
}
