package ru.oper.review.storage

import org.jetbrains.exposed.dao.id.IntIdTable

object HealthTable : IntIdTable("health") {
    val checkedAt = varchar("checked_at", 64)
}
