package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Плагин в шаблоне отчёта: plugin_id, опциональный заголовок, порядок.
 * Для plugin_id = "custom" строк может быть несколько; для остальных — по одной на шаблон.
 */
object ReportTemplatePluginTable : IntIdTable("report_template_plugin") {
    val reportTemplateId = reference("report_template_id", ReportTemplateTable, onDelete = ReferenceOption.CASCADE)
    val pluginId = varchar("plugin_id", 64)
    val customTitle = varchar("custom_title", 255).nullable()
    val sortOrder = integer("sort_order")
}
