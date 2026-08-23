import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycDashboardResponse,
  AdminekycDashboardSummary
} from '../models/adminekyc-dashboard.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class AdminekycDashboard {
  private readonly api = inject(AdminekycApi);

  getSummary(): Observable<AdminekycDashboardSummary> {
    return this.api
      .getApi<AdminekycDashboardResponse>(ADMINEKYC_API_ENDPOINTS.home.index)
      .pipe(map((response) => this.mapSummary(response)));
  }

  private mapSummary(
    response: AdminekycDashboardResponse
  ): AdminekycDashboardSummary {
    return {
      total: this.toCount(response.total_customers),
      authorized: this.toCount(response.total_authorized_customers),
      unauthorized: this.toCount(response.total_unauthorized_customers),
      // The legacy .NET dashboard and Spring migration use
      // total_verified_customers for AuthStatus = "I" (Incomplete).
      incomplete: this.toCount(response.total_verified_customers),
      regularEkycCount: this.toCount(response.regular_ekyc_count),
      simplifiedEkycCount: this.toCount(response.simplified_ekyc_count),
      currentMonthCount: this.toCount(response.current_month_count),
      licenceError: this.normalizeMessage(response.licence_error)
    };
  }

  private toCount(value: number | null | undefined): number {
    const count = Number(value ?? 0);
    return Number.isFinite(count) ? count : 0;
  }

  private normalizeMessage(value: string | null | undefined): string | null {
    const message = value?.trim();
    return message ? message : null;
  }
}
