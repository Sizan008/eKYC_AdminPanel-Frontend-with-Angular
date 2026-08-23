import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycParameterRequest,
  AdminekycParameterResponse
} from '../models/adminekyc-parameter.model';
import { AdminParameter, ParameterFormValue } from '../models/parameters.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class ParametersService {
  constructor(private api: AdminekycApi) {}

  getParameters(): Observable<AdminParameter[]> {
    return this.api
      .getApi<AdminekycParameterResponse[]>(
        ADMINEKYC_API_ENDPOINTS.parameterConfig.index
      )
      .pipe(
        map((parameters) =>
          (parameters ?? [])
            .map((parameter) => this.mapParameter(parameter))
            .filter((parameter) => !!parameter.id)
        )
      );
  }

  /** Calls the permission-aware Spring GET /Create endpoint. */
  getCreateForm(): Observable<ParameterFormValue> {
    return this.api
      .getApi<AdminekycParameterResponse>(
        ADMINEKYC_API_ENDPOINTS.parameterConfig.createView
      )
      .pipe(map((response) => this.mapForm(response)));
  }

  /**
   * Index intentionally truncates ParamValue to 30 chars to match the legacy
   * .NET list. Always retrieve Edit/{ParamName} before editing so the form gets
   * the full value and cannot accidentally save a truncated list value.
   */
  getParameter(parameterName: string): Observable<AdminParameter> {
    const key = this.requireParameterName(parameterName);

    return this.api
      .getApi<AdminekycParameterResponse>(
        ADMINEKYC_API_ENDPOINTS.parameterConfig.editById(key)
      )
      .pipe(map((response) => this.mapParameter(response)));
  }

  createParameter(formValue: ParameterFormValue): Observable<string> {
    const payload = this.toRequest(formValue);

    return this.api
      .postApiResponse<AdminekycParameterResponse, AdminekycParameterRequest>(
        ADMINEKYC_API_ENDPOINTS.parameterConfig.create,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() ||
            'Parameter configuration created successfully.'
        )
      );
  }

  updateParameter(
    parameterName: string,
    formValue: ParameterFormValue
  ): Observable<string> {
    const key = this.requireParameterName(parameterName);
    const payload = this.toRequest(formValue);

    if (payload.ParamName !== key) {
      throw new Error('Parameter name cannot be changed.');
    }

    return this.api
      .postApiResponse<AdminekycParameterResponse, AdminekycParameterRequest>(
        ADMINEKYC_API_ENDPOINTS.parameterConfig.editById(key),
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() ||
            'Parameter configuration updated successfully.'
        )
      );
  }

  private mapParameter(response: AdminekycParameterResponse): AdminParameter {
    const parameterName = this.toText(response?.ParamName);

    return {
      id: parameterName,
      parameterName,
      parameterValue: this.toText(response?.ParamValue),
      parameterDescription: this.toText(response?.Description),
      privacyLevel: this.toText(response?.PrivacyLevel)
    };
  }

  private mapForm(response: AdminekycParameterResponse | null): ParameterFormValue {
    return {
      parameterName: this.toText(response?.ParamName),
      parameterValue: this.toText(response?.ParamValue),
      parameterDescription: this.toText(response?.Description),
      privacyLevel: this.toText(response?.PrivacyLevel)
    };
  }

  private toRequest(formValue: ParameterFormValue): AdminekycParameterRequest {
    const parameterName = this.requireParameterName(formValue.parameterName);
    const parameterValue = this.requireValue(
      formValue.parameterValue,
      'Parameter Value',
      2000
    );

    return {
      ParamName: parameterName,
      ParamValue: parameterValue,
      Description: this.toNullableValue(
        formValue.parameterDescription,
        'Parameter Description',
        2000
      ),
      PrivacyLevel: this.toNullableValue(
        formValue.privacyLevel,
        'Privacy Level',
        2000
      )
    };
  }

  private requireParameterName(value: string): string {
    const normalized = String(value ?? '').trim();

    if (!normalized) {
      throw new Error('Parameter Name is required.');
    }

    if (normalized.length > 450) {
      throw new Error('Parameter Name must be at most 450 characters.');
    }

    return normalized;
  }

  private requireValue(value: string, label: string, maxLength: number): string {
    const normalized = String(value ?? '');

    // Oracle treats an empty string as NULL while APP_SETTINGS.VALUE is NOT NULL.
    if (!normalized.length) {
      throw new Error(`${label} is required.`);
    }

    if (normalized.length > maxLength) {
      throw new Error(`${label} must be at most ${maxLength} characters.`);
    }

    return normalized;
  }

  private toNullableValue(
    value: string,
    label: string,
    maxLength: number
  ): string | null {
    const normalized = String(value ?? '');

    if (normalized.length > maxLength) {
      throw new Error(`${label} must be at most ${maxLength} characters.`);
    }

    return normalized === '' ? null : normalized;
  }

  private toText(value: string | null | undefined): string {
    return value ?? '';
  }
}
