import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycUserActivityLogExportResponse,
  AdminekycUserActivityLogPageResponse,
  AdminekycUserActivityLogResponse,
  UserActivityLog,
  UserActivityLogPage,
  UserActivityLogSearchForm
} from '../models/user-activity-log.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class UserActivityLogService {
  private static readonly PAGE_SIZE = 8;

  constructor(private api: AdminekycApi) {}

  /**
   * Legacy .NET menu opened Log/LogList. Spring keeps the same route and
   * returns an ApiResponse-wrapped server page ordered by ActionDate DESC.
   */
  getLogPage(pageNumber = 1): Observable<UserActivityLogPage> {
    return this.api
      .getApi<AdminekycUserActivityLogPageResponse>(
        ADMINEKYC_API_ENDPOINTS.log.list,
        { pageNumber: this.toPositiveInteger(pageNumber, 1) }
      )
      .pipe(map((response) => this.mapPage(response)));
  }

  searchLogPage(
    formValue: UserActivityLogSearchForm,
    pageNumber = 1
  ): Observable<UserActivityLogPage> {
    return this.api
      .getApi<AdminekycUserActivityLogPageResponse>(
        ADMINEKYC_API_ENDPOINTS.log.search,
        {
          TrackingNo: this.cleanValue(formValue.trackingNumber),
          UserId: this.cleanValue(formValue.userId),
          DateFrom: this.cleanDate(formValue.fromDate),
          DateTo: this.cleanDate(formValue.toDate),
          pageNumber: this.toPositiveInteger(pageNumber, 1),
          customersPerPage: UserActivityLogService.PAGE_SIZE
        }
      )
      .pipe(map((response) => this.mapPage(response)));
  }

  /** Spring /Log/Excel intentionally returns the legacy raw export object. */
  getExcel(
    formValue: UserActivityLogSearchForm
  ): Observable<AdminekycUserActivityLogExportResponse> {
    return this.api.get<AdminekycUserActivityLogExportResponse>(
      ADMINEKYC_API_ENDPOINTS.log.excel,
      {
        TrackingNo: this.cleanValue(formValue.trackingNumber),
        UserId: this.cleanValue(formValue.userId),
        DateFrom: this.cleanDate(formValue.fromDate),
        DateTo: this.cleanDate(formValue.toDate)
      }
    );
  }

  private mapPage(response: AdminekycUserActivityLogPageResponse): UserActivityLogPage {
    return {
      logs: (response.Items ?? []).map((item) => this.mapLog(item)),
      pageNumber: this.toPositiveInteger(response.PageIndex, 1),
      pageSize: UserActivityLogService.PAGE_SIZE,
      totalPages: this.toNonNegativeInteger(response.TotalPages),
      totalCount: this.toNonNegativeInteger(response.TotalCount),
      hasPreviousPage: Boolean(response.HasPreviousPage),
      hasNextPage: Boolean(response.HasNextPage)
    };
  }

  private mapLog(response: AdminekycUserActivityLogResponse): UserActivityLog {
    const activitySlNo = this.toNonNegativeInteger(response.ActivitySlNo);
    const actionDateTime = this.splitDateTime(response.ActionDate);

    return {
      id: activitySlNo,
      adminUserId: this.cleanValue(response.UserId),
      activitySlNo,
      trackingNo: this.numberText(response.TrackingNo),
      stepId: this.numberText(response.StepId),
      actionType: this.cleanValue(response.ActionType),
      actionParticulars: this.cleanValue(response.ActionParticulars),
      actionDate: actionDateTime.date,
      actionTime: actionDateTime.time,
      actionTerminalIp: this.cleanValue(response.ActionTerminalIp)
    };
  }

  private splitDateTime(value: string | null): { date: string; time: string } {
    const rawValue = this.cleanValue(value);

    if (!rawValue) {
      return { date: '', time: '' };
    }

    const normalized = rawValue.replace(' ', 'T');
    const [date = '', timeWithFraction = ''] = normalized.split('T');
    const time = timeWithFraction.split('.')[0] ?? '';

    return { date, time };
  }

  private cleanDate(value: unknown): string {
    const rawValue = this.cleanValue(value);

    if (!rawValue) {
      return '';
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
      return rawValue;
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawValue)) {
      const [month, day, year] = rawValue.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(rawValue)) {
      const [day, month, year] = rawValue.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return rawValue;
  }

  private cleanValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private numberText(value: number | null): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private toPositiveInteger(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
  }

  private toNonNegativeInteger(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  }
}
