import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { AdminCustomer } from '../../core/models/admin-customer.model';
import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import { AdminekycCustomerActionResponse } from '../../core/models/adminekyc-customer-details.model';
import { KycDownloadFile } from '../../core/models/kyc-report-by-year.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycCustomer } from '../../core/services/adminekyc-customer';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { KycReportByYearService } from '../../core/services/kyc-report-by-year.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';
import { FilePreviewComponent, FilePreviewData } from '../../../../shared/common-components/file-preview/file-preview.component';
import { AdminInfoRow } from '../../sharedAdminekyc/components/admin-info-row/admin-info-row';
import { AdminStatusBadge } from '../../sharedAdminekyc/components/admin-status-badge/admin-status-badge';

type DetailsTab = 'customerProfile' | 'nomineeProfile' | 'documents';
type CustomerServiceApprovalKey = 'sms' | 'email' | 'cheque' | 'debit';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [
    AdminLayout,
    GenericButton,
    GenericModal,
    FilePreviewComponent,
    AdminInfoRow,
    AdminStatusBadge
  ],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss'
})
export class CustomerDetails implements OnInit {
  private readonly filePreviewCache = new Map<string, FilePreviewData>();
  private readonly customerService = inject(AdminekycCustomer);
  private readonly kycReportService = inject(KycReportByYearService);

  readonly auth = inject(AdminekycAuth);
  readonly state = inject(AdminekycState);

  readonly isLoading = signal<boolean>(false);
  readonly isActionLoading = signal<boolean>(false);
  readonly isDownloadingReport = signal<boolean>(false);
  readonly isDownloadingPhotos = signal<boolean>(false);
  readonly isSubmittingServices = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly customer = signal<AdminCustomer | null>(null);
  readonly activeTab = signal<DetailsTab>('customerProfile');

  readonly authorizeModalOpened = signal<boolean>(false);
  readonly declineModalOpened = signal<boolean>(false);
  readonly acceptanceReason = signal<string>('');
  readonly declineReason = signal<string>('');

  readonly smsApproved = signal<boolean>(false);
  readonly emailApproved = signal<boolean>(false);
  readonly chequeBookApproved = signal<boolean>(false);
  readonly debitCardApproved = signal<boolean>(false);
  readonly debitRestrictionRequested = signal<boolean>(false);

  readonly activeMenu = computed(() => {
    const status = this.customer()?.status;

    if (status === 'authorized') {
      return 'authorized';
    }

    if (status === 'unauthorized') {
      return 'unauthorized';
    }

    if (status === 'incomplete') {
      return 'incomplete';
    }

    if (status === 'declined') {
      return 'declined';
    }

    return 'dashboard';
  });

  ngOnInit(): void {
    this.loadCustomer();
  }

