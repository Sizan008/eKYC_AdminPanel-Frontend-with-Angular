import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  AdminekycUserActivityLogExportResponse,
  UserActivityLog,
  UserActivityLogSearchForm
} from '../../core/models/user-activity-log.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { UserActivityLogService } from '../../core/services/user-activity-log.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { GenericDataGrid } from '../../../../shared/common-components/generic-component-type/generic-data-grid';
import { InputDate } from '../../../../shared/common-components/input-types/input-date/input-date';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';

type UserActivitySearchFormGroup = {
  trackingNumber: FormControl<string>;
  userId: FormControl<string>;
  fromDate: FormControl<string>;
  toDate: FormControl<string>;
};

@Component({
  selector: 'app-user-activity-log',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    GenericDataGrid,
    InputDate,
    InputTextBox
  ],
  templateUrl: './user-activity-log.html',
  styleUrl: './user-activity-log.scss'
})
export class UserActivityLogPage implements OnInit {
  readonly logs = signal<UserActivityLog[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isDownloading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchActive = signal<boolean>(false);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(8);
  readonly totalPages = signal<number>(0);
  readonly totalCount = signal<number>(0);

  readonly logGridRows = computed(() =>
    this.logs().map((log) => ({
      ...log,
      actionDateTime: [log.actionDate, log.actionTime]
        .filter((value) => Boolean(value))
        .join(' ')
    }))
  );
  readonly logGridColumns = [
    'adminUserId',
    'activitySlNo',
    'trackingNo',
    'stepId',
    'actionType',
    'actionParticulars',
    'actionDateTime',
    'actionTerminalIp'
  ];
  readonly logGridColumnNames = {
    adminUserId: 'Admin User ID',
    activitySlNo: 'Activity Sl No',
    trackingNo: 'Tracking No',
    stepId: 'Step ID',
    actionType: 'Action Type',
    actionParticulars: 'Action Particulars',
    actionDateTime: 'Action Date',
    actionTerminalIp: 'Action Terminal IP'
  };

  readonly canGoPrevious = computed(
    () => this.currentPage() > 1 && !this.isLoading()
  );
  readonly canGoNext = computed(
    () =>
      this.totalPages() > 0 &&
      this.currentPage() < this.totalPages() &&
      !this.isLoading()
  );

  readonly searchForm = new FormGroup<UserActivitySearchFormGroup>({
    trackingNumber: new FormControl('', { nonNullable: true }),
    userId: new FormControl('', { nonNullable: true }),
    fromDate: new FormControl('', { nonNullable: true }),
    toDate: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private userActivityLogService: UserActivityLogService
  ) {}

  ngOnInit(): void {
    this.loadLogs(1);
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadLogs(pageNumber = 1): void {
    if (this.isLoading()) {
      return;
    }

    const normalizedPage = Math.max(1, Math.floor(pageNumber));
    const request$ = this.searchActive()
      ? this.userActivityLogService.searchLogPage(
          this.searchForm.getRawValue(),
          normalizedPage
        )
      : this.userActivityLogService.getLogPage(normalizedPage);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    request$.subscribe({
      next: (page) => {
        this.logs.set(page.logs);
        this.currentPage.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.totalPages.set(page.totalPages);
        this.totalCount.set(page.totalCount);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.clearPage();
        this.isLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load user activity logs.')
        );
      }
    });
  }

  searchLogs(): void {
    const formValue = this.searchForm.getRawValue();
    const validationMessage = this.validateSearch(formValue);

    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    this.searchActive.set(this.hasSearchCriteria(formValue));
    this.loadLogs(1);
  }

  resetSearch(): void {
    this.searchForm.reset({
      trackingNumber: '',
      userId: '',
      fromDate: '',
      toDate: ''
    });

    this.searchActive.set(false);
    this.errorMessage.set(null);
    this.loadLogs(1);
  }

  downloadLogs(): void {
    if (this.isDownloading()) {
      return;
    }

    const formValue = this.searchForm.getRawValue();
    const validationMessage = this.validateSearch(formValue);

    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    this.isDownloading.set(true);
    this.errorMessage.set(null);

    this.userActivityLogService.getExcel(formValue).subscribe({
      next: (response) => {
        try {
          this.downloadExcelResponse(response);
        } catch (error: unknown) {
          this.errorMessage.set(
            this.getErrorMessage(error, 'Unable to download user activity logs.')
          );
        } finally {
          this.isDownloading.set(false);
        }
      },
      error: (error: unknown) => {
        this.isDownloading.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to download user activity logs.')
        );
      }
    });
  }

  goToNextPage(): void {
    if (this.canGoNext()) {
      this.loadLogs(this.currentPage() + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.canGoPrevious()) {
      this.loadLogs(this.currentPage() - 1);
    }
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  private validateSearch(formValue: UserActivityLogSearchForm): string | null {
    const trackingNumber = formValue.trackingNumber.trim();
    const fromDate = this.toComparableDate(formValue.fromDate);
    const toDate = this.toComparableDate(formValue.toDate);

    if (trackingNumber && !/^\d+$/.test(trackingNumber)) {
      return 'Tracking Number must contain digits only.';
    }

    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      return 'Please select both From and To dates.';
    }

    if (fromDate && toDate && fromDate > toDate) {
      return 'From date cannot be after To date.';
    }

    return null;
  }

  private hasSearchCriteria(formValue: UserActivityLogSearchForm): boolean {
    return [
      formValue.trackingNumber,
      formValue.userId,
      formValue.fromDate,
      formValue.toDate
    ].some((value) => Boolean(value?.trim()));
  }

  private downloadExcelResponse(
    response: AdminekycUserActivityLogExportResponse
  ): void {
    const base64 = response.pdfData?.trim();

    if (!base64) {
      throw new Error(response.result?.trim() || 'No log export data was returned.');
    }

    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const documentName = response.docname?.trim() || 'User Activity Log';

    link.href = url;
    link.download = documentName.toLowerCase().endsWith('.xlsx')
      ? documentName
      : `${documentName}.xlsx`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private clearPage(): void {
    this.logs.set([]);
    this.currentPage.set(1);
    this.totalPages.set(0);
    this.totalCount.set(0);
  }

  private toComparableDate(value: unknown): string {
    const rawValue = value === null || value === undefined
      ? ''
      : String(value).trim();

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

  private isSessionExpired(error: unknown): boolean {
    return error instanceof AdminekycApiError &&
      error.status === 'UNAUTH' &&
      error.apiMessage?.trim().toLowerCase() === 'valid session required.';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AdminekycApiError) {
      return error.apiMessage?.trim() || error.message || fallback;
    }

    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error.trim();
      }

      return error.message || fallback;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
