import { BasePage } from "../base_page";
import { TransactionForm } from "../../components/TransactionsForm/transactions_form";
import { AudioRecorder } from "../../utils/audio_recorder";
import { sendVoiceTransaction } from "../../api/voice";
import type { TransactionDraft } from "../../types/interfaces";
// @ts-ignore
import template from "./transactions_create.hbs?raw";
import "./transactions_create.scss";

export class TransactionCreatePage extends BasePage {
    private recorder = new AudioRecorder();
    private isFastMode = false;
    private fastModeTimer: number | null = null;

    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <main class="page__content">
                    <div class="transactions-create">
                        <div class="transactions-create__container">
                            <div class="transactions-create__voice">
                                <p class="transactions-create__voice-label">Добавить голосом</p>
                                <div class="transactions-create__voice-controls">
                                    <div class="transactions-create__voice-group">
                                        <button id="voice-start-btn" class="transactions-create__voice-btn transactions-create__voice-btn--primary">
                                            <span class="transactions-create__voice-btn-icon">🎙</span> Начать
                                        </button>
                                        <span class="transactions-create__voice-hint">Предзаполнит форму</span>
                                    </div>

                                    <div class="transactions-create__voice-group">
                                        <button id="voice-fast-btn" class="transactions-create__voice-btn transactions-create__voice-btn--primary" style="background: #6366f1;">
                                            <span class="transactions-create__voice-btn-icon">⚡</span> Сразу
                                        </button>
                                        <span class="transactions-create__voice-hint">Создаст мгновенно</span>
                                    </div>

                                    <div class="transactions-create__voice-group">
                                        <button id="voice-stop-btn" class="transactions-create__voice-btn transactions-create__voice-btn--secondary" disabled>
                                            <span class="transactions-create__voice-btn-icon">⏹</span> Стоп
                                        </button>
                                        <span class="transactions-create__voice-hint">&nbsp;</span>
                                    </div>
                                </div>
                                <div id="voice-status" class="transactions-create__voice-status"></div>
                            </div>
                            <div class="transactions-create__divider">
                                <span class="transactions-create__divider-line"></span>
                                <span class="transactions-create__divider-text">или введите вручную</span>
                                <span class="transactions-create__divider-line"></span>
                            </div>
                            <div id="form_container"></div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        const formContainer = root.querySelector<HTMLElement>("#form_container")!;
        const form = new TransactionForm();
        form.render(formContainer);
        this._components.push(form);

