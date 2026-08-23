import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  EcAddressOption,
  EcVerificationForm,
  EcVerificationRequest,
  EcVerificationResponse
} from '../models/ec-verification.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class EcVerificationService {
  constructor(private api: AdminekycApi) {}

  getDivisions(): Observable<EcAddressOption[]> {
    return this.getAddressOptions(ADMINEKYC_API_ENDPOINTS.ecVerification.divisions);
  }

  getDistricts(divisionId: number): Observable<EcAddressOption[]> {
    return this.getAddressOptions(
      ADMINEKYC_API_ENDPOINTS.ecVerification.districts,
      { divisionId }
    );
  }

  getUpazilas(districtId: number): Observable<EcAddressOption[]> {
    return this.getAddressOptions(
      ADMINEKYC_API_ENDPOINTS.ecVerification.upazilas,
      { districtId }
    );
  }

  getPostOffices(
    districtId: number,
    upazilaId: number
  ): Observable<EcAddressOption[]> {
    return this.getAddressOptions(
      ADMINEKYC_API_ENDPOINTS.ecVerification.postOffices,
      { districtId, upazilaId }
    );
  }

  verifyEcInformation(formValue: EcVerificationForm): Observable<EcVerificationResponse> {
    return this.api
      .post<EcVerificationResponse, EcVerificationRequest>(
        ADMINEKYC_API_ENDPOINTS.ecVerification.verify,
        this.toRequest(formValue)
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(this.resolveErrorMessage(error)))
        )
      );
  }

  private getAddressOptions(
    endpoint: string,
    query?: Record<string, string | number | boolean | null | undefined>
  ): Observable<EcAddressOption[]> {
    return this.api.getApi<EcAddressOption[]>(endpoint, query).pipe(
      map((options) =>
        (options ?? [])
          .map((option) => ({
            id: String(option.id ?? '').trim(),
            name: String(option.name ?? '').trim()
          }))
          .filter((option) => option.id && option.name)
      ),
      catchError((error: unknown) =>
        throwError(() => new Error(this.resolveErrorMessage(error)))
      )
    );
  }

  private toRequest(formValue: EcVerificationForm): EcVerificationRequest {
    return {
      NidOrVoterNoOrFormNoOrVoterId: this.requiredText(formValue.nid),
      Name: this.optionalText(formValue.nameBangla),
      NameEn: this.optionalText(formValue.nameEnglish),
      DateOfBirth: this.requiredText(formValue.birthDate),
      Father: this.optionalText(formValue.fatherNameBangla),
      Mother: this.optionalText(formValue.motherNameBangla),
      Spouse: this.optionalText(formValue.spouseNameBangla),
      PermanentAddress: {
        // Option A: these three values are legacy address IDs. The downstream
        // VerifID API resolves them to Bengali names before calling EC.
        Division: this.optionalText(formValue.division),
        District: this.optionalText(formValue.district),
        Upozila: this.optionalText(formValue.upazila),
        // Legacy VerifID API does not resolve PostOffice by ID; send its name.
        PostOffice: this.optionalText(formValue.postOffice),
        PostalCode: this.optionalText(formValue.postalCode)
      }
    };
  }

  private requiredText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private optionalText(value: unknown): string | null {
    const normalized = String(value ?? '').trim();
    return normalized || null;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error.trim();
      }

      if (error.error && typeof error.error === 'object') {
        const payload = error.error as Record<string, unknown>;
        const message = payload['Message'] ?? payload['message'];
        if (typeof message === 'string' && message.trim()) {
          return message.trim();
        }
      }

      if (error.status === 0) {
        return 'Unable to connect to the EC verification service.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }

    return 'EC verification failed.';
  }
}
