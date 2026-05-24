import { client } from "./client";
import { is_login } from "./auth";
import type { SimpleResponse } from "../types/interfaces";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseJson<T>(response: Response): Promise<T> {
    return await response.json().catch(() => ({
        code: response.status,
        message: `Ошибка сервера: ${response.status}`,
    } as T));
}

async function requestWithRefresh<T>(url: string, options: RequestInit): Promise<T> {
    let response = await client(url, options);
    let data = await parseJson<T & SimpleResponse>(response);

    if (data.code === 401 && await is_login()) {
        response = await client(url, options);
        data = await parseJson<T & SimpleResponse>(response);
    }

    return data as T;
}

export interface UserSearchResult {
    id: number;
    username: string;
    email: string;
}

export interface UserSearchResponse {
    code: number;
    message?: string;
    users: UserSearchResult[];
}

export interface InviteRequest {
    query: string;
}

export interface InviteResponse {
    code: number;
    message?: string;
    invite?: {
        id: number;
        account_id: number;
        user_id: number;
        status: string;
        created_at: string;
    };
}

export interface Member {
    id: number;
    account_id: number;
    user_id: number;
    username: string;
    email: string;
    status: string;
    created_at: string;
    is_owner: boolean;
}

export interface MembersResponse {
    code: number;
    message?: string;
    members: Member[];
}

export interface PendingInvite {
    id: number;
    account_id: number;
    account_name: string;
    user_id: number;
    status: string;
    created_at: string;
}

export interface PendingInvitesResponse {
    code: number;
    message?: string;
    invites: PendingInvite[];
}

/** Поиск пользователей по email или username */
export const searchUsers = async (accountId: number, query: string): Promise<UserSearchResponse> => {
    // Параметры передаем строго в URL
    const params = new URLSearchParams({
        accountId: accountId.toString(),
        query: query
    });

    return requestWithRefresh<UserSearchResponse>(`/api/accounts/search?${params.toString()}`, {
        method: "GET",
        headers: JSON_HEADERS,
        // body удален!
    });
};

/** Пригласить пользователя в счёт */
export const inviteUser = async (accountId: number, query: string): Promise<InviteResponse> => {
    return requestWithRefresh<InviteResponse>(`/api/accounts/${accountId}/invite`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ query }),
    });
};

/** Получить список участников счёта */
export const getMembers = async (accountId: number): Promise<MembersResponse> => {
    return requestWithRefresh<MembersResponse>(`/api/accounts/${accountId}/members`, {
        method: "GET",
    });
};

/** Удалить участника из счёта */
export const removeMember = async (accountId: number, userId: number): Promise<SimpleResponse> => {
    return requestWithRefresh<SimpleResponse>(`/api/accounts/${accountId}/members/${userId}`, {
        method: "DELETE",
    });
};

/** Принять приглашение */
export const acceptInvite = async (accountId: number): Promise<InviteResponse> => {
    return requestWithRefresh<InviteResponse>(`/api/accounts/${accountId}/invite/accept`, {
        method: "PATCH",
    });
};

/** Отклонить приглашение */
export const rejectInvite = async (accountId: number): Promise<SimpleResponse> => {
    return requestWithRefresh<SimpleResponse>(`/api/accounts/${accountId}/invite/reject`, {
        method: "PATCH",
    });
};

/** Получить список ожидающих приглашений */
export const getPendingInvites = async (): Promise<PendingInvitesResponse> => {
    return requestWithRefresh<PendingInvitesResponse>("/api/invites/pending", {
        method: "GET",
    });
};
