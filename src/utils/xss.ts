import DOMPurify from 'dompurify';

/**
 * Конфиг для dompurify, который запрещает всё, кроме обычного текста.
 */
const strict_config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
};

/**
 * Санитайзинг xss запросов.
 * @function clean_data
 * @param {string} data - Строка с данными от пользователя.
 * @returns {string} - Строка с удалёнными xss вставками.
 */
export function clean_data(data: string): string {
    return DOMPurify.sanitize(data, strict_config);
}
