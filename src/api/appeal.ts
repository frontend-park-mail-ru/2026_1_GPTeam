import type { AppealCardProps } from "../types/interfaces.ts";

/**
 * Получает список обращений пользователя с бэкенда.
 */
export async function get_appeals(): Promise<AppealCardProps[]> {
    // Симулируем задержку сети (0.5 сек)
    await new Promise(resolve => setTimeout(resolve, 500));

    // const response = await client('/support/get_appeals');
    // return await response.json();

    // ПОКА ВОЗВРАЩАЕМ ПУСТОЙ МАССИВ (чтобы показать стейт "Нет обращений")
    return []; 

    /* Если захочешь проверить с данными, закомментируй `return [];` выше 
       и раскомментируй этот блок:
    return [
        {
            id: 1045,
            category: "Техническая ошибка",
            message: "При попытке привязать карту выдает ошибку 500.",
            status: "В работе",
            statusType: "in_progress",
            date: "12 октября 2023"
        }
    ];
    */
}