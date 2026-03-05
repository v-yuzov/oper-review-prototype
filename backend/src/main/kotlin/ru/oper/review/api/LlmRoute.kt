package ru.oper.review.api

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import io.ktor.http.HttpStatusCode
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import org.slf4j.LoggerFactory

private val log = LoggerFactory.getLogger("ru.oper.review.api.LlmRoute")

/** Маскирует токен: первые 10 символов + «…». */
fun maskToken(token: String?): String =
    token?.take(10)?.let { if (it.length == 10) "$it…" else it } ?: "(не задан)"

/** Собирает цепочку cause в одну строку для лога (корневая причина в конце). */
private fun Throwable.causeChain(): String {
    val parts = mutableListOf("$javaClass.simpleName: ${message ?: ""}")
    var c: Throwable? = cause
    while (c != null) {
        parts.add("  <- ${c.javaClass.simpleName}: ${c.message ?: ""}")
        c = c.cause
    }
    return parts.joinToString(" ")
}

@Serializable
data class LlmAnalyzeRequest(
    val pluginPrompt: String,
    val chartDataJson: String? = null,
)

@Serializable
data class LlmAnalyzeResponse(
    val content: String,
)

@Serializable
data class ProxyMessage(val role: String, val content: String)

@Serializable
data class ProxyRequest(
    val model: String,
    val messages: List<ProxyMessage>,
    @kotlinx.serialization.SerialName("max_tokens") val maxTokens: Int,
)

/** Адрес LLM Proxy и токен: из env LLM_URL, LLM_TOKEN. */
fun llmProxyUrl(): String? =
    System.getenv("LLM_URL")
        ?: "https://llm-proxy.t-tech.team"

fun llmToken(): String? =
    System.getenv("LLM_TOKEN")

fun Application.configureLlmRouting() {
    val baseUrl = llmProxyUrl()
    val token = llmToken()
    if (token.isNullOrBlank()) {
        log.warn("LLM_TOKEN не задан — эндпоинт /api/llm/analyze будет возвращать 503.")
    }

    val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
        install(HttpTimeout) {
            connectTimeoutMillis = 10_000   // 10s — как connect в httpx
            requestTimeoutMillis = 120_000 // 120s — как read в httpx
            socketTimeoutMillis = 120_000  // 120s — ожидание данных
        }
        expectSuccess = false
    }

    routing {
        post("/api/llm/analyze") {
            val body = call.receive<LlmAnalyzeRequest>()
            val requestUrl = "${baseUrl?.trimEnd('/') ?: "null"}/chat/completions"
            val tokenMasked = maskToken(token)
            log.info("LLM request: url=$requestUrl, token=$tokenMasked, pluginPrompt.length=${body.pluginPrompt.length}, chartDataJson.length=${body.chartDataJson?.length ?: 0}")

            if (token.isNullOrBlank()) {
                val msg = "LLM не настроен: задайте LLM_TOKEN (и при необходимости LLM_URL) в переменных окружения."
                log.warn("LLM 503: $msg")
                call.respond(
                    HttpStatusCode.ServiceUnavailable,
                    mapOf("error" to msg, "details" to "LLM_TOKEN пуст или не задан.")
                )
                return@post
            }
            val userContent = buildString {
                append(body.pluginPrompt)
                if (!body.chartDataJson.isNullOrBlank()) {
                    append("\n\nПроанализируй данные графика (JSON):\n")
                    append(body.chartDataJson)
                }
            }
            val messages = listOf(
                ProxyMessage(
                    role = "system",
                    content = "Ты — аналитик процессов в ИТ-команде. Твоя задача — по запросу пользователя и переданным данным (в т.ч. JSON графика) сформулировать краткий аналитический вывод. Отвечай по существу, без вступлений. Формат — текст (можно с абзацами), без обёртки в JSON, если пользователь не просит иное."
                ),
                ProxyMessage(role = "user", content = userContent)
            )
            val proxyBody = ProxyRequest(
                model = "tgpt/t-pro-it-2-1-fp8",
                messages = messages,
                maxTokens = 1024
            )
            log.info("LLM proxy params: model=${proxyBody.model}, maxTokens=${proxyBody.maxTokens}, userContent.length=${userContent.length}")
            try {
                val response = client.post(requestUrl) {
                    header(HttpHeaders.Authorization, "Bearer $token")
                    contentType(ContentType.Application.Json)
                    setBody(proxyBody)
                }
                val status = response.status.value
                val responseText = response.bodyAsText()
                if (status !in 200..299) {
                    val details = responseText.take(1000)
                    val debug = buildString {
                        appendLine("url=$requestUrl")
                        appendLine("token=$tokenMasked")
                        appendLine("status=$status")
                        appendLine("responseLength=${responseText.length}")
                        append("responseStart=").appendLine(details)
                    }
                    log.error(
                        "LLM proxy error: url=$requestUrl, token=$tokenMasked, status=$status, " +
                            "responseLength=${responseText.length}, responseStart=$details"
                    )
                    call.respond(
                        HttpStatusCode.BadGateway,
                        mapOf(
                            "error" to "LLM proxy вернул ошибку (код $status)",
                            "details" to details,
                            "debug" to debug
                        )
                    )
                    return@post
                }
                val json = Json.parseToJsonElement(responseText).jsonObject
                val choices = json["choices"]?.jsonArray ?: emptyList()
                val firstChoice = choices.firstOrNull() as? JsonObject
                val message = firstChoice?.get("message") as? JsonObject
                val content = (message?.get("content") as? JsonPrimitive)?.content ?: ""
                log.info("LLM success: content.length=${content.length}")
                call.respond(LlmAnalyzeResponse(content = content))
            } catch (e: Exception) {
                val chain = e.causeChain()
                log.error("LLM ERROR: $chain")
                log.error("LLM request failed: url=$requestUrl, token=$tokenMasked", e)
                val detailsForClient = chain
                val debug = buildString {
                    appendLine("url=$requestUrl")
                    appendLine("token=$tokenMasked")
                    appendLine("error=$chain")
                }
                call.respond(
                    HttpStatusCode.BadGateway,
                    mapOf(
                        "error" to "Ошибка запроса к LLM",
                        "details" to detailsForClient,
                        "debug" to debug
                    )
                )
            }
        }
    }
}
