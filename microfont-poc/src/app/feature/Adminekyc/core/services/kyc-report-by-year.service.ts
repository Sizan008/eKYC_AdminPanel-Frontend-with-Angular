import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  throwError
} from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import { AdminekycApiError } from '../models/adminekyc-api-response.model';
import {
  AdminekycCustomerActionResponse,
  AdminekycCustomerDetailsResponse,
  AdminekycCustomerNomineeResponse,
  AdminekycCustomerPhotosResponse
} from '../models/adminekyc-customer-details.model';
import {
  AdminekycCustomerListItemResponse,
  AdminekycCustomerPageResponse
} from '../models/adminekyc-customer-list.model';
import {
  KycCustomerExportResponse,
  KycCustomerReportResponse,
  KycDownloadFile,
  KycMergedPhotoResponse,
  KycReportCustomer,
  KycReportDetailsData,
  KycReportPage,
  KycServiceApprovalUpdate
} from '../models/kyc-report-by-year.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class KycReportByYearService {
  constructor(private api: AdminekycApi) {}

  /**
   * Old .NET KYCReportByYear shows the authorized-customer page (8 rows per page).
   * Spring exposes the same list through the dedicated KYCReportByYear endpoint.
   */
  getCustomerPage(pageNumber = 1): Observable<KycReportPage> {
    return this.api
      .getApi<AdminekycCustomerPageResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.kycReportByYear,
        { pageNumber }
      )
      .pipe(
        switchMap((response) => {
          const page = this.mapPage(response);

          if (page.customers.length === 0) {
            return of(page);
          }

          return forkJoin(
            page.customers.map((customer) => this.enrichListPhoto(customer))
          ).pipe(
            map((customers) => ({
              ...page,
              customers
            }))
          );
        })
      );
  }

  /** DetailsMain contains the report profile/photos/flags; nominee #1 is an optional enrichment. */
  getCustomerDetails(trackingNo: number): Observable<KycReportDetailsData> {
    return this.api
      .getApi<AdminekycCustomerDetailsResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.detailsMain,
        { id: trackingNo }
      )
      .pipe(
        switchMap((profile) => {
          const nominee$ = Number(profile.NomineeCount ?? 0) > 0
            ? this.api
                .getApi<AdminekycCustomerNomineeResponse>(
                  ADMINEKYC_API_ENDPOINTS.customerProfile.nomineeDetails,
                  { id: trackingNo, nomineeNo: 1 }
                )
                .pipe(
                  catchError((error: unknown) =>
                    this.isSessionExpired(error)
                      ? throwError(() => error)
                      : of(null)
                  )
                )
            : of(null);

          return nominee$.pipe(
            map((nominee) => ({
              profile,
              nominee
            }))
          );
        })
      );
  }

  /**
   * Legacy screen input is "years back" (1 = previous year), not a list filter.
   * Spring Excel expects the calculated calendar year.
   */
  downloadYearReport(yearsBack: number): Observable<KycDownloadFile> {
    const safeYearsBack = Number.isFinite(yearsBack)
      ? Math.abs(Math.trunc(yearsBack))
      : 1;
    const targetYear = new Date().getFullYear() - safeYearsBack;

    return this.api
      .get<KycCustomerExportResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.excel,
        {
          year: targetYear,
          ProductTypeId: '0'
        }
      )
      .pipe(
        map((response) => {
          const base64 = this.cleanBase64(response.pdfData);

          if (!base64) {
            throw new Error('No KYC report data is available for the selected year.');
          }

          return {
            blob: this.base64ToBlob(
              base64,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ),
            fileName: this.ensureExtension(
              response.docname || `KYC Report ${targetYear}`,
              '.xlsx'
            )
          };
        })
      );
  }

  withdrawDebitRestriction(trackingNo: number): Observable<string> {
    return this.api
      .get<AdminekycCustomerActionResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.withdrawDebitRestriction,
        { trackingNo }
      )
      .pipe(
        map((response) =>
          this.assertActionSuccess(
            response,
            'Failed to withdraw debit restriction.'
          )
        )
      );
  }

  updateCustomerServices(
    trackingNo: number,
    update: KycServiceApprovalUpdate
  ): Observable<string> {
    return this.api
      .post<AdminekycCustomerActionResponse, null>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.updateServices,
        null,
        {
          trackingNo,
          smsAlertFlag: update.smsAlertFlag,
          emailAlertFlag: update.emailAlertFlag,
          debitCardFlag: update.debitCardFlag,
          chqBookFlag: update.chqBookFlag
        }
      )
      .pipe(
        map((response) =>
          this.assertActionSuccess(
            response,
            'Failed to update customer services.'
          )
        )
      );
  }

  downloadCustomerReport(trackingNo: number): Observable<KycDownloadFile> {
    return this.api
      .get<KycCustomerReportResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.generateReport,
        { trackingNo }
      )
      .pipe(
        map((response) => {
          const base64 = this.cleanBase64(response.pdfData);

          if (response.isSuccess === false || !base64) {
            throw new Error(
              response.errorMessage?.trim()
                || response.result?.trim()
                || 'Failed to generate customer report.'
            );
          }

          return {
            blob: this.base64ToBlob(base64, 'application/pdf'),
            fileName: `Report-${trackingNo}.pdf`
          };
        })
      );
  }

  downloadCustomerPhotos(
    trackingNo: number,
    customerId: string | null | undefined
  ): Observable<KycDownloadFile> {
    return this.api
      .get<KycMergedPhotoResponse>(
        ADMINEKYC_API_ENDPOINTS.report.mergedCustomerPhotoAndSignature,
        { trackingNo }
      )
      .pipe(
        map((response) => {
          const base64 = this.cleanBase64(response.pdfData);

          if (!base64) {
            throw new Error(response.result?.trim() || 'Failed to download customer photos.');
          }

          const customerName = customerId?.trim() || 'BLANK';

          return {
            blob: this.base64ToBlob(base64, 'image/jpeg'),
            fileName: `${this.safeFileName(customerName)} Photo and Sign.jpg`
          };
        })
      );
  }

  /** Handles Spring raw image base64 as well as already-normalized browser URLs. */
  toImageSource(value: string | null | undefined): string {
    const image = value?.trim();

    if (!image) {
      return '';
    }

    if (
      image.startsWith('data:')
      || image.startsWith('blob:')
      || image.startsWith('http://')
      || image.startsWith('https://')
    ) {
      return image;
    }

    const base64Marker = image.toLowerCase().indexOf('base64,');
    const base64 = base64Marker >= 0
      ? image.slice(base64Marker + 'base64,'.length).trim()
      : image;

    if (!this.looksLikeBase64(base64)) {
      return '';
    }

    let mimeType = 'image/jpeg';

    if (base64.startsWith('iVBOR')) {
      mimeType = 'image/png';
    } else if (base64.startsWith('R0lGOD')) {
      mimeType = 'image/gif';
    } else if (base64.startsWith('UklGR')) {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${base64}`;
  }

  private mapPage(response: AdminekycCustomerPageResponse): KycReportPage {
    return {
      customers: (response.Customers ?? []).map((item) => this.mapCustomer(item)),
      pageNumber: this.toPositiveInteger(response.PageNumber, 1),
      pageSize: this.toPositiveInteger(response.PageSize, 8),
      totalCount: this.toNonNegativeInteger(response.TotalCount),
      totalPages: this.toNonNegativeInteger(response.TotalPages)
    };
  }

  private mapCustomer(item: AdminekycCustomerListItemResponse): KycReportCustomer {
    const trackingNo = this.resolveTrackingNo(item);

    return {
      id: trackingNo,
      trackingNo,
      fullName: item.Fullname?.trim() || 'N/A',
      mobileNo: item.MobileNo?.trim() || 'N/A',
      nidNo: item.NidNo?.trim() || 'N/A',
      customerId: item.CustomerId?.trim() || 'N/A',
      branch: item.Branch?.trim() || 'N/A',
      accountNo: item.AccountNo?.trim() || 'N/A',
      faceMatchScore: this.toOptionalNumber(item.FaceMatchScore),
      authStatus: item.AuthStatus?.trim() || 'N/A',
      makeDate: item.MakeDate?.trim() || '',
      imageUrl: this.toImageSource(item.ImageBase64)
    };
  }

  /** Spring list mapper currently leaves ImageBase64 empty, so mimic old .NET page thumbnails. */
  private enrichListPhoto(customer: KycReportCustomer): Observable<KycReportCustomer> {
    if (customer.imageUrl || customer.trackingNo <= 0) {
      return of(customer);
    }

    return this.api
      .getApi<AdminekycCustomerPhotosResponse>(
        ADMINEKYC_API_ENDPOINTS.customerProfile.photosAndDocs,
        { id: customer.trackingNo }
      )
      .pipe(
        map((photos) => ({
          ...customer,
          imageUrl: this.toImageSource(photos.FromUploaded)
        })),
        catchError((error: unknown) =>
          this.isSessionExpired(error)
            ? throwError(() => error)
            : of(customer)
        )
      );
  }

  private resolveTrackingNo(item: AdminekycCustomerListItemResponse): number {
    const numeric = Number(item.TrackingNo ?? item.TrackingNoStr ?? 0);
    return Number.isFinite(numeric) && numeric > 0 ? Math.trunc(numeric) : 0;
  }

  private cleanBase64(value: string | null | undefined): string {
    const raw = value?.trim();

    if (!raw) {
      return '';
    }

    const markerIndex = raw.toLowerCase().indexOf('base64,');
    return markerIndex >= 0
      ? raw.slice(markerIndex + 'base64,'.length).trim()
      : raw;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
  }

  private looksLikeBase64(value: string): boolean {
    if (value.length < 32 || value.length % 4 !== 0) {
      return false;
    }

    return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
  }

  private ensureExtension(fileName: string, extension: string): string {
    const cleaned = this.safeFileName(fileName.trim() || 'KYC Report');
    return cleaned.toLowerCase().endsWith(extension.toLowerCase())
      ? cleaned
      : `${cleaned}${extension}`;
  }

  private safeFileName(value: string): string {
    return value.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'download';
  }

  private assertActionSuccess(
    response: AdminekycCustomerActionResponse,
    fallback: string
  ): string {
    if (response.status?.trim().toUpperCase() === 'OK') {
      return response.message?.trim() || fallback;
    }

    const result = typeof response.result === 'string'
      ? response.result.trim()
      : '';

    throw new Error(response.message?.trim() || result || fallback);
  }

  private isSessionExpired(error: unknown): boolean {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return true;
    }

    return error instanceof AdminekycApiError
      && error.status === 'UNAUTH'
      && error.apiMessage?.trim().toLowerCase() === 'valid session required.';
  }

  private toOptionalNumber(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private toPositiveInteger(value: number | null | undefined, fallback: number): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.trunc(numeric) : fallback;
  }

  private toNonNegativeInteger(value: number | null | undefined): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.trunc(numeric) : 0;
  }
}
