package ru.oper.review

import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import ru.oper.review.storage.EmployeeTable
import ru.oper.review.storage.UnitEmployeeTable
import ru.oper.review.storage.UnitTable

/**
 * Наполнение БД фейковыми данными: ИТ-департамент Галактической Империи.
 *
 * Можно накатывать на существующую БД: данные в [EmployeeTable], [UnitTable] и [UnitEmployeeTable]
 * предварительно очищаются (deleteAll), затем создаются недостающие таблицы/колонки и вставляются
 * новые записи.
 *
 * Запуск: из корня проекта `./gradlew -p backend seed`, из backend/ `./gradlew seed`.
 */
fun main() {
    val jdbcUrl = System.getProperty("storage.jdbcUrl")
        ?: System.getenv("STORAGE_JDBC_URL")
        ?: "jdbc:sqlite:./data/review.db"
    val driver = System.getProperty("storage.driver") ?: "org.sqlite.JDBC"

    Database.connect(jdbcUrl, driver = driver)

    transaction {
        SchemaUtils.createMissingTablesAndColumns(EmployeeTable, UnitTable, UnitEmployeeTable)

        UnitEmployeeTable.deleteAll()
        UnitTable.deleteAll()
        EmployeeTable.deleteAll()

        // Сотрудники: (имя, должность)
        val employees = listOf(
            "Палпатин (Darth Sidious)" to "Директор ИТ",
            "Дарт Вейдер (Энакин Скайуокер)" to "Руководитель отдела",
            "Адмирал Пиетт" to "Тимлид",
            "Штурмовик TK-421" to "Инженер",
            "Штурмовик TK-422" to "Инженер",
            "FN-2187" to "Инженер",
            "Джен Эрсо" to "Инженер",
            "Кассиан Андор" to "Инженер",
            "C-3PO" to "Тимлид",
            "R2-D2" to "Инженер",
            "BB-8" to "Инженер",
            "K-2SO" to "Инженер",
            "IG-88" to "Инженер",
            "IG-11" to "Инженер",
            "Доктор Корнелиус Эвазан" to "Тимлид",
            "Медробот GH-7" to "Врач",
            "Медробот 2-1B" to "Врач",
            "FX-7" to "Врач",
            "Карл" to "Стажер",
            "Гранд Мофф Таркин" to "Руководитель отдела",
            "Полковник Вульф Юларен" to "Тимлид",
            "Лэндо Калриссиан" to "Разработчик",
            "Ки-Ра" to "Разработчик",
            "Ксуандер" to "Разработчик",
            "Бодхи Рук" to "Разработчик",
            "Чиррут Имве" to "Разработчик",
            "Капитан Фазма" to "Тимлид",
            "Генерал Хакс" to "Инженер",
            "Лейтенант Митч" to "Инженер",
            "Лейтенант Родма" to "Инженер",
            "Капитан Карда" to "Инженер",
            "Капитан Джанд" to "Инженер",
            "Дженна Зан Арко" to "Тимлид",
            "Маз Каната" to "Дизайнер",
            "Элоди" to "Дизайнер",
            "Кайл Катарн" to "Дизайнер",
            "Джа-Джа Бинкс" to "UX-исследователь",
            "Уотто" to "Тестировщик",
            "Дарт Мол" to "Руководитель отдела",
            "Дарт Тиранус (граф Дуку)" to "Тимлид",
            "Второй брат" to "Инквизитор",
            "Пятый брат" to "Инквизитор",
            "Седьмая сестра" to "Инквизитор",
            "Девятая сестра" to "Инквизитор",
            "Асажж Вентресс" to "Теневой агент",
            "Штурмовик FN-2199" to "Офицер",
            "Штурмовик TK-909" to "Офицер",
            "Штурмовик TK-329" to "Офицер",
            "Штурмовик TD-110" to "Офицер",
            "Штурмовик-разведчик" to "Снайпер",
            "Орсон Кренник" to "Директор",
            "Адмирал Траун" to "Агент",
            "Гаррик Верс (Джин Эрсо)" to "Агент",
            "Гален Эрсо" to "Агент",
            "Мофф Гидеон" to "Криптограф",
        )

        employees.forEach { (name, position) ->
            EmployeeTable.insert {
                it[EmployeeTable.name] = name
                it[EmployeeTable.position] = position
            }
        }
        val employeeIds = EmployeeTable.selectAll().associate { it[EmployeeTable.name] to it[EmployeeTable.id].value }

        // Юниты: (название, родитель, руководитель)
        val units = listOf(
            Triple("ИТ-ДЕПАРТАМЕНТ ГАЛАКТИЧЕСКОЙ ИМПЕРИИ", null as String?, "Палпатин (Darth Sidious)"),
            Triple("УПРАВЛЕНИЕ КОСМИЧЕСКИМИ СИСТЕМАМИ", "ИТ-ДЕПАРТАМЕНТ ГАЛАКТИЧЕСКОЙ ИМПЕРИИ", "Дарт Вейдер (Энакин Скайуокер)"),
            Triple("Флот и серверные комнаты", "УПРАВЛЕНИЕ КОСМИЧЕСКИМИ СИСТЕМАМИ", "Адмирал Пиетт"),
            Triple("Робототехника и дроиды", "УПРАВЛЕНИЕ КОСМИЧЕСКИМИ СИСТЕМАМИ", "C-3PO"),
            Triple("Жизнеобеспечение и медслужба", "УПРАВЛЕНИЕ КОСМИЧЕСКИМИ СИСТЕМАМИ", "Доктор Корнелиус Эвазан"),
            Triple("РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ", "ИТ-ДЕПАРТАМЕНТ ГАЛАКТИЧЕСКОЙ ИМПЕРИИ", "Гранд Мофф Таркин"),
            Triple("Death Star OS", "РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ", "Полковник Вульф Юларен"),
            Triple("Гиперпространство и навигация", "РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ", "Капитан Фазма"),
            Triple("UI/UX и интерфейсы", "РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ", "Дженна Зан Арко"),
            Triple("КИБЕРБЕЗОПАСНОСТЬ И РАЗВЕДКА", "ИТ-ДЕПАРТАМЕНТ ГАЛАКТИЧЕСКОЙ ИМПЕРИИ", "Дарт Мол"),
            Triple("Ситхи и темные джедаи", "КИБЕРБЕЗОПАСНОСТЬ И РАЗВЕДКА", "Дарт Тиранус (граф Дуку)"),
            Triple("Штурмовики (физическая безопасность)", "КИБЕРБЕЗОПАСНОСТЬ И РАЗВЕДКА", "Капитан Фазма"),
            Triple("Разведка и контрразведка", "КИБЕРБЕЗОПАСНОСТЬ И РАЗВЕДКА", "Орсон Кренник"),
        )

        val unitIds = mutableMapOf<String, Int>()
        units.forEach { (unitName, parentName, managerName) ->
            val parentId = parentName?.let { unitIds[it] }?.let { EntityID(it, UnitTable) }
            val managerId = employeeIds[managerName]?.let { EntityID(it, EmployeeTable) }
            val stmt = UnitTable.insert {
                it[UnitTable.name] = unitName
                it[UnitTable.parentUnitId] = parentId
                it[UnitTable.managerId] = managerId
            }
            val id = stmt.resultedValues?.singleOrNull()?.get(UnitTable.id)?.value
                ?: UnitTable.selectAll().first { it[UnitTable.name] == unitName }[UnitTable.id].value
            unitIds[unitName] = id
        }

        fun assign(unitName: String, vararg employeeNames: String) {
            val uId = unitIds[unitName] ?: return
            employeeNames.forEach { name ->
                employeeIds[name]?.let { eId ->
                    try {
                        UnitEmployeeTable.insert {
                            it[UnitEmployeeTable.unitId] = EntityID(uId, UnitTable)
                            it[UnitEmployeeTable.employeeId] = EntityID(eId, EmployeeTable)
                        }
                    } catch (_: Exception) { /* дубликат пары (unit, employee) */ }
                }
            }
        }

        // Назначения сотрудников в юниты (все члены каждой команды)
        assign("ИТ-ДЕПАРТАМЕНТ ГАЛАКТИЧЕСКОЙ ИМПЕРИИ", "Палпатин (Darth Sidious)")
        assign("УПРАВЛЕНИЕ КОСМИЧЕСКИМИ СИСТЕМАМИ", "Дарт Вейдер (Энакин Скайуокер)")
        assign(
            "Флот и серверные комнаты",
            "Адмирал Пиетт", "Штурмовик TK-421", "Штурмовик TK-422", "FN-2187", "Джен Эрсо", "Кассиан Андор"
        )
        assign(
            "Робототехника и дроиды",
            "C-3PO", "R2-D2", "BB-8", "K-2SO", "IG-88", "IG-11"
        )
        assign(
            "Жизнеобеспечение и медслужба",
            "Доктор Корнелиус Эвазан", "Медробот GH-7", "Медробот 2-1B", "FX-7", "Карл"
        )
        assign("РАЗРАБОТКА ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ", "Гранд Мофф Таркин")
        assign(
            "Death Star OS",
            "Полковник Вульф Юларен", "Лэндо Калриссиан", "Ки-Ра", "Ксуандер", "Бодхи Рук", "Чиррут Имве"
        )
        assign(
            "Гиперпространство и навигация",
            "Капитан Фазма", "Генерал Хакс", "Лейтенант Митч", "Лейтенант Родма", "Капитан Карда", "Капитан Джанд"
        )
        assign(
            "UI/UX и интерфейсы",
            "Дженна Зан Арко", "Маз Каната", "Элоди", "Кайл Катарн", "Джа-Джа Бинкс", "Уотто"
        )
        assign("КИБЕРБЕЗОПАСНОСТЬ И РАЗВЕДКА", "Дарт Мол")
        assign(
            "Ситхи и темные джедаи",
            "Дарт Тиранус (граф Дуку)", "Второй брат", "Пятый брат", "Седьмая сестра", "Девятая сестра", "Асажж Вентресс"
        )
        assign(
            "Штурмовики (физическая безопасность)",
            "Капитан Фазма", "Штурмовик FN-2199", "Штурмовик TK-909", "Штурмовик TK-329", "Штурмовик TD-110", "Штурмовик-разведчик"
        )
        assign(
            "Разведка и контрразведка",
            "Орсон Кренник", "Адмирал Траун", "Дарт Вейдер (Энакин Скайуокер)", "Гаррик Верс (Джин Эрсо)", "Гален Эрсо", "Мофф Гидеон"
        )
    }

    println("Seed OK: сотрудники, юниты и назначения ИТ-департамента созданы.")
}
