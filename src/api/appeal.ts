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
    // return []; 


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
    
}

export async function get_appeal_by_id(id: string | number): Promise<AppealCardProps | null> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Симуляция загрузки

    // TODO: Заменить на реальный fetch (например: fetch(`/support/get_appeals/${id}`))
    
    // Мок-ответ для детальной страницы
    return {
        id: Number(id),
        category: "Техническая ошибка (Детали)",
        message: "Здесь полный текст обращения. При попытке привязать карту выдает ошибку 500. Пробовал с разных браузеров (Chrome, Safari), очищал кэш и куки, заходил через инкогнито — проблема всё равно сохраняется. Прошу помочь разобраться, так как не могу оплатить подписку.",
        status: "В работе",
        statusType: "in_progress",
        date: "12 октября 2023, 14:30" // Можно добавить время для деталки
    };
}