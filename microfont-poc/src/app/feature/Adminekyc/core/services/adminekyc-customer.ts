import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import { AdminCustomer, AdminCustomerStatus } from '../models/admin-customer.model';
import {
  AdminekycCustomerActionResponse,
  AdminekycCustomerDetailsResponse,
  AdminekycCustomerNomineeResponse,
  AdminekycCustomerProductResponse,
  AdminekycDeclineCustomerRequest
} from '../models/adminekyc-customer-details.model';
import {
  AdminCustomerPage,
  AdminekycCustomerListItemResponse,
  AdminekycCustomerPageResponse,
  AdminekycCustomerSearchQuery
} from '../models/adminekyc-customer-list.model';
import { CustomerListType } from './adminekyc-state';
import { AdminekycApi } from './adminekyc-api';
import { toAdminekycStaticUrl } from '../utils/adminekyc-url.util';

@Injectable({
  providedIn: 'root'
})
export class AdminekycCustomer {
  private readonly api = inject(AdminekycApi);

  /**
   * Phase 3 server-backed list endpoint. Calling the dedicated endpoint also
   * stores the current auth type in the Spring session for subsequent Search calls.
   */
  getCustomerPage(
    type: CustomerListType,
    pageNumber = 1
  ): Observable<AdminCustomerPage> {
    return this.api
      .getApi<AdminekycCustomerPageResponse>(
        this.getListEndpoint(type),
        { pageNumber }
      )
      .pipe(map((response) => this.mapCustomerPage(response, type)));
  }

