import {inject} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import { environment } from '../../../environments/environment.prod';

export class ApiService<I> {

  protected http = inject(HttpClient);
  public readonly baseUrl: string;

  constructor(basePath: string) {
    this.baseUrl = environment.apiBaseUrl + basePath;
  }

  protected getFullUrl(path: string = ''): string {
    return this.baseUrl + (path ? '/' + path : '');
  }

  save(data: I): Observable<I> {
    return this.http.post<I>(this.baseUrl, data);
  }

  update(i: I): Observable<I> {
    return this.http.put<I>(this.baseUrl, i);
  }

  delete(uuid: any): Observable<I> {
    return this.http.delete<I>(this.baseUrl + '/' + uuid);
  }

  preview(data: I): Observable<I> {
    return this.http.post<I>(this.baseUrl+'/preview', data);
  }
}
