import {client} from "./client.ts";
import {
    BudgetGetResponse,
    BudgetUpdateRequest,
    RequestWithErrors,
    SimpleResponse
} from "../types/interfaces.ts";
import {is_login} from "./auth.ts";

export const get_budget = async (id: number): Promise<BudgetGetResponse> => {
    const response: Response = await client(`/api/get_budget/${id}`, {
        method: "GET",
        credentials: "include",
    });
    let data: BudgetGetResponse = await response.json();

    if (data.code === 401) {
        const login: boolean = await is_login();
        if (login) {
            const retryResponse: Response = await client(`/api/get_budget/${id}`, {
                method: "GET",
                credentials: "include",
            });
            return await retryResponse.json();
        }
    }
    return data;
};

export const update_budget = async (id: number, payload: BudgetUpdateRequest): Promise<{ success: boolean; errors?: Array<{ field: string; message: string }> }> => {
    let response: Response = await client(`/api/budget/update/${id}`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    let data: SimpleResponse | RequestWithErrors = await response.json();
    if (data.code === 200) {
        return { success: true };
    }
    if ("errors" in data && data.errors) {
        let errors: Array<{ field: string; message: string }> = data.errors;
        let server_message: string | undefined = data.message;
        if (server_message) {
            errors.push({field: "", message: server_message});
        }
        return { success: false, errors: errors };
    }
    return { success: false, errors: [] };
};
