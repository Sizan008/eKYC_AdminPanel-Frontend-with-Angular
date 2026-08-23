import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  KycDownloadFile,
  KycReportCustomer,
  KycReportYearFormValue
} from '../../core/models/kyc-report-by-year.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { KycReportByYearService } from '../../core/services/kyc-report-by-year.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputNumber } from '../../../../shared/common-components/input-types/input-number/input-number';

type KycYearFormGroup = {
  year: FormControl<number | null>;
};

@Component({
  selector: 'app-kyc-report-by-year',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    InputNumber
  ],
  templateUrl: './kyc-report-by-year.html',
  styleUrl: './kyc-report-by-year.scss'
})
export class KycReportByYear implements OnInit {
  readonly customers = signal<KycReportCustomer[]>([]);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(8);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly isDownloadingYear = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly yearForm = new FormGroup<KycYearFormGroup>({
    year: new FormControl<number | null>(1, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private kycReportService: KycReportByYearService
  ) {}

  ngOnInit(): void {
    this.loadCustomers(1);
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadCustomers(pageNumber: number): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.kycReportService.getCustomerPage(pageNumber).subscribe({
      next: (page) => {
        this.customers.set(page.customers);
        this.currentPage.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.totalCount.set(page.totalCount);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.customers.set([]);
        this.totalCount.set(0);
        this.totalPages.set(0);
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load KYC report customers.')
        );
      }
    });
  }

  downloadYearReport(): void {
    this.yearForm.markAllAsTouched();

    if (this.yearForm.invalid || this.isDownloadingYear()) {
      this.errorMessage.set('Please enter a valid non-negative year value.');
      return;
    }

    const formValue = this.yearForm.getRawValue() as KycReportYearFormValue;
    const yearsBack = Number(formValue.year ?? 1);

    this.isDownloadingYear.set(true);
    this.errorMessage.set(null);

    this.kycReportService.downloadYearReport(yearsBack).subscribe({
      next: (file) => {
        this.isDownloadingYear.set(false);
        this.saveFile(file);
      },
      error: (error: unknown) => {
        this.isDownloadingYear.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(
          this.getErrorMessage(error, 'Failed to download KYC year report.')
        );
      }
    });
  }

  resetYear(): void {
    this.yearForm.reset({
      year: 1
    });
    this.errorMessage.set(null);
  }

  openDetails(customer: KycReportCustomer): void {
    if (customer.trackingNo <= 0) {
      this.errorMessage.set('Invalid customer tracking number.');
      return;
    }

    this.state.goToKycReportDetails(customer.trackingNo);
  }

  getFaceMatch(customer: KycReportCustomer): string {
    return customer.faceMatchScore === null
      ? 'N/A'
      : String(customer.faceMatchScore);
  }

  goToNextPage(): void {
    if (!this.isLoading() && this.currentPage() < this.totalPages()) {
      this.loadCustomers(this.currentPage() + 1);
    }
  }

  goToPreviousPage(): void {
    if (!this.isLoading() && this.currentPage() > 1) {
      this.loadCustomers(this.currentPage() - 1);
    }
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  private saveFile(file: KycDownloadFile): void {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private isSessionExpired(error: unknown): boolean {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return true;
    }

    return error instanceof AdminekycApiError
      && error.status === 'UNAUTH'
      && error.apiMessage?.trim().toLowerCase() === 'valid session required.';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AdminekycApiError && error.apiMessage?.trim()) {
      return error.apiMessage.trim();
    }

    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error.trim();
      }

      return error.message || fallback;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }

    return fallback;
  }
}
