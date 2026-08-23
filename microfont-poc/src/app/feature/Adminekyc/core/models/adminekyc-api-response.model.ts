/** Exact envelope returned by the Spring Boot VerifID Admin APIs. */
export type AdminekycApiStatus = 'OK' | 'FAILED' | 'UNAUTH';

export interface AdminekycApiResponse<T> {
  Status: AdminekycApiStatus;
  Message: string | null;
  Result: T;
}

export class AdminekycApiError extends Error {
  constructor(
    readonly status: Exclude<AdminekycApiStatus, 'OK'>,
    readonly apiMessage: string | null
  ) {
    super(apiMessage || `VerifID Admin API request failed with status ${status}.`);
    this.name = 'AdminekycApiError';
  }
}