  loadCustomer(clearActionMessage = true): void {
    const customerId = this.state.selectedCustomerId();

    if (!customerId) {
      this.state.goToDashboard();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    if (clearActionMessage) {
      this.actionMessage.set(null);
    }

    this.customerService.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.syncServiceControls(customer);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.customer.set(null);
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.customer.set(null);
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load customer details.'));
      }
    });
  }

  setTab(tab: DetailsTab): void {
    this.activeTab.set(tab);
  }

  backToList(): void {
    const status = this.customer()?.status;

    if (status === 'authorized') {
      this.state.goToAuthorizedCustomers();
      return;
    }

    if (status === 'unauthorized') {
      this.state.goToUnauthorizedCustomers();
      return;
    }

    if (status === 'declined') {
      this.state.goToDeclinedCustomers();
      return;
    }

    this.state.goToIncompleteCustomers();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Digital Onboarding Admin';
  }

  goToAuthorizedCustomers(): void {
    this.state.goToAuthorizedCustomers();
  }

  goToUnauthorizedCustomers(): void {
    this.state.goToUnauthorizedCustomers();
  }

  goToIncompleteCustomers(): void {
    this.state.goToIncompleteCustomers();
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  getPhotoUrl(type: 'customer' | 'nid' | 'porichoy' | 'captured'): string {
    const documents = this.customer()?.documents;

    if (type === 'customer') {
      return documents?.customerPhotoUrl || documents?.capturedPhotoUrl || documents?.nidPhotoUrl || '';
    }

    if (type === 'nid') {
      return documents?.nidPhotoUrl || documents?.nidFrontUrl || '';
    }

    if (type === 'porichoy') {
      return documents?.porichoyPhotoUrl || documents?.nidPhotoUrl || documents?.customerPhotoUrl || '';
    }

    return documents?.capturedPhotoUrl || documents?.customerPhotoUrl || '';
  }

  getDocumentUrl(type: 'nidFront' | 'nidBack' | 'signature'): string {
    const documents = this.customer()?.documents;

    if (type === 'nidFront') {
      return documents?.nidFrontUrl || '';
    }

    if (type === 'nidBack') {
      return documents?.nidBackUrl || '';
    }

    return documents?.signatureUrl || '';
  }

  getFaceScore(): string {
    const score = this.customer()?.verification?.faceMatchScore;
    return score === null || score === undefined ? '-' : String(score);
  }

  getAuthentication(): string {
    return this.customer()?.verification?.authentication || '-';
  }

  shouldShowServiceFlags(): boolean {
    const customer = this.customer();
    return customer?.status === 'authorized' && Boolean(customer.alerts);
  }

  isDebitRestrictionHidden(): boolean {
    return this.customer()?.alerts?.debitRestrictionHidden === true;
  }

  isDebitRestrictionCompleted(): boolean {
    return this.customer()?.alerts?.debitRestrictionWithdrawal === true;
  }

  isServiceSelected(selected: boolean | undefined): boolean {
    return selected === true;
  }

  isServiceApprovalLocked(done: boolean | undefined): boolean {
    return done === true || this.isSubmittingServices();
  }

  shouldShowServiceSubmit(): boolean {
    const customer = this.customer();

    if (!customer || !this.shouldShowServiceFlags()) {
      return false;
    }

    const alerts = customer.alerts;
    const allServicesApproved = Boolean(
      alerts?.smsAlertDone
      && alerts?.emailAlertDone
      && alerts?.chequeAlertDone
      && alerts?.debitAlertDone
    );
    const debitRestrictionDone =
      this.isDebitRestrictionHidden() || this.isDebitRestrictionCompleted();

    return !(allServicesApproved && debitRestrictionDone);
  }

  setServiceApproval(key: CustomerServiceApprovalKey, event: Event): void {
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
    const customer = this.customer();
    const trackingNo = Number(customer?.id || customer?.trackingNo || 0);

    if (
      !customer
      || customer.status !== 'authorized'
      || !Number.isFinite(trackingNo)
      || trackingNo <= 0
      || this.isSubmittingServices()
    ) {
      return;
    }

    this.isSubmittingServices.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set(null);

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
        this.actionMessage.set(message || 'Customer services updated successfully.');
        this.loadCustomer(false);
      },
      error: (error: unknown) => {
        this.isSubmittingServices.set(false);
        this.handleCustomerActionError(error, 'Failed to update customer services.');
      }
    });
  }

  canDownloadCustomerFiles(): boolean {
    return this.customer()?.status === 'authorized';
  }

  downloadReport(): void {
    const customer = this.customer();
    const trackingNo = Number(customer?.id || customer?.trackingNo || 0);

    if (
      !customer
      || !this.canDownloadCustomerFiles()
      || !Number.isFinite(trackingNo)
      || trackingNo <= 0
      || this.isDownloadingReport()
    ) {
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
        this.handleCustomerActionError(error, 'Failed to generate customer report.');
      }
    });
  }

  downloadPhotos(): void {
    const customer = this.customer();
    const trackingNo = Number(customer?.id || customer?.trackingNo || 0);

    if (
      !customer
      || !this.canDownloadCustomerFiles()
      || !Number.isFinite(trackingNo)
      || trackingNo <= 0
      || this.isDownloadingPhotos()
    ) {
      return;
    }

    this.isDownloadingPhotos.set(true);
    this.errorMessage.set(null);

    this.kycReportService
      .downloadCustomerPhotos(trackingNo, customer.customerId)
      .subscribe({
        next: (file) => {
          this.isDownloadingPhotos.set(false);
          this.saveFile(file);
        },
        error: (error: unknown) => {
          this.isDownloadingPhotos.set(false);
          this.handleCustomerActionError(error, 'Failed to download customer photos.');
        }
      });
  }

  getCustomerReasonMessage(): string {
    const storedReason = this.customer()?.declinedReason?.trim();

    if (!storedReason) {
      return '';
    }

    const plainReason = this.extractStoredReason(this.toPlainText(storedReason));

    if (this.customer()?.status === 'declined') {
      return plainReason || 'Customer request was declined.';
    }

    if (/ORA-01400/i.test(plainReason) && /NATIONAL_ID/i.test(plainReason)) {
      return 'Account opening failed because National ID is missing.';
    }

    if (/ORA-01400/i.test(plainReason)) {
      return 'Account opening failed because a required customer field is missing.';
    }

    if (!plainReason) {
      return 'Account opening failed in CBS. Please review the customer data and try again.';
    }

    return plainReason.length > 220
      ? `${plainReason.slice(0, 217).trimEnd()}...`
      : plainReason;
  }

  getStatusPanelRows(): { label: string; value: string | number }[] {
    const customer = this.customer();

    if (!customer) {
      return [];
    }

    return [
      { label: 'Product', value: customer.productType || customer.accountType || '-' },
      { label: 'Tracking No', value: customer.trackingNo || customer.applicationId || '-' },
      { label: 'Step No', value: customer.stepNo ?? '-' },
      { label: 'Sanction Screening', value: customer.sanctionScreening || '-' },
      { label: 'Deposit Per Month', value: customer.depositPerMonth ?? '-' },
      { label: 'Withdrawal Per Month', value: customer.withdrawalPerMonth ?? '-' },
      { label: 'Onboarded From', value: customer.onboardedFrom || '-' },
      { label: 'Branch Info', value: customer.branchInfo || customer.branch || '-' },
      { label: 'FATCA Checked', value: customer.fatcaChecked || '-' },
      { label: 'RM Code', value: customer.rmCode || '-' }
    ];
  }

  canAuthorize(): boolean {
    const customer = this.customer();
    return customer?.status === 'unauthorized' && customer.authPermission === true;
  }

  canDecline(): boolean {
    const customer = this.customer();
    const status = customer?.status;

    return customer?.authPermission === true &&
      (status === 'unauthorized' || status === 'incomplete');
  }

  openAuthorizeModal(): void {
    if (!this.canAuthorize()) {
      return;
    }

    this.errorMessage.set(null);
    this.acceptanceReason.set(this.customer()?.loanBoAcceptanceReason || '');
    this.authorizeModalOpened.set(true);
  }

  closeAuthorizeModal(): void {
    if (this.isActionLoading()) {
      return;
    }

    this.authorizeModalOpened.set(false);
  }

  openDeclineModal(): void {
    if (!this.canDecline()) {
      return;
    }

    this.errorMessage.set(null);
    this.declineReason.set('');
    this.declineModalOpened.set(true);
  }

  closeDeclineModal(): void {
    if (this.isActionLoading()) {
      return;
    }

    this.declineModalOpened.set(false);
  }

  authorizationRequirementMessage(): string | null {
    const customer = this.customer();

    if (!customer) {
      return null;
    }

    const riskGrading = Number(customer.riskGrading ?? 0);
    const eddCheck = Number(customer.eddCheck ?? 0);
    const bankShortName = customer.bankShortName?.trim().toUpperCase();
    const customerEkycType = customer.customerEkycType?.trim().toUpperCase();

    if (bankShortName === 'NBP') {
      if (riskGrading <= 0) {
        return 'Please complete Risk Grading before authorizing.';
      }

      if (riskGrading >= 15 && eddCheck <= 0) {
        return 'EDD is required for Risk Score 15 or above before authorizing.';
      }

      return null;
    }

    if (customerEkycType === 'REGULAR' && riskGrading <= 0) {
      return 'Please complete Risk Grading before authorizing.';
    }

    return null;
  }

  requiresLoanBoAcceptanceReason(): boolean {
    const productTypeName = this.customer()?.productTypeName?.trim().toUpperCase();
    return productTypeName === 'LOAN' || productTypeName === 'BO';
  }

  needsNewLoanBoAcceptanceReason(): boolean {
    return this.requiresLoanBoAcceptanceReason() &&
      !Boolean(this.customer()?.loanBoAcceptanceReason?.trim());
  }

  canSubmitAuthorization(): boolean {
    if (this.isActionLoading() || Boolean(this.authorizationRequirementMessage())) {
      return false;
    }

    if (this.needsNewLoanBoAcceptanceReason()) {
      return Boolean(this.acceptanceReason().trim());
    }

    return true;
  }

  submitAuthorization(): void {
    const customer = this.customer();

    if (!customer || !this.canAuthorize() || !this.canSubmitAuthorization()) {
      return;
    }

    this.isActionLoading.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set(null);

    let request$: Observable<AdminekycCustomerActionResponse>;

    if (this.needsNewLoanBoAcceptanceReason()) {
      request$ = this.customerService
        .saveLoanBoAcceptanceReason(customer, this.acceptanceReason())
        .pipe(switchMap(() => this.customerService.authorizeCustomer(customer)));
    } else {
      request$ = this.customerService.authorizeCustomer(customer);
    }

    request$.subscribe({
      next: (response) => {
        this.isActionLoading.set(false);
        this.authorizeModalOpened.set(false);
        this.actionMessage.set(response.message?.trim() || 'Customer authorized successfully.');
        this.loadCustomer(false);
      },
      error: (error: unknown) => {
        this.isActionLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.authorizeModalOpened.set(false);
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(this.getErrorMessage(error, 'Authorization failed.'));
      }
    });
  }

  submitDecline(): void {
    const customer = this.customer();
    const reason = this.declineReason().trim();

    if (!customer || !this.canDecline()) {
      return;
    }

    if (!reason) {
      this.errorMessage.set('Please enter a decline reason.');
      return;
    }

    this.isActionLoading.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set(null);

    this.customerService.declineCustomer(customer, reason).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.declineModalOpened.set(false);
        this.actionMessage.set('Customer declined successfully.');
        this.loadCustomer(false);
      },
      error: (error: unknown) => {
        this.isActionLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.declineModalOpened.set(false);
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(this.getErrorMessage(error, 'Failed to decline customer.'));
      }
    });
  }

  getFilePreviewData(
    url: string | null | undefined,
    fileName: string,
    mimeType: string
  ): FilePreviewData | null {
    if (!url) {
      return null;
    }

    const key = `${url}|${fileName}|${mimeType}`;
    const cached = this.filePreviewCache.get(key);

    if (cached) {
      return cached;
    }

    const fileData: FilePreviewData = { url, fileName, mimeType };
    this.filePreviewCache.set(key, fileData);
    return fileData;
  }

  private syncServiceControls(customer: AdminCustomer | null): void {
    const alerts = customer?.alerts;

    this.smsApproved.set(alerts?.smsAlertDone === true);
    this.emailApproved.set(alerts?.emailAlertDone === true);
    this.chequeBookApproved.set(alerts?.chequeAlertDone === true);
    this.debitCardApproved.set(alerts?.debitAlertDone === true);
    this.debitRestrictionRequested.set(
      alerts?.debitRestrictionWithdrawal === true
    );
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

  private handleCustomerActionError(error: unknown, fallback: string): void {
    if (this.isSessionExpired(error)) {
      this.state.closeUserModal();
      this.state.goToLogin();
      return;
    }

    this.errorMessage.set(this.getErrorMessage(error, fallback));
  }

  private toPlainText(value: string): string {
    return value
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractStoredReason(value: string): string {
    const withoutPrefix = value.replace(/^Reason:\s*/i, '').trim();
    const technicalDetailsIndex = withoutPrefix.search(
      /\b(?:Occured|Occurred)\s+At:|\bError Description:/i
    );

    return (technicalDetailsIndex >= 0
      ? withoutPrefix.slice(0, technicalDetailsIndex)
      : withoutPrefix
    ).trim();
  }

  private isSessionExpired(error: unknown): boolean {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return true;
    }

    return error instanceof AdminekycApiError &&
      error.status === 'UNAUTH' &&
      error.apiMessage?.trim().toLowerCase() === 'valid session required.';
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
