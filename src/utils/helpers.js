/**
 * @fileoverview Модуль регистрации вспомогательных функций (helpers) для Handlebars.
 * Содержит кастомную логику для расширения возможностей шаблонизатора.
 */

import Handlebars from "handlebars";

/**
 * Регистрирует помощник Handlebars для проверки равенства двух значений.
 * Может использоваться как блок {{#equal}}...{{else}}...{{/equal}},
 * так и как подвыражение внутри {{#if (equal a b)}}.
 * * @param {any} a - Первое значение для сравнения.
 * @param {any} b - Второе значение для сравнения.
 * @param {Object} options - Объект Handlebars (содержит fn и inverse для блоков).
 * @returns {string|boolean} Результат рендеринга блока или логическое значение.
 */
Handlebars.registerHelper("equal", function (a, b, options) {
    // Проверяем, вызван ли хелпер как блок (с телом внутри)
    const isBlock = !!(options && options.fn);

    if (a === b) {
        // Если это блок — рендерим содержимое "успеха", иначе возвращаем true
        return isBlock ? options.fn(this) : true;
    } else {
        // Если это блок — рендерим {{else}}, иначе возвращаем false
        return isBlock ? options.inverse(this) : false;
    }
});