/** Base response returned by every endpoint. */
export interface SimpleResponse {
  code: number;
  message?: string;
}

/** A single field-level validation error. */
export interface FieldError {
  field: string;
  message: string;
}

/** Response that carries field-level validation errors. */
export interface RequestWithErrors extends SimpleResponse {
  errors?: FieldError[];
}

/** Authenticated user returned after login. */
export interface User {
  username: string;
  email: string;
  created_at: string;
  last_login?: string;
  avatar_url: string;
  balance: number;
  currency: string;
}

/** User data returned after signup. */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  last_login?: string;
  created_at?: string;
}

/** Successful login response. */
export interface LoginSuccessResponse extends SimpleResponse {
  user: User;
}

/** Successful signup response. */
export interface SignupSuccessResponse extends SimpleResponse {
  user: AuthUser;
}

/** Successful logout response. */
export interface LogoutSuccessResponse extends SimpleResponse {
  logged_out_at: string;
}

/** Auth error response (login or signup). */
export interface AuthResponse extends RequestWithErrors {}

/** Current month balance summary. */
export interface BalanceResponse extends SimpleResponse {
  balance: number;
  currency: string;
  income: number;
  expenses: number;
  date: string;
}

/** Budget entity. */
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

/** Response with list of budget IDs. */
export interface BudgetListResponse extends SimpleResponse {
  len: number;
  ids: number[];
}

/** Response after budget creation. */
export interface BudgetCreateResponse extends SimpleResponse {
  budget_id: number;
}

/** Response with a single budget. */
export interface BudgetGetResponse extends SimpleResponse {
  budget: Budget;
}

/** Budget error response. */
export interface BudgetResponse extends RequestWithErrors {}

/** Generic delete response. */
export interface DeleteResponse extends SimpleResponse {}