import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycCurrentUserResponse,
  AdminekycFunctionAccessResponse,
  AdminekycLoginRequest,
  AdminekycLoginResponse,
  AdminekycSessionUserResponse
} from '../models/adminekyc-account-auth.model';
import { AdminFunctionAccess, AdminUser } from '../models/admin-user.model';
import { AdminekycApi } from './adminekyc-api';
import { AdminekycSession } from './adminekyc-session';

@Injectable({
  providedIn: 'root'
})
export class AdminekycAuth {
  private readonly api = inject(AdminekycApi);
  private readonly session = inject(AdminekycSession);

  readonly currentAdmin = this.session.currentAdmin;

  login(username: string, password: string): Observable<AdminUser> {
    const request: AdminekycLoginRequest = {
      UserName: username.trim(),
      Password: password
    };

    return this.api
      .postApi<AdminekycLoginResponse, AdminekycLoginRequest>(
        ADMINEKYC_API_ENDPOINTS.account.validate,
        request
      )
      .pipe(
        map((response) => this.mapLoginResponse(response)),
        tap((admin) => this.session.setCurrentAdmin(admin))
      );
  }

  /**
   * Re-validates the browser's JSESSIONID against Spring Boot on app startup.
   * Cached login details are preserved when the lightweight getUserName
   * endpoint does not return the full permission/session payload.
   */
  restoreSession(): Observable<AdminUser | null> {
    const cachedAdmin = this.session.currentAdmin();

    return this.api
      .getApi<AdminekycSessionUserResponse>(
        ADMINEKYC_API_ENDPOINTS.account.currentUser
      )
      .pipe(
        map((response) => this.mapRestoredUser(response, cachedAdmin)),
        tap((admin) => this.session.setCurrentAdmin(admin)),
        catchError(() => {
          this.session.clear();
          return of(null);
        })
      );
  }

  /**
   * Existing pages expect logout() to be synchronous. Clear local state
   * immediately, then invalidate the Spring session in the background.
   */
  logout(): void {
    this.session.clear();

    this.api
      .getApiResponse<void>(ADMINEKYC_API_ENDPOINTS.account.signOut)
      .subscribe({
        error: () => {
          // Local logout is already complete. A failed remote sign-out should
          // not leave the Angular UI in an authenticated state.
        }
      });
  }

  isLoggedIn(): boolean {
    return this.session.hasCurrentAdmin();
  }

  setCurrentAdmin(admin: AdminUser): void {
    this.session.setCurrentAdmin(admin);
  }

  private mapLoginResponse(response: AdminekycLoginResponse): AdminUser {
    if (!response?.CurrentUser) {
      throw new Error('Login response did not include CurrentUser.');
    }

    return this.mapCurrentUser(response.CurrentUser);
  }

  private mapCurrentUser(user: AdminekycCurrentUserResponse): AdminUser {
    return {
      id: this.clean(user.UserId),
      username: this.clean(user.LoginId) || this.clean(user.UserId),
      name: this.clean(user.UserNm) || this.clean(user.LoginId) || 'Admin',
      role: '',
      status: 'active',
      userId: this.clean(user.UserId),
      loginId: this.clean(user.LoginId),
      homeBranchId: this.clean(user.HomeBranchId),
      homeBranchName: this.clean(user.HomeBranchName),
      sessionId: this.clean(user.SessionId),
      functionAccess: (user.UserFunctionAccess ?? []).map((access) =>
        this.mapFunctionAccess(access)
      )
    };
  }

  private mapRestoredUser(
    response: AdminekycSessionUserResponse,
    cachedAdmin: AdminUser | null
  ): AdminUser {
    const restoredName = this.clean(response.UserName);
    const restoredBranchId = this.clean(response.UserBranch);
    const restoredBranchName = this.clean(response.UserBranchName);

    return {
      id: cachedAdmin?.id || restoredName,
      username: cachedAdmin?.username || restoredName,
      name: restoredName || cachedAdmin?.name || 'Admin',
      email: cachedAdmin?.email,
      role: cachedAdmin?.role || '',
      status: 'active',
      userId: cachedAdmin?.userId || '',
      loginId: cachedAdmin?.loginId || cachedAdmin?.username || restoredName,
      homeBranchId: restoredBranchId || cachedAdmin?.homeBranchId || '',
      homeBranchName:
        restoredBranchName || cachedAdmin?.homeBranchName || '',
      sessionId: cachedAdmin?.sessionId || '',
      functionAccess: cachedAdmin?.functionAccess ?? []
    };
  }

  private mapFunctionAccess(
    access: AdminekycFunctionAccessResponse
  ): AdminFunctionAccess {
    return {
      targetPath: this.clean(access.TargetPath),
      allowAddFlag: access.AllowAddFlag ?? 0,
      allowEditFlag: access.AllowEditFlag ?? 0,
      allowDeleteFlag: access.AllowDeleteFlag ?? 0,
      allowViewFlag: access.AllowViewFlag ?? 0,
      allowAuthFlag: access.AllowAuthFlag ?? 0,
      allowProcessFlag: access.AllowProcessFlag ?? 0,
      allowReportViewFlag: access.AllowReportViewFlag ?? 0,
      allowReportPrintFlag: access.AllowReportPrintFlag ?? 0,
      allowReportGenFlag: access.AllowReportGenFlag ?? 0
    };
  }

  private clean(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}
