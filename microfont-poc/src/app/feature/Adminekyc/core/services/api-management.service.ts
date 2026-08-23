import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycApiConnectionResponse,
  AdminekycCreateApiConnectionRequest,
  AdminekycUpdateApiConnectionRequest
} from '../models/adminekyc-api-management.model';
import {
  AdminApiManagement,
  ApiManagementFormValue
} from '../models/api-management.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class ApiManagementService {
  constructor(private api: AdminekycApi) {}

  getApiManagements(): Observable<AdminApiManagement[]> {
    return this.api
      .getApi<AdminekycApiConnectionResponse[]>(
        ADMINEKYC_API_ENDPOINTS.apiManagement.index
      )
      .pipe(
        map((items) =>
          (items ?? [])
            .map((item) => this.mapApiConnection(item))
            .filter((item) => item.id > 0)
        )
      );
  }

  /** Calls the Spring ADD-permission endpoint before opening the form. */
  getCreateForm(): Observable<ApiManagementFormValue> {
    return this.api
      .getApi<AdminekycApiConnectionResponse>(
        ADMINEKYC_API_ENDPOINTS.apiManagement.createView
      )
      .pipe(map((response) => this.mapForm(response)));
  }

  getApiManagement(apiId: number): Observable<AdminApiManagement> {
    const id = this.requirePositiveId(apiId);

    return this.api
      .getApi<AdminekycApiConnectionResponse>(
        ADMINEKYC_API_ENDPOINTS.apiManagement.editById(id)
      )
      .pipe(map((response) => this.mapApiConnection(response)));
  }

  createApiManagement(formValue: ApiManagementFormValue): Observable<string> {
    const payload = this.toCreateRequest(formValue);

    return this.api
      .postApiResponse<void, AdminekycCreateApiConnectionRequest>(
        ADMINEKYC_API_ENDPOINTS.apiManagement.create,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'API connection created successfully.'
        )
      );
  }

  updateApiManagement(
    apiId: number,
    formValue: ApiManagementFormValue
  ): Observable<string> {
    const payload: AdminekycUpdateApiConnectionRequest = {
      ApiConnId: this.requirePositiveId(apiId),
      ...this.toCreateRequest(formValue)
    };

    return this.api
      .postApiResponse<
        AdminekycApiConnectionResponse,
        AdminekycUpdateApiConnectionRequest
      >(ADMINEKYC_API_ENDPOINTS.apiManagement.edit, payload)
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'API connection updated successfully.'
        )
      );
  }

  private mapApiConnection(
    response: AdminekycApiConnectionResponse
  ): AdminApiManagement {
    return {
      id: this.toPositiveId(response?.ApiConnId),
      name: this.toText(response?.ApiConnName),
      key: this.toText(response?.ApiConnKey),
      port: this.toText(response?.ApiConnPort),
      url: this.toText(response?.ApiConnUrl),
      user: this.toText(response?.ApiConnUser),
      password: this.toText(response?.ApiConnPass),
      credential: this.toText(response?.ApiCredential)
    };
  }

  private mapForm(
    response: AdminekycApiConnectionResponse | null
  ): ApiManagementFormValue {
    return {
      name: this.toText(response?.ApiConnName),
      key: this.toText(response?.ApiConnKey),
      port: this.toText(response?.ApiConnPort),
      url: this.toText(response?.ApiConnUrl),
      user: this.toText(response?.ApiConnUser),
      password: this.toText(response?.ApiConnPass),
      credential: this.toText(response?.ApiCredential)
    };
  }

  private toCreateRequest(
    formValue: ApiManagementFormValue
  ): AdminekycCreateApiConnectionRequest {
    return {
      ApiConnName: this.toNullableField(formValue.name, 'Name'),
      ApiConnKey: this.toNullableField(formValue.key, 'Key'),
      ApiConnPort: this.toNullableField(formValue.port, 'Port'),
      ApiConnUrl: this.toNullableField(formValue.url, 'URL'),
      ApiConnUser: this.toNullableField(formValue.user, 'User'),
      ApiConnPass: this.toNullableField(formValue.password, 'Password'),
      ApiCredential: this.toNullableField(formValue.credential, 'Credential')
    };
  }

  private toNullableField(value: string, label: string): string | null {
    const normalized = String(value ?? '');

    if (normalized.length > 2000) {
      throw new Error(`${label} must be at most 2000 characters.`);
    }

    return normalized === '' ? null : normalized;
  }

  private requirePositiveId(value: number): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('API connection ID is invalid.');
    }

    return id;
  }

  private toPositiveId(value: number | null | undefined): number {
    const id = Number(value ?? 0);
    return Number.isInteger(id) && id > 0 ? id : 0;
  }

  private toText(value: string | null | undefined): string {
    return value ?? '';
  }
}
