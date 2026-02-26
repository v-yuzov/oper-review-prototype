package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable

/**
 * Сотрудник: Id + Name + должность (position).
 */
object EmployeeTable : IntIdTable("employee") {
    val name = varchar("name", 255)
    val position = varchar("position", 255).nullable()
}
