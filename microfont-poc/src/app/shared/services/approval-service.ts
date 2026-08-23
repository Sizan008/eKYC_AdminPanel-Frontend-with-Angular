import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {  Observable} from "rxjs";
import { ApprovalRequest } from "../models/approval";
import { environment } from "../../../environments/environment";
@Injectable({
  providedIn: 'root'   // <-- makes the service available app-wide
})
export class ApprovalService {
  constructor(private http: HttpClient) { }

  getUnApprovedList(userId : string): Observable<any> {
    console.log('in service : ', userId);
    var url = `${environment.sentinelUrl}/approval-register/all-pending/${userId}`;
    return this.http.get<any>(url);
  }

  getAllApprovedList(userId : string): Observable<any> {
    var url = `${environment.sentinelUrl}/approval-register/all-registered/${userId}`;
    return this.http.get<any>(url);
  }

  getApprovalQueue(setId: number): Observable<any> {
    var url = `${environment.sentinelUrl}/approval-register/approvalQue/${setId}`;
    return this.http.get<any>(url);
  }

  performApprovalOperation(req: ApprovalRequest): Observable<any> {
    const url = `${environment.sentinelUrl}/approval-register/operation/${req.officeId}/${req.appId }/${req.setId}/${req.approvalLevel}/${req.nextApprovalLevel}/Test/${req.userId}/${req.approvalFlag}`;
    return this.http.get(url, { responseType: 'text' });
  }
}
