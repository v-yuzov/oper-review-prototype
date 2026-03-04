package ru.oper.review.api

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
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
        expectSuccess = false
    }

    routing {
        post("/api/llm/analyze") {
            if (token.isNullOrBlank()) {
                call.respond(
                    HttpStatusCode.ServiceUnavailable,
                    mapOf("error" to "LLM not configured: set LLM_TOKEN (and optionally LLM_URL)")
                )
                return@post
            }
            val body = call.receive<LlmAnalyzeRequest>()
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
            try {
                val response = client.post("$baseUrl/chat/completions") {
                    header(HttpHeaders.Authorization, "Bearer $token")
                    contentType(ContentType.Application.Json)
                    setBody(proxyBody)
                }
                val status = response.status.value
                val responseText = response.bodyAsText()
                if (status !in 200..299) {
                    log.error("LLM proxy error: $status $responseText")
                    call.respond(
                        HttpStatusCode.BadGateway,
                        mapOf("error" to "LLM proxy error", "details" to responseText.take(500))
                    )
                    return@post
                }
                val json = Json.parseToJsonElement(responseText).jsonObject
                val choices = json["choices"]?.jsonArray ?: emptyList()
                val firstChoice = choices.firstOrNull() as? JsonObject
                val message = firstChoice?.get("message") as? JsonObject
                val content = (message?.get("content") as? JsonPrimitive)?.content ?: ""
                call.respond(LlmAnalyzeResponse(content = content))
            } catch (e: Exception) {
                log.error("LLM request failed", e)
                call.respond(
                    HttpStatusCode.BadGateway,
                    mapOf("error" to (e.message ?: "LLM request failed"))
                )
            }
        }
    }
}
