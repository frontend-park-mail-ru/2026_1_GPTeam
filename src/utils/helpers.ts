import Handlebars from "handlebars";

/**
 * @fileoverview Модуль регистрации вспомогательных функций (helpers) для Handlebars.
 * Содержит кастомную логику для расширения возможностей шаблонизатора.
 */

/**
 * Регистрирует помощник Handlebars для проверки равенства двух значений.
 * Может использоваться как блок {{#equal}}...{{else}}...{{/equal}},
 * так и как подвыражение внутри {{#if (equal a b)}}.
 *
 * @param {unknown} a - Первое значение для сравнения.
 * @param {unknown} b - Второе значение для сравнения.
 * @param {Handlebars.HelperOptions} options - Объект Handlebars (содержит fn и inverse для блоков).
 * @returns {string | boolean} Результат рендеринга блока или логическое значение.
 */
Handlebars.registerHelper("equal", function (
    this: unknown,
    a: unknown,
    b: unknown,
    options: Handlebars.HelperOptions
): string | boolean {
    const isBlock = !!(options && options.fn);

    if (a === b) {
        return isBlock ? options.fn(this) : true;
    } else {
        return isBlock ? options.inverse(this) : false;
    }
});