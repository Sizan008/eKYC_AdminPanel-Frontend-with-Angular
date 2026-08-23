import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { ADMINEKYC_API_BASE_URL } from '../constants/adminekyc-api.constants';
import {
  AdminekycApiError,
  AdminekycApiResponse
} from '../models/adminekyc-api-response.model';
import { AdminekycSession } from './adminekyc-session';

type QueryValue = string | number | boolean | null | undefined;
type Query = Record<string, QueryValue>;

@Injectable({
  providedIn: 'root'
})
export class AdminekycApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AdminekycSession);
  private readonly baseUrl = ADMINEKYC_API_BASE_URL;

  /**
   * Raw HTTP helpers are kept for endpoints whose Spring response is not
   * wrapped in ApiResponse<T>. Every request includes the JSESSIONID cookie.
   */
  get<T>(endpoint: string, query?: Query): Observable<T> {
    return this.withSessionGuard(
      this.http.get<T>(this.buildUrl(endpoint), {
        params: this.buildParams(query),
        withCredentials: true
      })
    );
  }

  post<T, B = unknown>(endpoint: string, body: B, query?: Query): Observable<T> {
    return this.withSessionGuard(
      this.http.post<T>(this.buildUrl(endpoint), body, {
        params: this.buildParams(query),
        withCredentials: true
      })
    );
  }

  put<T, B = unknown>(endpoint: string, body: B): Observable<T> {
    return this.withSessionGuard(
      this.http.put<T>(this.buildUrl(endpoint), body, {
        withCredentials: true
      })
    );
  }

  patch<T, B = unknown>(endpoint: string, body: B): Observable<T> {
    return this.withSessionGuard(
      this.http.patch<T>(this.buildUrl(endpoint), body, {
        withCredentials: true
      })
    );
  }

  delete<T>(endpoint: string, query?: Query): Observable<T> {
    return this.withSessionGuard(
      this.http.delete<T>(this.buildUrl(endpoint), {
        params: this.buildParams(query),
        withCredentials: true
      })
    );
  }

  /**
   * Wrapped Spring API helpers. They preserve the full Status/Message/Result
   * envelope while enforcing the backend status contract.
   */
  getApiResponse<T>(
    endpoint: string,
    query?: Query
  ): Observable<AdminekycApiResponse<T>> {
    return this.get<AdminekycApiResponse<T>>(endpoint, query).pipe(
      map((response) => this.assertSuccessful(response))
    );
  }

  postApiResponse<T, B = unknown>(
    endpoint: string,
    body: B,
    query?: Query
  ): Observable<AdminekycApiResponse<T>> {
    return this.post<AdminekycApiResponse<T>, B>(endpoint, body, query).pipe(
      map((response) => this.assertSuccessful(response))
    );
  }

  putApiResponse<T, B = unknown>(
    endpoint: string,
    body: B
  ): Observable<AdminekycApiResponse<T>> {
    return this.put<AdminekycApiResponse<T>, B>(endpoint, body).pipe(
      map((response) => this.assertSuccessful(response))
    );
  }

  patchApiResponse<T, B = unknown>(
    endpoint: string,
    body: B
  ): Observable<AdminekycApiResponse<T>> {
    return this.patch<AdminekycApiResponse<T>, B>(endpoint, body).pipe(
      map((response) => this.assertSuccessful(response))
    );
  }

  deleteApiResponse<T>(
    endpoint: string,
    query?: Query
  ): Observable<AdminekycApiResponse<T>> {
    return this.delete<AdminekycApiResponse<T>>(endpoint, query).pipe(
      map((response) => this.assertSuccessful(response))
    );
  }

  /** Convenience helpers for modules that only need the Result payload. */
  getApi<T>(endpoint: string, query?: Query): Observable<T> {
    return this.getApiResponse<T>(endpoint, query).pipe(
      map((response) => response.Result)
    );
  }

  postApi<T, B = unknown>(endpoint: string, body: B, query?: Query): Observable<T> {
    return this.postApiResponse<T, B>(endpoint, body, query).pipe(
      map((response) => response.Result)
    );
  }

  putApi<T, B = unknown>(endpoint: string, body: B): Observable<T> {
    return this.putApiResponse<T, B>(endpoint, body).pipe(
      map((response) => response.Result)
    );
  }

  patchApi<T, B = unknown>(endpoint: string, body: B): Observable<T> {
    return this.patchApiResponse<T, B>(endpoint, body).pipe(
      map((response) => response.Result)
    );
  }

  deleteApi<T>(endpoint: string, query?: Query): Observable<T> {
    return this.deleteApiResponse<T>(endpoint, query).pipe(
      map((response) => response.Result)
    );
  }

  private withSessionGuard<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      map((response) => this.guardUnauthenticatedResponse(response)),
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401
        ) {
          this.session.clear();
        }

        return throwError(() => error);
      })
    );
  }

  private guardUnauthenticatedResponse<T>(response: T): T {
    if (!this.isApiResponse(response) || response.Status !== 'UNAUTH') {
      return response;
    }

    if (this.isSessionExpiredMessage(response.Message)) {
      this.session.clear();
    }

    throw new AdminekycApiError('UNAUTH', response.Message);
  }

  private isSessionExpiredMessage(message: string | null): boolean {
    return message?.trim().toLowerCase() === 'valid session required.';
  }

  private isApiResponse(value: unknown): value is AdminekycApiResponse<unknown> {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return 'Status' in value && 'Message' in value && 'Result' in value;
  }

  private assertSuccessful<T>(
    response: AdminekycApiResponse<T>
  ): AdminekycApiResponse<T> {
    if (response.Status === 'OK') {
      return response;
    }

    if (
      response.Status === 'UNAUTH' &&
      this.isSessionExpiredMessage(response.Message)
    ) {
      this.session.clear();
    }

    throw new AdminekycApiError(response.Status, response.Message);
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    const normalizedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  private buildParams(query?: Query): HttpParams {
    let params = new HttpParams();

    if (!query) {
      return params;
    }

    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