  /** Spring Search uses the auth type previously stored by the selected list endpoint. */
  searchCustomerPage(
    type: CustomerListType,
    search: AdminekycCustomerSearchQuery,
    pageNumber = 1
  ): Observable<AdminCustomerPage> {
    return this.api
      .getApi<AdminekycCustomerPageResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.search,
        {
          MobileNo: this.clean(search.mobileNumber),
          TrackingNo: this.clean(search.trackingNumber),
          NidNo: this.clean(search.nidNumber),
          CustomerId: this.clean(search.customerId),
          DateFrom: this.clean(search.fromDate),
          DateTo: this.clean(search.toDate),
          accountNoFrom: this.clean(search.accountFrom),
          accountNoTo: this.clean(search.accountTo),
          SelectedBranchId: this.clean(search.branchId),
          pageNumber
        }
      )
      .pipe(map((response) => this.mapCustomerPage(response, type)));
  }

  /**
   * Phase 4 details flow. DetailsMain already includes the main profile, photos,
   * service flags, permission state and debit-restriction status. Product and
   * first nominee are loaded as optional enrichments because the Angular UI
   * exposes those fields as part of the same details screen.
   */
  getCustomerById(customerId: number): Observable<AdminCustomer | null> {
    return this.api
      .getApi<AdminekycCustomerDetailsResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.detailsMain,
        { id: customerId }
      )
      .pipe(
        switchMap((details) => {
          const customer = this.mapCustomerDetails(details);

          const product$ = this.shouldLoadProductDetails(details)
            ? this.api
                .getApi<AdminekycCustomerProductResponse>(
                  ADMINEKYC_API_ENDPOINTS.customerProfile.productDetails,
                  { id: customerId }
                )
                .pipe(catchError(() => of(null)))
            : of(null);

          const nominee$ = this.toNonNegativeInteger(details.NomineeCount) > 0
            ? this.api
                .getApi<AdminekycCustomerNomineeResponse>(
                  ADMINEKYC_API_ENDPOINTS.customerProfile.nomineeDetails,
                  { id: customerId, nomineeNo: 1 }
                )
                .pipe(catchError(() => of(null)))
            : of(null);

          return forkJoin({ product: product$, nominee: nominee$ }).pipe(
            map(({ product, nominee }) =>
              this.enrichCustomerDetails(customer, product, nominee)
            )
          );
        })
      );
  }

  /**
   * Authorize uses the Spring raw CustomerActionResponse returned by OpenAccount.
   * A non-OK action response is converted into an observable error so the page
   * does not report a failed CBS/open-account operation as a success.
   */
  authorizeCustomer(customer: AdminCustomer): Observable<AdminekycCustomerActionResponse> {
    const trackingNo = this.requireTrackingNo(customer);

    return this.api
      .get<AdminekycCustomerActionResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.openAccount,
        { id: trackingNo }
      )
      .pipe(map((response) => this.assertSuccessfulAction(response, 'Authorization failed.')));
  }

  /** Spring DeclineCustomer request keys are lower camel-case (no JsonProperty annotations). */
  declineCustomer(customer: AdminCustomer, declineReason: string): Observable<void> {
    const trackingNo = this.requireTrackingNo(customer);
    const reason = declineReason.trim();

    if (!reason) {
      return throwError(() => new Error('Please enter a decline reason.'));
    }

    const payload: AdminekycDeclineCustomerRequest = {
      trackingNo,
      declineReason: reason
    };

    return this.api
      .post<Record<string, string>, AdminekycDeclineCustomerRequest>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.declineAccount,
        payload
      )
      .pipe(map(() => undefined));
  }

  /**
   * Legacy .NET required an acceptance reason before authorizing Loan/BO customers.
   * Spring exposes the same behavior through POST /LoanBOAcceptReason using request params.
   */
  saveLoanBoAcceptanceReason(
    customer: AdminCustomer,
    acceptanceReason: string
  ): Observable<void> {
    const trackingNo = this.requireTrackingNo(customer);
    const reason = acceptanceReason.trim();

    if (!reason) {
      return throwError(() => new Error('Please enter an acceptance reason.'));
    }

    return this.api
      .post<Record<string, string>, null>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.loanBoAcceptReason,
        null,
        {
          LBACReason: reason,
          trackingNo
        }
      )
      .pipe(map(() => undefined));
  }

  /** Legacy dummy-json helpers retained for modules that have not yet been migrated. */
  getCustomers(): Observable<AdminCustomer[]> {
    return this.api
      .get<AdminCustomer[]>(ADMINEKYC_API_ENDPOINTS.customers)
      .pipe(
        map((customers) => customers.map((customer) => this.normalizeCustomer(customer)))
      );
  }

  getCustomersByType(type: CustomerListType): Observable<AdminCustomer[]> {
    return this.getCustomers().pipe(
      map((customers) => customers.filter((customer) => customer.status === type))
    );
  }

  private getListEndpoint(type: CustomerListType): string {
    switch (type) {
      case 'authorized':
        return ADMINEKYC_API_ENDPOINTS.customerProfile.authorizedCustomers;
      case 'unauthorized':
        return ADMINEKYC_API_ENDPOINTS.customerProfile.unauthorizedCustomers;
      case 'declined':
        return ADMINEKYC_API_ENDPOINTS.customerProfile.declinedCustomers;
      case 'incomplete':
      default:
        return ADMINEKYC_API_ENDPOINTS.customerProfile.incompleteCustomers;
    }
  }

  private mapCustomerPage(
    response: AdminekycCustomerPageResponse,
    fallbackType: CustomerListType
  ): AdminCustomerPage {
    return {
      customers: (response.Customers ?? []).map((customer) =>
        this.mapCustomerListItem(customer, fallbackType)
      ),
      pageNumber: this.toPositiveInteger(response.PageNumber, 1),
      pageSize: this.toPositiveInteger(response.PageSize, 8),
      totalCount: this.toNonNegativeInteger(response.TotalCount),
      totalPages: this.toNonNegativeInteger(response.TotalPages),
      authType: this.mapAuthStatus(response.AuthType, fallbackType),
      isHeadOffice: Boolean(response.IsHeadOffice)
    };
  }

  private mapCustomerListItem(
    response: AdminekycCustomerListItemResponse,
    fallbackType: CustomerListType
  ): AdminCustomer {
    const trackingNo = this.resolveTrackingNo(response);
    const status = this.mapAuthStatus(response.AuthStatus, fallbackType);
    const photoUrl = this.toImageDataUrl(response.ImageBase64);

    return {
      id: trackingNo,
      applicationId: response.CustomerId || String(trackingNo),
      trackingNo: response.TrackingNoStr || String(trackingNo),
      customerId: response.CustomerId || undefined,
      accountNo: response.AccountNo || undefined,
      customerName: response.Fullname || '-',
      fatherName: response.FatherNameEN || undefined,
      motherName: response.MotherNameEN || undefined,
      gender: response.Gender || undefined,
      dateOfBirth: response.DOB || undefined,
      nidNo: response.NidNo || undefined,
      mobileNo: response.MobileNo || undefined,
      email: response.Email || undefined,
      religion: response.Religion === null || response.Religion === undefined
        ? undefined
        : String(response.Religion),
      occupation: response.Profession || undefined,
      sourceOfFund: response.source_of_fund || undefined,
      branch: response.Branch || undefined,
      permanentAddress: response.PermanentAddress || undefined,
      productType: response.PRODUCT_NM || response.Product || undefined,
      accountType: response.custEkycType || undefined,
      documents: photoUrl
        ? {
            customerPhotoUrl: photoUrl
          }
        : undefined,
      verification: {
        faceMatchScore: this.toOptionalNumber(response.FaceMatchScore),
        authentication: response.AuthStatus || undefined
      },
      status,
      authorizedBy: response.AuthBy || undefined,
      authorizedAt: response.AuthDate || undefined,
      createdAt: response.MakeDate || undefined,
      makeDate: response.MakeDate || undefined,
      declinedReason: response.DeclineReasonTrimmed || response.DeclineReason || undefined
    };
  }

  private mapCustomerDetails(response: AdminekycCustomerDetailsResponse): AdminCustomer {
    const trackingNo = this.toPositiveInteger(response.TrackingNo, 0);
    const status = this.mapDetailsAuthStatus(response.AuthStatus);
    const photos = response.Photos;
    const debitRestriction = response.DebitRestriction;
    const debitResult = this.normalizeTextResult(debitRestriction?.result);
    const branchInfo = [response.BranchId, response.BranchName]
      .filter((value) => Boolean(value?.trim()))
      .join(' - ');

    return {
      id: trackingNo,
      applicationId: response.CustomerId || String(trackingNo),
      trackingNo: trackingNo ? String(trackingNo) : undefined,
      customerId: response.CustomerId || undefined,
      accountNo: response.AccountNo || undefined,
      customerName: response.FullnameEN || response.FullnameBN || '-',
      fatherName: response.FatherNameEN || response.FatherNameBN || undefined,
      motherName: response.MotherNameEN || response.MotherNameBN || undefined,
      spouseName: response.SpouseName || undefined,
      gender: response.Gender || undefined,
      dateOfBirth: response.Birthdate || undefined,
      nidNo: response.NidNo || undefined,
      mobileNo: response.MobileNo || undefined,
      email: response.Email || undefined,
      religion: response.Religion === null || response.Religion === undefined
        ? undefined
        : String(response.Religion),
      occupation: response.Profession || undefined,
      branch: response.BranchName || response.BranchId || undefined,
      branchInfo: branchInfo || undefined,
      presentAddress: response.PresentAddressEN || response.PresentAddressBN || undefined,
      permanentAddress: response.PermanentAddress || undefined,
      productType: response.ProductName || response.ProductId || undefined,
      productTypeName: response.ProductTypeName || undefined,
      customerEkycType: response.custEkycType || undefined,
      accountType: response.ProductTypeName || response.custEkycType || undefined,
      accountStatus: response.AccountStatus || undefined,
      stepNo: this.toOptionalNumber(response.TrackingStatus),
      sanctionScreening: response.SacntionScreening || undefined,
      depositPerMonth: this.toOptionalNumber(response.DepositPerMonth),
      withdrawalPerMonth: this.toOptionalNumber(response.WithdrawPerMonth),
      onboardedFrom: response.RequestChannel || undefined,
      fatcaChecked: response.FatkaChecked ? 'Yes' : 'No',
      rmCode: response.rmcode || undefined,
      riskGrading: this.toOptionalNumber(response.RiskGrading),
      maximumRiskGrading: this.toOptionalNumber(response.maxRiskGrading),
      eddCheck: this.toOptionalNumber(response.Edd_Check),
      bankShortName: response.BankShNm || undefined,
      authPermission: Boolean(response.AuthPermission),
      pendingBranchAuthorization: Boolean(response.PendingBranchAuthorization),
      alerts: {
        debitRestrictionWithdrawal:
          debitRestriction?.status?.trim().toUpperCase() === 'OK' && debitResult === 'false',
        debitRestrictionHidden: debitResult === 'hidden',
        smsAlert: this.flagEnabled(response.SmsAlertFlag),
        smsAlertDone: this.flagDone(response.SmsAlertFlag),
        emailAlert: this.flagEnabled(response.EmailAlertFlag),
        emailAlertDone: this.flagDone(response.EmailAlertFlag),
        chequeAlert: this.flagEnabled(response.ChqBookFlag),
        chequeAlertDone: this.flagDone(response.ChqBookFlag),
        debitAlert: this.flagEnabled(response.DebitCardFlag),
        debitAlertDone: this.flagDone(response.DebitCardFlag)
      },
      documents: {
        customerPhotoUrl: this.toImageDataUrl(response.CustPhoto || photos?.FromUploaded),
        capturedPhotoUrl: this.toImageDataUrl(photos?.FromUploaded || response.CustPhoto),
        nidPhotoUrl: this.toImageDataUrl(response.NidPhoto || photos?.FromNid),
        porichoyPhotoUrl: this.toImageDataUrl(response.PorichoyPhoto || photos?.FromPorichoy),
        nidFrontUrl: this.toImageDataUrl(response.NidFront || photos?.NidFront),
        nidBackUrl: this.toImageDataUrl(response.NidBack || photos?.NidBack),
        signatureUrl: this.toImageDataUrl(response.SignPhoto || photos?.FromSignature)
      },
      verification: {
        faceMatchScore: this.toOptionalNumber(response.FaceMatchScoreCard),
        authentication: this.toAuthCode(status)
      },
      status,
      authorizedBy: response.authBy || response.AuthBy || undefined,
      authorizedAt: response.authDate || undefined,
      declinedBy: status === 'declined' ? response.checkBy || undefined : undefined,
      declinedAt: status === 'declined' ? response.checkDate || undefined : undefined,
      declinedReason: response.DeclineReason || undefined,
      unauthorizedReason:
        status === 'unauthorized' ? response.DeclineReason || undefined : undefined
    };
  }

  private enrichCustomerDetails(
    customer: AdminCustomer,
    product: AdminekycCustomerProductResponse | null,
    nominee: AdminekycCustomerNomineeResponse | null
  ): AdminCustomer {
    const productDetails = product?.Details ?? {};
    const sourceOfIncome = this.stringFromUnknown(productDetails['SourceOfIncome']);
    const monthlyIncome = this.numberFromUnknown(productDetails['MonthlyIncome']);
    const acceptanceReason = this.stringFromUnknown(productDetails['Udf_5']);

    return {
      ...customer,
      productType: product?.ProductName || customer.productType,
      productTypeName: product?.ProductTypeName || customer.productTypeName,
      accountType: product?.ProductTypeName || customer.accountType,
      sourceOfFund: sourceOfIncome || customer.sourceOfFund,
      monthlyIncome: monthlyIncome ?? customer.monthlyIncome,
      loanBoAcceptanceReason: acceptanceReason || customer.loanBoAcceptanceReason,
      nominee: nominee
        ? {
            name: nominee.NomineeName || undefined,
            relation: nominee.Relation || undefined,
            nidNo: nominee.NomineeIdNo || undefined
          }
        : customer.nominee,
      documents: {
        ...(customer.documents ?? {}),
        nomineePhotoUrl: nominee
          ? this.toImageDataUrl(nominee.NomineePhoto)
          : customer.documents?.nomineePhotoUrl
      }
    };
  }

  private shouldLoadProductDetails(response: AdminekycCustomerDetailsResponse): boolean {
    return this.toNonNegativeInteger(response.ProductCount) > 0 || Boolean(response.ProductId);
  }

  private resolveTrackingNo(response: AdminekycCustomerListItemResponse): number {
    const numeric = Number(response.TrackingNo ?? response.TrackingNoStr ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private mapAuthStatus(
    status: string | null | undefined,
    fallback: CustomerListType
  ): AdminCustomerStatus {
    switch (status?.trim().toUpperCase()) {
      case 'A':
        return 'authorized';
      case 'U':
        return 'unauthorized';
      case 'I':
        return 'incomplete';
      case 'D':
        return 'declined';
      default:
        return fallback;
    }
  }

  private mapDetailsAuthStatus(status: string | null | undefined): AdminCustomerStatus {
    switch (status?.trim().toUpperCase()) {
      case 'A':
      case 'AUTHORIZED':
        return 'authorized';
      case 'U':
      case 'UNAUTHORIZED':
        return 'unauthorized';
      case 'D':
      case 'DECLINED':
        return 'declined';
      case 'I':
      case 'INCOMPLETE':
      default:
        return 'incomplete';
    }
  }

  private toAuthCode(status: AdminCustomerStatus): string {
    switch (status) {
      case 'authorized':
        return 'A';
      case 'unauthorized':
        return 'U';
      case 'declined':
        return 'D';
      case 'incomplete':
      default:
        return 'I';
    }
  }

  private assertSuccessfulAction(
    response: AdminekycCustomerActionResponse | null | undefined,
    fallbackMessage: string
  ): AdminekycCustomerActionResponse {
    if (response?.status?.trim().toUpperCase() === 'OK') {
      return response;
    }

    const message = response?.message?.trim()
      || this.stringFromUnknown(response?.result)
      || fallbackMessage;

    throw new Error(message);
  }

  private requireTrackingNo(customer: AdminCustomer): number {
    const trackingNo = Number(customer.id || customer.trackingNo || 0);

    if (!Number.isFinite(trackingNo) || trackingNo <= 0) {
      throw new Error('Invalid customer tracking number.');
    }

    return trackingNo;
  }

  private flagEnabled(value: number | null | undefined): boolean {
    return Number(value ?? 0) >= 1;
  }

  private flagDone(value: number | null | undefined): boolean {
    return Number(value ?? 0) === 2;
  }

  private normalizeTextResult(value: unknown): string {
    return this.stringFromUnknown(value)?.trim().toLowerCase() ?? '';
  }

  private stringFromUnknown(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized || undefined;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return undefined;
  }

  private numberFromUnknown(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private toImageDataUrl(value: string | null | undefined): string | undefined {
    const base64 = value?.trim();

    if (!base64) {
      return undefined;
    }

    if (base64.startsWith('data:')) {
      return base64;
    }

    let mimeType = 'image/jpeg';

    if (base64.startsWith('iVBORw0KGgo')) {
      mimeType = 'image/png';
    } else if (base64.startsWith('R0lGOD')) {
      mimeType = 'image/gif';
    } else if (base64.startsWith('UklGR')) {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${base64}`;
  }

  private clean(value: string | null | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private toOptionalNumber(value: number | null | undefined): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private toPositiveInteger(value: number | null | undefined, fallback: number): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
  }

  private toNonNegativeInteger(value: number | null | undefined): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
  }

  private normalizeCustomer(customer: AdminCustomer): AdminCustomer {
    return {
      ...customer,
      documents: customer.documents
        ? {
            ...customer.documents,
            customerPhotoUrl: toAdminekycStaticUrl(customer.documents.customerPhotoUrl),
            nidPhotoUrl: toAdminekycStaticUrl(customer.documents.nidPhotoUrl),
            porichoyPhotoUrl: toAdminekycStaticUrl(customer.documents.porichoyPhotoUrl),
            capturedPhotoUrl: toAdminekycStaticUrl(customer.documents.capturedPhotoUrl),
            nidFrontUrl: toAdminekycStaticUrl(customer.documents.nidFrontUrl),
            nidBackUrl: toAdminekycStaticUrl(customer.documents.nidBackUrl),
            signatureUrl: toAdminekycStaticUrl(customer.documents.signatureUrl),
            nomineePhotoUrl: toAdminekycStaticUrl(customer.documents.nomineePhotoUrl)
          }
        : undefined
    };
  }
}
