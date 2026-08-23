/** Exact Result payload returned by GET /api/Home/Index. */
export interface AdminekycDashboardResponse {
  total_customers: number | null;
  total_authorized_customers: number | null;
  total_unauthorized_customers: number | null;
  total_verified_customers: number | null;
  regular_ekyc_count: number | null;
  simplified_ekyc_count: number | null;
  current_month_count: number | null;
  licence_error: string | null;
}

/** UI-facing dashboard model kept independent from the Spring JSON casing. */
export interface AdminekycDashboardSummary {
  total: number;
  authorized: number;
  unauthorized: number;
  incomplete: number;
  regularEkycCount: number;
  simplifiedEkycCount: number;
  currentMonthCount: number;
  licenceError: string | null;
}

export const EMPTY_ADMINEKYC_DASHBOARD_SUMMARY: AdminekycDashboardSummary = {
  total: 0,
  authorized: 0,
  unauthorized: 0,
  incomplete: 0,
  regularEkycCount: 0,
  simplifiedEkycCount: 0,
  currentMonthCount: 0,
  licenceError: null
};
