import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserNote } from './usernote.model';
import { environment } from '../../../../environments/environment';


@Injectable({
    providedIn: 'root',
})
export class UserNoteService {
    constructor(
        private http: HttpClient
    ) { }

    getUserNoteByNoteId(
        noteId: string
    ): Observable<IUserNote> {
        var reqHeader = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        let httpParams = new HttpParams()
            .set('noteId', noteId);

        return this.http.get<IUserNote>(
            `${environment.centrinoUrl}/note/getUserNoteByNoteId`,
            { headers: reqHeader, params: httpParams }
        );
    }

    getUserNoteByUserId(
        userId: string
    ): Observable<IUserNote[]> {
        var reqHeader = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        let httpParams = new HttpParams().set('userId', userId);
        // return this.cacheService.cacheRequest("UserAccountListBY" + accountType, () => {
        return this.http.get<IUserNote[]>(
            `${environment.centrinoUrl}/note/getUserNoteByUserId`,
            { headers: reqHeader, params: httpParams }
        );
        // });
    }

    manageUserNote(
        userNoteParam: IUserNote
    ): Observable<IUserNote> {
        let reqHeader = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        return this.http.post<IUserNote>(
            `${environment.centrinoUrl}/note/createUserNote`,
            userNoteParam,
            { headers: reqHeader }
        );
    }

    deleteUserNote(noteId: string
    ): Observable<IUserNote> {
        let reqHeader = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        let httpParams = new HttpParams().set('noteId', noteId);

        return this.http.post<IUserNote>(
            `${environment.centrinoUrl}/note/deleteUserNote`, {},
            { headers: reqHeader, params: httpParams }
        );
    }
}
