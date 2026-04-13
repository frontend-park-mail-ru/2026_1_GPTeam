import { client } from "./client";

export interface UploadAvatarResponse {
    url?: string;
    avatar_url?: string;
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await client("/api/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message ?? "Ошибка загрузки аватара");
    }

    const data = await response.json();
    const url = data.url ?? data.avatar_url;
    if (!url) {
        throw new Error("Сервер не вернул URL аватара");
    }
    return { url };
}