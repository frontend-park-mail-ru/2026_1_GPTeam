import { client } from "./client.ts";
import type { AnalysisPeriod, AnalysisResponse } from "../types/interfaces.ts";

export const fetchAnalysis = async (period: AnalysisPeriod = "month", startDate?: string): Promise<AnalysisResponse> => {
    const params = new URLSearchParams({ period });
    if (startDate) {
        params.append("start_date", startDate);
    }
    const response = await client(`/api/analysis?${params.toString()}`, { method: "GET" });
    return await response.json() as AnalysisResponse;
};