        this.initVoiceControls(root);
    }

    private initVoiceControls(root: HTMLElement): void {
        const startBtn = root.querySelector<HTMLButtonElement>("#voice-start-btn")!;
        const fastBtn = root.querySelector<HTMLButtonElement>("#voice-fast-btn")!;
        const stopBtn = root.querySelector<HTMLButtonElement>("#voice-stop-btn")!;
        const statusEl = root.querySelector<HTMLElement>("#voice-status")!;

        startBtn.onclick = () => {
            this.isFastMode = false;
            this.handleStart(startBtn, fastBtn, stopBtn, statusEl);
        };

        fastBtn.onclick = () => {
            this.isFastMode = true;
            this.handleStart(startBtn, fastBtn, stopBtn, statusEl);
            this.setStatus(statusEl, "⚡ Режим «Сразу» (запись 10с)...", "recording");
            
            this.fastModeTimer = window.setTimeout(() => {
                this.handleStop(startBtn, fastBtn, stopBtn, statusEl, root);
            }, 10000);
        };

        stopBtn.onclick = () => {
            if (this.fastModeTimer) clearTimeout(this.fastModeTimer);
            this.handleStop(startBtn, fastBtn, stopBtn, statusEl, root);
        };
    }

    private async handleStart(s: HTMLElement, f: HTMLElement, stop: HTMLButtonElement, st: HTMLElement) {
        try {
            await this.recorder.start();
            this.toggleBtns([s, f], true, stop, false);
            if (!this.isFastMode) this.setStatus(st, "🔴 Запись...", "recording");
        } catch (e) {
            this.setStatus(st, `❌ ${(e as Error).message}`, "error");
        }
    }

    private async handleStop(s: HTMLElement, f: HTMLElement, stop: HTMLButtonElement, st: HTMLElement, root: HTMLElement) {
        if (this.recorder.state !== "recording") return;
        
        this.toggleBtns([s, f, stop], true, null, true);
        this.setStatus(st, "⏳ Обработка...", "processing");

        try {
            const { blob, filename } = await this.recorder.stop();
            const draft = await sendVoiceTransaction(blob, filename);
            
            this.prefillForm(root, draft);

            if (this.isFastMode) {
                this.setStatus(st, "✅ Транзакция создана!", "success");
                const formEl = root.querySelector<HTMLFormElement>("#transaction_form");
                formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            } else {
                this.setStatus(st, `✅ «${draft.raw_text}»`, "success");
            }
        } catch (e) {
            this.setStatus(st, `❌ ${(e as Error).message}`, "error");
        } finally {
            this.toggleBtns([s, f], false, stop, true);
            this.isFastMode = false;
        }
    }

    private toggleBtns(btns: HTMLElement[], d: boolean, stop: HTMLButtonElement | null, sd: boolean) {
        btns.forEach(b => (b as HTMLButtonElement).disabled = d);
        if (stop) stop.disabled = sd;
    }

    private setStatus(el: HTMLElement, text: string, state: string) {
        el.textContent = text;
        el.className = `transactions-create__voice-status transactions-create__voice-status--${state}`;
    }

    private prefillForm(root: HTMLElement, draft: TransactionDraft): void {
        if (!draft) return;
        const setValue = (id: string, value: string) => {
            const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`);
            if (el) el.value = value;
        };
        const setCustomSelect = (idPrefix: string, value: string) => {
            if (!value) return;
            const input = root.querySelector<HTMLInputElement>(`#${idPrefix}_input`);
            const display = root.querySelector<HTMLElement>(`#${idPrefix}_display`);
            const dropdown = root.querySelector<HTMLElement>(`#${idPrefix}_dropdown`);
            if (!input || !display || !dropdown) return;

            const categoryMap: Record<string, string> = {
                "groceries": "Продукты", "restaurant": "Рестораны", "transport": "Транспорт",
                "entertainment": "Развлечения", "health": "Здоровье", "utilities": "ЖКХ",
                "shopping": "Покупки", "salary": "Зарплата", "transfer": "Переводы", "other": "Другое"
            };

            const targetValue = categoryMap[value.toLowerCase()] || value;
            const options = Array.from(dropdown.querySelectorAll('.custom-select__option'));
            const match = options.find(opt => {
                const optValue = (opt.getAttribute('data-value') || '').toLowerCase();
                const optText = (opt.textContent || '').toLowerCase();
                return optValue === targetValue.toLowerCase() || optText === targetValue.toLowerCase();
            });

            if (match) {
                input.value = match.getAttribute('data-value') || '';
                display.innerText = match.textContent || '';
            } else if (idPrefix === "type") {
                input.value = value.toUpperCase(); 
                display.innerText = value.toLowerCase() === "income" ? "Доход" : "Расход";
            } else {
                input.value = targetValue;
                display.innerText = targetValue;
            }
        };

        setValue("value_input", draft.value ? String(draft.value) : "");
        setValue("title_input", draft.title || "");
        setValue("description_input", draft.description || "");
        setCustomSelect("category", draft.category || "");
        setCustomSelect("type", draft.type || "");
        setCustomSelect("currency", draft.currency || "");

        const dateInput = root.querySelector<HTMLInputElement>("#transaction_date_input");
        const dateDisplay = root.querySelector<HTMLInputElement>("#transaction_date_display");
        if (dateInput && dateDisplay) {
            let targetDate = draft.date ? new Date(draft.date) : new Date();
            if (isNaN(targetDate.getTime())) targetDate = new Date();
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
            const dd = String(targetDate.getDate()).padStart(2, "0");
            dateInput.value = `${yyyy}-${mm}-${dd}`;
            dateDisplay.value = `${dd}.${mm}.${yyyy}`;
        }
    }

    override destroy(): void {
        if (this.fastModeTimer) clearTimeout(this.fastModeTimer);
        this.recorder.stop().catch(() => {});
        super.destroy();
    }
}