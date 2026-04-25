import { client } from "./client.ts";
import type { SupportsListResponse, SupportDetailResponse, SimpleResponse, AppealCardProps } from "../types/interfaces.ts";

const formatDate = (isoDate: string): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const mapStatus = (status: string): { text: string, type: "new" | "in_progress" | "resolved" } => {
    switch (status) {
        case "CLOSED": return { text: "Решено", type: "resolved" };
        case "IN_WORK": return { text: "В работе", type: "in_progress" };
        case "OPEN":
        default: return { text: "Новое", type: "new" };
    }
};

export const get_appeals = async (): Promise<AppealCardProps[]> => {
    const response = await client("/support/get_appeals", {
        method: "GET",
        credentials: "include",
    });
    const data = await response.json() as SupportsListResponse;
    if (data.code !== 200 || !data.supports) return [];

    return data.supports.map(support => {
        const info = mapStatus(support.status);
        return {
            id: support.id,
            category: support.category,
            message: support.message,
            status: info.text,
            statusType: info.type,
            date: formatDate(support.created_at)
        };
    });
};

export const get_appeal_by_id = async (id: string | number): Promise<AppealCardProps | null> => {
    const response = await client(`/support/get_appeal/${id}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await response.json() as { appeal: SupportDetailResponse };
    if (!data?.appeal) return null;

    const info = mapStatus(data.appeal.status);
    return {
        id: data.appeal.id,
        category: data.appeal.category,
        message: data.appeal.message,
        status: info.text,
        statusType: info.type,
        date: formatDate(data.appeal.created_at)
    };
};

export const create_appeal = async (category: string, message: string): Promise<SimpleResponse> => {
    return (await client("/support/create_appeal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
    })).json();
};