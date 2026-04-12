export interface SimpleResponse {
    code: number;
    message?: string;
}

export interface FieldError {
    field: string;
    message: string;
}

export interface RequestWithErrors extends SimpleResponse {
    errors?: FieldError[];
}

export interface User {
    username: string;
    email: string;
    created_at: string;
    avatar_url: string;
}

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    last_login?: string;
    created_at?: string;
}

export interface LoginSuccessResponse extends SimpleResponse {
    user: User;
}

export interface SignupSuccessResponse extends SimpleResponse {
    user: AuthUser;
}

export interface LogoutSuccessResponse extends SimpleResponse {
    logged_out_at: string;
}

export interface AuthResponse extends RequestWithErrors {}

export interface CurrencyBalance {
    currency: string;
    balance: number;
    income: number;
    expenses: number;
}

export interface BalanceResponse extends SimpleResponse {
    balances: CurrencyBalance[];
    date: string;
}

export interface Budget {
    title: string;
    description: string;
    created_at: string;
    start_at: string;
    end_at: string;
    actual: number;
    target: number;
    currency: string;
}

export interface BudgetListResponse extends SimpleResponse {
    len: number;
    ids: number[];
}

export interface BudgetCreateResponse extends SimpleResponse {
    budget_id: number;
}

export interface BudgetGetResponse extends SimpleResponse {
    budget: Budget;
}

export interface BudgetResponse extends RequestWithErrors {}

export interface DeleteResponse extends SimpleResponse {}

export interface Transaction {
    id: number;
    user_id: number;
    account_id: number;
    value: number;
    type: string;
    category: string;
    currency: string;
    title: string;
    description: string;
    created_at: string;
    transaction_date: string;
}

export interface TransactionListResponse extends SimpleResponse {
    len: number;
    ids: number[];
}

export interface TransactionGetResponse extends SimpleResponse {
    transaction: Transaction;
}

export interface TransactionActionResponse extends SimpleResponse {
    transaction_id: number;
}

export interface TransactionCreateRequest {
    account_id: number;
    value: number;
    type: string;
    category: string;
    currency: string;
    title: string;
    description: string;
    transaction_date: string;
}

export interface TransactionDraft {
    raw_text: string;
    value: number;
    /** DB enum: "expense" | "income" */
    type: string;
    /** DB enum: category_type */
    category: string;
    /** DB enum: "RUB" | "USD" | "EUR" */
    currency: string;
    title: string;
    description: string;
    recorded_at: string;
    date?: string;
}

export interface VoiceTransactionDraftResponse extends SimpleResponse {
    draft: TransactionDraft;
}
