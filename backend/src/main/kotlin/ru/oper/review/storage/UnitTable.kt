package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

/**
 * Юнит: подразделение с иерархией (юниты могут входить друг в друга).
 * Id + Name + ManagerId (руководитель юнита — сотрудник) + ParentUnitId (родительское подразделение).
 */
object UnitTable : IntIdTable("unit") {
    val name = varchar("name", 255)
    val managerId = reference("manager_id", EmployeeTable, ReferenceOption.SET_NULL).nullable()
    val parentUnitId = reference("parent_unit_id", UnitTable, ReferenceOption.SET_NULL).nullable()
}
