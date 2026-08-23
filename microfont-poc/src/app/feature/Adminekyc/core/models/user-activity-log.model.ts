/** Exact JsonProperty contract returned for each Spring User Activity Log row. */
export interface AdminekycUserActivityLogResponse {
  UserId: string | null;
  ActivitySlNo: number | null;
  TrackingNo: number | null;
  StepId: number | null;
  ActionType: string | null;
  ActionParticulars: string | null;
  ActionDate: string | null;
  ActionTerminalIp: string | null;
}

/** Exact Result payload returned by /Log/Index, /Log/LogList and /Log/Search. */
export interface AdminekycUserActivityLogPageResponse {
  Items: AdminekycUserActivityLogResponse[];
  PageIndex: number;
  TotalPages: number;
  TotalCount: number;
  HasPreviousPage: boolean;
  HasNextPage: boolean;
}

/** Raw response returned by /Log/Excel. This endpoint is not ApiResponse-wrapped. */
export interface AdminekycUserActivityLogExportResponse {
  pdfData?: string | null;
  docname?: string | null;
  result?: string | null;
}

export interface UserActivityLogSearchForm {
  trackingNumber: string;
  userId: string;
  fromDate: string;
  toDate: string;
}

/** UI-facing row after mapping Spring response fields. */
export interface UserActivityLog {
  id: number;
  adminUserId: string;
  activitySlNo: number;
  trackingNo: string;
  stepId: string;
  actionType: string;
  actionParticulars: string;
  actionDate: string;
  actionTime: string;
  actionTerminalIp: string;
}

/** UI-facing server page. Spring currently uses eight records per log page. */
export interface UserActivityLogPage {
  logs: UserActivityLog[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
