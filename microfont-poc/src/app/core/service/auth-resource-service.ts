import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppFunctionsRequest } from '../utils/model/common.model';

@Injectable({
  providedIn: 'root'
})
export class AuthResourceService {

  constructor(private http: HttpClient) {}

 /* getApplications(): Observable<MetaAppListItem[]> {
    const url = `${environment.sentinelUrl}/api/app-list/get-all`;
    return this.http.get<MetaAppListItem[]>(url);
  }*/

  getApplications(): Observable<any[]> {
    const url = `${environment.bffUrl}/applications-generic`;

    return this.http.get<{ data: any[], meta: any }>(url).pipe(
      map(res => res.data ?? []),
      catchError(err => {
        console.error("Error in getApplications:", err);
        return of([]);
      })
    );
  }


/*  getModules(appId: number): Observable<MetaAppModuleItem[]> {
    const url = `${environment.sentinelUrl}/api/meta-app-module/list`;
    const params = new HttpParams().set('appId', appId.toString());
    return this.http.get<MetaAppModuleItem[]>(url, { params });
  }*/
  getModules(appId: number): Observable<any[]> {
    const url = `${environment.bffUrl}/applications/${appId}/modules`;

    return this.http.get<{ data: any[], meta: any }>(url).pipe(
      map(res => res.data ?? []),
      catchError(err => {
        console.error("Error in getApplications:", err);
        return of([]);
      })
    );
  }

/*  getFunctions(appId: number, moduleId?: string | number): Observable<MetaAppFunctionItem[]> {
    const url = `${environment.sentinelUrl}/api/app-functions/list`;
    let params = new HttpParams().set('appId', appId.toString());

    if (moduleId !== undefined && moduleId !== null && `${moduleId}`.trim() !== '') {
      params = params.set('moduleId', moduleId.toString());
    }

    return this.http.get<MetaAppFunctionItem[]>(url, { params });
  }*/
  getFunctions(appId: number, moduleId?: string | number): Observable<any[]> {
    const url = `${environment.bffUrl}/applications/${appId}/modules/${moduleId}/functions`;

    return this.http.get<{ data: any[], meta: any }>(url).pipe(
      map(res => res.data ?? []),
      catchError(err => {
        console.error("Error in getApplications:", err);
        return of([]);
      })
    );
  }

  getFilteredFunction(request: AppFunctionsRequest): Observable<any> {
    let params = new HttpParams();

    if (request.appId != null) {
      params = params.set('appId', request.appId.toString());
    }
    if (request.moduleId) {
      params = params.set('moduleId', request.moduleId);
    }
    if (request.functionType) {
      params = params.set('functionType', request.functionType);
    }

    const url = `${environment.sentinelUrl}/resource/retrieveResources`;
    return this.http.get<any>(url, { params });
  }

}
