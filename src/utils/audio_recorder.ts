/**
 * Поддерживаемые состояния рекордера.
 */
export type RecorderState = "idle" | "recording" | "stopped" | "error";

/**
 * Результат успешной записи аудио.
 */
export interface RecordingResult {
    blob: Blob;
    durationMs: number;
    mimeType: string;
    filename: string;
}

/**
 * Класс для записи аудио с микрофона через MediaRecorder API.
 * Оптимизирован для Speech-to-Text: mono, 16kHz, подавление шума.
 *
 * @class AudioRecorder
 * @example
 * const recorder = new AudioRecorder();
 * await recorder.start();
 * const result = await recorder.stop();
 */
export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private chunks: Blob[] = [];
    private startTime = 0;
    private _state: RecorderState = "idle";

    private static readonly PREFERRED_MIME_TYPES = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
    ];

    /**
     * Возвращает лучший поддерживаемый браузером MIME-тип.
     * @returns MIME-тип или пустую строку (браузер выберет сам)
     */
    static getSupportedMimeType(): string {
        for (const mime of AudioRecorder.PREFERRED_MIME_TYPES) {
            if (MediaRecorder.isTypeSupported(mime)) return mime;
        }
        return "";
    }

    /**
     * Текущее состояние рекордера.
     */
    get state(): RecorderState {
        return this._state;
    }

    /**
     * Запрашивает доступ к микрофону и начинает запись.
     * @throws {Error} Если доступ к микрофону запрещён или устройство не найдено
     */
    async start(): Promise<void> {
        if (this._state === "recording") {
            throw new Error("Запись уже идёт");
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
        } catch (err) {
            this._state = "error";
            if (err instanceof DOMException) {
                if (err.name === "NotAllowedError") {
                    throw new Error(
                        "Нет доступа к микрофону. Разрешите доступ в настройках браузера."
                    );
                }
                if (err.name === "NotFoundError") {
                    throw new Error("Микрофон не найден.");
                }
            }
            throw err;
        }

        const mimeType = AudioRecorder.getSupportedMimeType();
        this.mediaRecorder = new MediaRecorder(
            this.stream,
            mimeType ? { mimeType } : undefined
        );
        this.chunks = [];
        this.startTime = Date.now();
        this._state = "recording";

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.mediaRecorder.start(250);
    }

    /**
     * Останавливает запись и возвращает аудио-файл.
     * @returns Промис с результатом записи
     * @throws {Error} Если рекордер не в состоянии recording или запись пустая
     */
    stop(): Promise<RecordingResult> {
        return new Promise((resolve, reject) => {
            if (this._state !== "recording" || !this.mediaRecorder) {
                return reject(new Error("Запись не активна"));
            }

            this.mediaRecorder.onstop = () => {
                const mimeType = this.mediaRecorder?.mimeType ?? "audio/webm";
                const blob = new Blob(this.chunks, { type: mimeType });
                const durationMs = Date.now() - this.startTime;
                const ext = mimeType.includes("ogg")
                    ? "ogg"
                    : mimeType.includes("mp4")
                      ? "mp4"
                      : "webm";
                const filename = `voice_${Date.now()}.${ext}`;

                this.cleanup();
                this._state = "stopped";

                if (blob.size === 0) {
                    return reject(new Error("Аудио пустое — попробуйте ещё раз"));
                }

                resolve({ blob, durationMs, mimeType, filename });
            };

            this.mediaRecorder.onerror = () => {
                this.cleanup();
                this._state = "error";
                reject(new Error("Ошибка MediaRecorder"));
            };

            this.mediaRecorder.stop();
        });
    }

    private cleanup(): void {
        this.stream?.getTracks().forEach((t) => t.stop());
        this.stream = null;
        this.chunks = [];
    }
}