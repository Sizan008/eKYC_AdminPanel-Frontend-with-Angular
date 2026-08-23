import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  // APIs where token must be added
  const shouldAttachToken =
    req.url.startsWith(environment.apiBaseUrl) ||
    req.url.startsWith(environment.sentinelUrl) ||
    req.url.startsWith(environment.bffUrl);

  if (shouldAttachToken && token) {
    // Get session data
    const userId = sessionStorage.getItem('userId') || '';
    const appId = sessionStorage.getItem('appId') || '';
    const functionId = sessionStorage.getItem('functionId') || '';

    // Build headers object
    let headers = {
      Authorization: `Bearer ${token}`,
    } as any;

    // Add custom headers if values exist
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (appId) {
      headers['X-App-Id'] = appId;
    }
    if (functionId) {
      headers['X-Function-Id'] = functionId;
    }

    const authReq = req.clone({
      setHeaders: headers,
    });

    return next(authReq);
  }

  // Default: no token added
  return next(req);
};

