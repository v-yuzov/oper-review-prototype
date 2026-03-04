package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Данные по одному плагину в отчёте: контент (LLM, комментарий, оценка) и порядок.
 * Ссылка на отчёт — [reportId].
 */
object ReportPluginDataTable : IntIdTable("report_plugin_data") {
    val reportId = reference("report_id", ReportTable, onDelete = ReferenceOption.CASCADE)
    val pluginId = varchar("plugin_id", 64)
    val customTitle = varchar("custom_title", 255).nullable()
    val sortOrder = integer("sort_order")
    val llmMarkdown = text("llm_markdown").default("")
    val userAnalysis = text("user_analysis").default("")
    val rating = integer("rating").nullable()
}
