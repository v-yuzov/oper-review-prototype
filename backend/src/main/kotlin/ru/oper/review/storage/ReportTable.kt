package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Отчёт: привязка к юниту, дата проведения и снапшот формы (base64).
 * Данные по плагинам — в [ReportPluginDataTable].
 */
object ReportTable : IntIdTable("report") {
    val unitId = reference("unit_id", UnitTable, onDelete = ReferenceOption.CASCADE)
    val reportDate = varchar("report_date", 10)
    val snapshotBase64 = text("snapshot_base64").nullable()
}
