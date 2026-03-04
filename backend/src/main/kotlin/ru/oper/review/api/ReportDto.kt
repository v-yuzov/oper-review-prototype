package ru.oper.review.api

import kotlinx.serialization.Serializable

@Serializable
data class ReportPluginDataDto(
    val pluginId: String,
    val customTitle: String? = null,
    val sortOrder: Int,
    val llmMarkdown: String = "",
    val userAnalysis: String = "",
    val rating: Int? = null
)

@Serializable
data class ReportDto(
    val id: Int,
    val unitId: Int,
    val reportDate: String,
    val snapshotBase64: String? = null,
    val plugins: List<ReportPluginDataDto>
)

@Serializable
data class ReportListItemDto(
    val id: Int,
    val unitId: Int,
    val reportDate: String
)

@Serializable
data class ReportPutDto(
    val reportDate: String,
    val snapshotBase64: String? = null,
    val plugins: List<ReportPluginDataDto>
)
