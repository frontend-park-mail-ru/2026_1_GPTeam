import { Modal } from "../components/Modal/modal.ts";

/** Одно окно с кнопкой подтверждения (обе кнопки закрывают). */
export function showMessageModal(title: string, message: string): void {
    const modal = new Modal({
        title,
        message,
        confirmText: "Понятно",
        cancelText: "Закрыть",
        onConfirm: () => modal.destroy(),
        onCancel: () => modal.destroy(),
    });
    modal.render(document.body);
}

/**
 * Подтверждение опасного действия. Не закрывает модалку до конца onConfirm;
 * при ошибке вызывайте modal.show_error на переданном экземпляре.
 */
export function showDangerConfirmModal(
    title: string,
    message: string,
    onConfirm: (modal: Modal) => void | Promise<void>,
): void {
    const modal = new Modal({
        title,
        message,
        confirmText: "Подтвердить",
        cancelText: "Отмена",
        onConfirm: () => {
            void Promise.resolve(onConfirm(modal));
        },
        onCancel: () => modal.destroy(),
    });
    modal.render(document.body);
}
