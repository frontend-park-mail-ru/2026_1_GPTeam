import { client } from "./client.ts";
import type { SimpleResponse, IsStaffResponse, SupportsListResponse, SupportDetailResponse, AppealCardProps } from "../types/interfaces.ts";

const formatDate = (isoDate: string): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("ru-RU", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
    });
};

const mapStatus = (status: string): { text: string, type: "new" | "in_progress" | "resolved" } => {
    switch (status) {
        case "CLOSED": return { text: "Решено", type: "resolved" };
        case "IN_WORK": return { text: "В работе", type: "in_progress" };
        case "OPEN":
        default: return { text: "Новое", type: "new" };
    }
};

export const check_is_staff = async (): Promise<IsStaffResponse> => {
    const response = await client("/api/is_staff", {
        method: "GET",
        credentials: "include",
    });
    return await response.json();
};

export const get_all_appeals = async (): Promise<AppealCardProps[]> => {
    const response = await client("/support/get_all_appeals", {
        method: "GET",
        credentials: "include",
    });
    const data = await response.json() as SupportsListResponse;
    
    if (data.code !== 200 || !data.supports) return [];

    return data.supports.map(s => {
        const info = mapStatus(s.status);
        return {
            id: s.id,
            category: s.category,
            message: s.message,
            status: info.text,
            statusType: info.type,
            date: formatDate(s.created_at)
        };
    });
};

export const update_appeal_status = async (id: number, status: 'OPEN' | 'IN_WORK' | 'CLOSED'): Promise<SimpleResponse> => {
    const response = await client(`/support/update/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

export const get_admin_appeal_by_id = async (id: string | number): Promise<AppealCardProps | null> => {
    const response = await client(`/support/get_appeal/${id}`, {
        method: "GET",
        credentials: "include",
    });

    const data = await response.json() as SupportDetailResponse;
    if (!data?.id) return null;

    const info = mapStatus(data.status);
    return {
        id: data.id,
        category: data.category,
        message: data.message,
        status: info.text,
        statusType: info.type,
        rawStatus: data.status,
        date: formatDate(data.created_at),
        user: data.user,
    };
};