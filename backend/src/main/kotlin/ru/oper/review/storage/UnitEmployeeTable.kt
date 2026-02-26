package ru.oper.review.storage

import org.jetbrains.exposed.sql.Table

/**
 * Связь многие-ко-многим: сотрудники в юните.
 */
object UnitEmployeeTable : Table("unit_employee") {
    val unitId = reference("unit_id", UnitTable, onDelete = org.jetbrains.exposed.sql.ReferenceOption.CASCADE)
    val employeeId = reference("employee_id", EmployeeTable, onDelete = org.jetbrains.exposed.sql.ReferenceOption.CASCADE)

    override val primaryKey = PrimaryKey(unitId, employeeId)
}
