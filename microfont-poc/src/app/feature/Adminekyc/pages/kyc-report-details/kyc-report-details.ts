import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { switchMap } from 'rxjs';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  AdminekycCustomerDetailsResponse,
  AdminekycCustomerNomineeResponse
} from '../../core/models/adminekyc-customer-details.model';
import {
  KycDownloadFile,
  KycReportDetailsData
} from '../../core/models/kyc-report-by-year.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { KycReportByYearService } from '../../core/services/kyc-report-by-year.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';

type KycDetailsTab = 'customerProfile' | 'nomineeProfile' | 'documents';
type KycServiceApprovalKey = 'sms' | 'email' | 'cheque' | 'debit';

@Component({
  selector: 'app-kyc-report-details',
  standalone: true,
  imports: [
    AdminLayout,
    GenericButton
  ],
  templateUrl: './kyc-report-details.html',
  styleUrl: './kyc-report-details.scss'
})
export class KycReportDetails implements OnInit {
  readonly details = signal<KycReportDetailsData | null>(null);
  readonly activeTab = signal<KycDetailsTab>('customerProfile');
  readonly isLoading = signal<boolean>(false);
  readonly isDownloadingReport = signal<boolean>(false);
  readonly isDownloadingPhotos = signal<boolean>(false);
  readonly isSubmittingServices = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly smsApproved = signal<boolean>(false);
  readonly emailApproved = signal<boolean>(false);
  readonly chequeBookApproved = signal<boolean>(false);
  readonly debitCardApproved = signal<boolean>(false);
  readonly debitRestrictionRequested = signal<boolean>(false);

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private kycReportService: KycReportByYearService
  ) {}

  ngOnInit(): void {
    const trackingNo = this.state.selectedKycCustomerId();

    if (!trackingNo) {
      this.state.goToKycReportByYear();
      return;
    }

    this.loadDetails(trackingNo);
  }

  setActiveTab(tab: KycDetailsTab): void {
    this.activeTab.set(tab);
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  backToKycReport(): void {
    this.state.goToKycReportByYear();
  }

  getCustomerName(): string {
    const profile = this.profile();
    return profile?.FullnameEN?.trim()
      || profile?.FullnameBN?.trim()
      || 'N/A';
  }

  getFatherName(): string {
    const profile = this.profile();
    return profile?.FatherNameEN?.trim()
      || profile?.FatherNameBN?.trim()
      || 'N/A';
  }

  getMotherName(): string {
    const profile = this.profile();
    return profile?.MotherNameEN?.trim()
      || profile?.MotherNameBN?.trim()
      || 'N/A';
  }

  getSpouseName(): string {
    return this.profile()?.SpouseName?.trim() || 'N/A';
  }

  getMobileNumber(): string {
    return this.profile()?.MobileNo?.trim() || 'N/A';
  }

  getEmail(): string {
    return this.profile()?.Email?.trim() || 'N/A';
  }

  getDateOfBirth(): string {
    return this.profile()?.Birthdate?.trim() || 'N/A';
  }

  getNidNumber(): string {
    return this.profile()?.NidNo?.trim() || 'N/A';
  }

  getCustomerId(): string {
    return this.profile()?.CustomerId?.trim() || 'N/A';
  }

  getBranchInfo(): string {
    const profile = this.profile();
    const branchId = profile?.BranchId?.trim() || '';
    const branchName = profile?.BranchName?.trim() || '';

    if (branchId && branchName) {
      return `${branchId} - ${branchName}`;
    }

    return branchName || branchId || 'N/A';
  }

  getAccountNo(): string {
    return this.profile()?.AccountNo?.trim() || 'N/A';
  }

  getTrackingNo(): string {
    const trackingNo = this.profile()?.TrackingNo;
    return trackingNo === null || trackingNo === undefined
      ? 'N/A'
      : String(trackingNo);
  }

  getStepNo(): string {
    const stepNo = this.profile()?.TrackingStatus;
    return stepNo === null || stepNo === undefined ? 'N/A' : String(stepNo);
  }

  getAuthentication(): string {
    return this.profile()?.AuthStatus?.trim() || 'N/A';
  }

  getProductType(): string {
    return this.profile()?.ProductTypeName?.trim()
      || this.profile()?.ProductTypeId?.trim()
      || 'N/A';
  }

  getProductName(): string {
    return this.profile()?.ProductName?.trim()
      || this.profile()?.ProductId?.trim()
      || 'N/A';
  }

  getFaceMatch(): string {
    return this.formatNumber(this.profile()?.FaceMatchScoreCard);
  }

  getCustomerEkycType(): string {
    return this.profile()?.custEkycType?.trim() || 'N/A';
  }

  getRiskScore(): string {
    return this.formatNumber(this.profile()?.RiskGrading);
  }

  getSanctionScreening(): string {
    return this.profile()?.SacntionScreening?.trim() || 'N/A';
  }

  getDepositPerMonth(): string {
    return this.formatNumber(this.profile()?.DepositPerMonth);
  }

  getWithdrawalPerMonth(): string {
    return this.formatNumber(this.profile()?.WithdrawPerMonth);
  }

  getOnboardedFrom(): string {
    return this.profile()?.RequestChannel?.trim() || 'N/A';
  }

  getPresentAddress(): string {
    const profile = this.profile();
    return profile?.PresentAddressEN?.trim()
      || profile?.PresentAddressBN?.trim()
      || 'N/A';
  }

  getPermanentAddress(): string {
    return this.profile()?.PermanentAddress?.trim() || 'N/A';
  }

  getNomineeName(): string {
    return this.nominee()?.NomineeName?.trim() || 'N/A';
  }

  getNomineeRelation(): string {
    return this.nominee()?.Relation?.trim() || 'N/A';
  }

  getNomineeBirthDate(): string {
    return this.nominee()?.Birthdate?.trim() || 'N/A';
  }

  getNomineeAge(): string {
    return this.formatNumber(this.nominee()?.Age);
  }

  getNomineeSharePercent(): string {
    const value = this.nominee()?.SharePercent;
    return value === null || value === undefined ? 'N/A' : `${value}%`;
  }

  getNomineeNid(): string {
    return this.nominee()?.NomineeIdNo?.trim() || 'N/A';
  }

  getNomineeAddress(): string {
    const nominee = this.nominee();
    return nominee?.PermanentAddress?.trim()
      || nominee?.PresentAddressEN?.trim()
      || nominee?.PresentAddressBN?.trim()
      || 'N/A';
  }

  getNidPhotoUrl(): string {
    const profile = this.profile();
    return this.kycReportService.toImageSource(
      profile?.NidPhoto || profile?.Photos?.FromNid
    );
  }

  getCapturedPhotoUrl(): string {
    const profile = this.profile();
    return this.kycReportService.toImageSource(
      profile?.Photos?.FromUploaded || profile?.CustPhoto
    );
  }

  getNidFrontUrl(): string {
    const profile = this.profile();
    return this.kycReportService.toImageSource(
      profile?.NidFront || profile?.Photos?.NidFront
    );
  }

  getNidBackUrl(): string {
    const profile = this.profile();
    return this.kycReportService.toImageSource(
      profile?.NidBack || profile?.Photos?.NidBack
    );
  }

  getSignatureUrl(): string {
    const profile = this.profile();
    return this.kycReportService.toImageSource(
      profile?.SignPhoto || profile?.Photos?.FromSignature
    );
  }

  getNomineePhotoUrl(): string {
    return this.kycReportService.toImageSource(this.nominee()?.NomineePhoto);
  }

  shouldShowServiceFlags(): boolean {
    const profile = this.profile();

    if (!profile || !this.isAuthorized()) {
      return false;
    }

    const showAlerts = profile.ShowAlerts?.trim().toUpperCase() === 'TRUE';
    const showAllChannels = profile.ShowAlertsAllChannels?.trim().toUpperCase() === 'TRUE';
    const isAssisted = profile.RequestChannel?.trim().toUpperCase() === 'ASSISTED';

    return showAlerts && (showAllChannels || !isAssisted);
  }

  isDebitRestrictionHidden(): boolean {
    return this.debitRestrictionResult() === 'hidden';
  }

  isDebitRestrictionCompleted(): boolean {
    return this.profile()?.DebitRestriction?.status?.trim().toUpperCase() === 'OK'
      && this.debitRestrictionResult() === 'false';
  }

  isServiceSelected(flag: number | null | undefined): boolean {
    return Number(flag ?? 0) >= 1;
  }

  isServiceApproved(flag: number | null | undefined): boolean {
    return Number(flag ?? 0) === 2;
  }

  isServiceApprovalLocked(flag: number | null | undefined): boolean {
    return this.isServiceApproved(flag) || this.isSubmittingServices();
  }

  shouldShowServiceSubmit(): boolean {
    const profile = this.profile();

    if (!profile || !this.shouldShowServiceFlags()) {
      return false;
    }

    const allServicesApproved = [
      profile.SmsAlertFlag,
      profile.EmailAlertFlag,
      profile.ChqBookFlag,
      profile.DebitCardFlag
    ].every((flag) => this.isServiceApproved(flag));

    const debitRestrictionDone =
      this.isDebitRestrictionHidden() || this.isDebitRestrictionCompleted();

    return !(allServicesApproved && debitRestrictionDone);
  }

  setServiceApproval(key: KycServiceApprovalKey, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

    switch (key) {
      case 'sms':
        this.smsApproved.set(checked);
        break;
      case 'email':
        this.emailApproved.set(checked);
        break;
      case 'cheque':
        this.chequeBookApproved.set(checked);
        break;
      case 'debit':
        this.debitCardApproved.set(checked);
        break;
    }
  }

  setDebitRestrictionRequested(event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.debitRestrictionRequested.set(checked);
  }

  submitServiceChanges(): void {
    const profile = this.profile();
    const trackingNo = profile?.TrackingNo;

    if (!profile || !trackingNo || this.isSubmittingServices()) {
      return;
    }

    this.isSubmittingServices.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const updateServices = () =>
      this.kycReportService.updateCustomerServices(trackingNo, {
        smsAlertFlag: this.smsApproved() ? 2 : 0,
        emailAlertFlag: this.emailApproved() ? 2 : 0,
        debitCardFlag: this.debitCardApproved() ? 2 : 0,
        chqBookFlag: this.chequeBookApproved() ? 2 : 0
      });

    const request$ =
      this.debitRestrictionRequested() && !this.isDebitRestrictionCompleted()
        ? this.kycReportService
            .withdrawDebitRestriction(trackingNo)
            .pipe(switchMap(() => updateServices()))
        : updateServices();

    request$.subscribe({
      next: (message) => {
        this.isSubmittingServices.set(false);
        this.successMessage.set(message || 'Customer services updated successfully.');
        this.loadDetails(trackingNo);
      },
      error: (error: unknown) => {
        this.isSubmittingServices.set(false);
        this.handleActionError(error, 'Failed to update customer services.');
      }
    });
  }

  canDownloadCustomerFiles(): boolean {
    return this.isAuthorized();
  }

  downloadReport(): void {
    const trackingNo = this.profile()?.TrackingNo;

    if (!trackingNo || this.isDownloadingReport()) {
      return;
    }

    this.isDownloadingReport.set(true);
    this.errorMessage.set(null);

    this.kycReportService.downloadCustomerReport(trackingNo).subscribe({
      next: (file) => {
        this.isDownloadingReport.set(false);
        this.saveFile(file);
      },
      error: (error: unknown) => {
        this.isDownloadingReport.set(false);
        this.handleActionError(error, 'Failed to generate customer report.');
      }
    });
  }

  downloadPhotos(): void {
    const profile = this.profile();
    const trackingNo = profile?.TrackingNo;

    if (!trackingNo || this.isDownloadingPhotos()) {
      return;
    }

    this.isDownloadingPhotos.set(true);
    this.errorMessage.set(null);

    this.kycReportService
      .downloadCustomerPhotos(trackingNo, profile.CustomerId)
      .subscribe({
        next: (file) => {
          this.isDownloadingPhotos.set(false);
          this.saveFile(file);
        },
        error: (error: unknown) => {
          this.isDownloadingPhotos.set(false);
          this.handleActionError(error, 'Failed to download customer photos.');
        }
      });
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  private loadDetails(trackingNo: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.kycReportService.getCustomerDetails(trackingNo).subscribe({
      next: (details) => {
        this.details.set(details);
        this.syncServiceControls(details.profile);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load KYC report details.')
        );
      }
    });
  }

  private syncServiceControls(profile: AdminekycCustomerDetailsResponse): void {
    this.smsApproved.set(this.isServiceApproved(profile.SmsAlertFlag));
    this.emailApproved.set(this.isServiceApproved(profile.EmailAlertFlag));
    this.chequeBookApproved.set(this.isServiceApproved(profile.ChqBookFlag));
    this.debitCardApproved.set(this.isServiceApproved(profile.DebitCardFlag));

    const debitResult = typeof profile.DebitRestriction?.result === 'string'
      ? profile.DebitRestriction.result.trim().toLowerCase()
      : '';
    const debitCompleted =
      profile.DebitRestriction?.status?.trim().toUpperCase() === 'OK'
      && debitResult === 'false';

    this.debitRestrictionRequested.set(debitCompleted);
  }

  private profile(): AdminekycCustomerDetailsResponse | null {
    return this.details()?.profile ?? null;
  }

  private nominee(): AdminekycCustomerNomineeResponse | null {
    return this.details()?.nominee ?? null;
  }

  private isAuthorized(): boolean {
    const status = this.profile()?.AuthStatus?.trim().toUpperCase();
    return status === 'A' || status === 'AUTHORIZED';
  }

  private debitRestrictionResult(): string {
    const value = this.profile()?.DebitRestriction?.result;
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private formatNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/A' : String(value);
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

  private handleActionError(error: unknown, fallback: string): void {
    if (this.isSessionExpired(error)) {
      this.state.closeUserModal();
      this.state.goToLogin();
      return;
    }

    this.errorMessage.set(this.getErrorMessage(error, fallback));
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
