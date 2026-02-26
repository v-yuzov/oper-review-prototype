package ru.oper.review.api

import kotlinx.serialization.Serializable

@Serializable
data class ReportTemplatePluginDto(
    val pluginId: String,
    val customTitle: String? = null,
    val sortOrder: Int
)

@Serializable
data class ReportTemplateDto(
    val id: Int,
    val unitId: Int,
    val plugins: List<ReportTemplatePluginDto>
)

@Serializable
data class ReportTemplatePutDto(
    val plugins: List<ReportTemplatePluginDto>
)
