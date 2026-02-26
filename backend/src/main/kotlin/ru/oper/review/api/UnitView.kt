package ru.oper.review.api

import kotlinx.serialization.Serializable

@Serializable
data class EmployeeDto(val id: Int, val name: String, val position: String?)

@Serializable
data class ChildUnitDto(val id: Int, val name: String, val managerName: String? = null)

@Serializable
data class UnitViewDto(
    val id: Int,
    val name: String,
    val parentId: Int?,
    val manager: EmployeeDto?,
    val children: List<ChildUnitDto>,
    val employees: List<EmployeeDto>
)
