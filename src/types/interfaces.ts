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

// ДОБАВЛЕН id: number, чтобы работала проверка на админа и профиль
export interface User {
    id: number; 
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

export interface BudgetUpdateRequest {
    title: string;
    description: string;
    target: number;
}

export interface DeleteResponse extends SimpleResponse {}


export interface Account {
    id: number;
    name: string;
    balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

export interface AccountCreateRequest {
    name: string;
    balance?: number;
    currency: string;
}

export interface AccountUpdateRequest {
    name?: string;
    balance?: number;
    currency?: string;
}

export interface AccountListResponse extends SimpleResponse {
    accounts: Account[];
}

export interface AccountResponse extends RequestWithErrors {
    account?: Account;
}

export interface Transaction {
    id: number;
    user_id: number;
    account_id: number;
    value: number;
    type: string;
    category: string;
    title: string;
    description: string;
    currency: string;
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
    title: string;
    description: string;
    transaction_date: string;
}

export interface TransactionSearchFilters {
    start_date?: string;
    end_date?: string;
    category?: string;
    account_id?: number;
    q?: string;
}

export interface TransactionSearchResponse extends SimpleResponse {
    transactions: Transaction[];
}

export interface TransactionDraft {
    raw_text: string;
    value: number;
    type: string;
    category: string;
    title: string;
    description: string;
    recorded_at: string;
    date?: string;
}

export interface VoiceTransactionDraftResponse extends SimpleResponse {
    draft: TransactionDraft;
}

export interface ShortAccount {
    id: number;
    name: string;
    balance: number;
}

export interface ShortAccountResponse extends SimpleResponse {
    accounts: ShortAccount[];
}

// ---------------------------------------------------------
// ИНТЕРФЕЙСЫ ПОДДЕРЖКИ (SUPPORT)
// ---------------------------------------------------------
export interface ProfileResponse extends SimpleResponse {
    user?: User;
}

export interface IsStaffResponse extends SimpleResponse {
    is_staff: boolean;
}

export interface ShortSupport {
    id: number;
    category: string;
    message: string;
    status: 'OPEN' | 'IN_WORK' | 'CLOSED';
    created_at: string;
}

export interface SupportsListResponse extends SimpleResponse {
    supports: ShortSupport[];
}

export interface SupportDetailResponse extends SimpleResponse {
    id: number;
    category: string;
    message: string;
    status: 'OPEN' | 'IN_WORK' | 'CLOSED';
    created_at: string;
    user: User;
}

export interface AppealCardProps extends Record<string, unknown> {
    id: number;
    category: string;
    message: string;
    status: string;
    statusType: "new" | "in_progress" | "resolved";
    date: string;
    rawStatus?: string;
    user?: {
        username: string;
        email: string;
        avatar_url: string;
    };
}

export type AnalysisPeriod = "month" | "quarter" | "year";

export interface AnalysisSummary {
    total_budget_limit: number;
    total_budget_spent: number;
    total_budget_free: number;
    income_total: number;
    expense_total: number;
    savings: number;
}

export interface AnalysisBudgetItem {
    id: number;
    title: string;
    categories: string[];
    target: number;
    actual: number;
    remaining: number;
    progress: number;
    currency: string;
}

export interface AnalysisCategoryItem {
    category: string;
    amount: number;
    share: number;
}

export interface AnalysisTimelineItem {
    label: string;
    income: number;
    expense: number;
}

export interface AnalysisResponse extends SimpleResponse {
    period: AnalysisPeriod;
    period_label: string;
    summary: AnalysisSummary;
    budgets: AnalysisBudgetItem[];
    categories: AnalysisCategoryItem[];
    timeline: AnalysisTimelineItem[];
}
