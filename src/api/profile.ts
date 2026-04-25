import { client } from "./client.ts";
import { is_login } from "./auth.ts";
import type { ProfileResponse } from "../types/interfaces.ts";

export interface UpdateProfileRequest {
    username?: string;
    email?: string;
    password?: string;
    current_password?: string;
    avatar_url?: string;
}

export const get_profile = async (): Promise<ProfileResponse> => {
    const response = await client("/api/profile", {
        method: "GET",
        credentials: "include",
    });
    const data: ProfileResponse = await response.json();
    if (data.code === 401) {
        const login = await is_login();
        if (login) {
            const retryResponse = await client("/api/profile", {
                method: "GET",
                credentials: "include",
            });
            return await retryResponse.json();
        }
    }
    return data;
};

export const update_profile = async (body: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await client("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data: ProfileResponse = await response.json();
    if (data.code === 401) {
        const login = await is_login();
        if (login) {
            const retryResponse = await client("/api/profile", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            return await retryResponse.json();
        }
    }
    return data;
};