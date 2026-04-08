import { client } from "./client";
import type { TransactionDraft, VoiceTransactionDraftResponse } from "../types/interfaces";

export type { TransactionDraft, VoiceTransactionDraftResponse };

/**
 * Отправляет аудио-файл на сервер для транскрибации и парсинга в черновик транзакции.
 * Сервер проксирует в Groq Whisper (STT) → Groq LLaMA (парсинг).
 * Результат используется для предзаполнения формы — не сохраняет транзакцию в БД.
 *
 * @param blob - Аудио-данные из AudioRecorder
 * @param filename - Имя файла с расширением (.webm/.ogg/.mp4)
 * @param signal - AbortSignal для отмены запроса по таймауту
 * @returns Черновик транзакции для предзаполнения формы
 * @throws {Error} При сетевой ошибке, таймауте или ошибке сервера
 */
export async function sendVoiceTransaction(
    blob: Blob,
    filename: string,
    signal?: AbortSignal
): Promise<TransactionDraft> {
    const form = new FormData();
    form.append("audio", blob, filename);
    form.append("recorded_at", new Date().toISOString());

    let response: Response;
    try {
        response = await client("/api/transactions/voice", {
            method: "POST",
            body: form,
            signal,
        });
    } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
            throw new Error("Превышено время ожидания. Попробуйте ещё раз.");
        }
        throw new Error("Нет связи с сервером. Проверьте подключение.");
    }

    const body: VoiceTransactionDraftResponse = await response.json().catch(() => ({
        code: response.status,
        message: `Ошибка ${response.status}`,
        draft: null,
    } as unknown as VoiceTransactionDraftResponse));

    if (!response.ok) {
        throw new Error(body.message ?? `Ошибка сервера: ${response.status}`);
    }

    return body.draft;
}
