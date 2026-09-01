// import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
// import {map} from 'rxjs/operators';
// import { inject, Injectable } from '@angular/core';
// import Keycloak from 'keycloak-js';
// import {AuthUtils} from './auth.utils';
// import {User} from '../user/user.types';
// import {UserService} from '../user/user.service';
// import { environment } from '../../../environments/environment';
 
 
// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private _authenticated: boolean = false;
//   private _keycloak: Keycloak | undefined;
//   private http: HttpClient= inject(HttpClient);
//   private _userService = inject(UserService);
//   private _token: string = '';
//   get token(): string {
//     return this._token;
//   }
//   // -----------------------------------------------------------------------------------------------------
//   // @ Accessors
//   // -----------------------------------------------------------------------------------------------------
 
//   get keycloak(): Keycloak {
//     if (!this._keycloak) {
//       this._keycloak = new Keycloak({
//         url: environment.keycloak.url,
//         realm: environment.keycloak.realm,
//         clientId: environment.keycloak.clientId
//       });
//     }
//     return this._keycloak;
//   }
 
//   get authenticated(): boolean {
//     return this._authenticated;
//   }
 
//   async init(): Promise<boolean> {
//     this._authenticated = await this.keycloak.init({
//       onLoad: 'check-sso',
//       redirectUri: window.location.origin + window.location.pathname,
//       pkceMethod: 'S256',
//       checkLoginIframe: true,
//       checkLoginIframeInterval: 5
//     });
//     if (this._authenticated) {
//       this._token = this.keycloak.token || '';
//       this.decodeToken();
//     }
//     // 🔄 Token expired → auto refresh
//     this.keycloak.onTokenExpired = () => {
//       this.keycloak.updateToken(29)
//         .then(refreshed => {
//           if (refreshed) {
//             this._token = this.keycloak.token || '';
//             this.decodeToken();
//           }
//         })
//         .catch(() => {
//           this.login();
//         });
//     };
//     // 🔔 Global logout detect
//     this.keycloak.onAuthLogout = () => {
//       this.login();
//     };
//     return this._authenticated;
//   }
 
//   login(): void {
//     this.keycloak.login({
//       redirectUri: environment.redirectUri
//     });
//   }
 
//   logout(): void {
//     localStorage.clear();
//     sessionStorage.clear();
//     this.keycloak.logout({redirectUri: environment.loginUrl});
//   }
 
//   decodeToken(): void {
//     sessionStorage.setItem('access_token', this.keycloak.token || '')
//     this.userInfo(this.keycloak.token || '');
//   }
 
//   userInfo(token: string){
//     const decodeToken = AuthUtils._decodeToken(this.keycloak.token || '');
//     if(!decodeToken)
//       return;
//     let user = {} as User;
//     user.name = decodeToken.name;
//     user.email = decodeToken.email;
//     user.realmAccess = decodeToken.realm_access;
//     user.resourceAccess = decodeToken.resource_access;
//     user.officeId = decodeToken.officeId;
//     user.orgId = decodeToken.orgId;
//     user.employeeId = decodeToken.employeeId;
//     user.username = decodeToken.preferred_username;
//     user.clickStreamTrack = decodeToken.clickStreamTrack;
//     user.userTerminalIP = decodeToken.userTerminalIP;
 
//     // Store user ID in session storage
//     if (user.username) {
//       sessionStorage.setItem('userId', user.username);
//     }
//     if (user.employeeId) {
//       sessionStorage.setItem('employeeId', user.employeeId);
//     }
 
//     // Store app ID from environment
//     if (environment.appId) {
//       sessionStorage.setItem('appId', environment.appId);
//     }
 
//     this._userService.user = user;
//     if(user.officeId){this.getSessionData(user.officeId);}
//   }
 
//   getSessionData(officeId:string){
//     this.http.get(`${environment.centrinoUrl}/office-session/getOfficeSession/${officeId}`).subscribe({
//       next: (officeData: any) => {
//         console.log("officeData...", officeData);
//         // Store office data in sessionStorage
//         sessionStorage.setItem('companyId', officeData.companyId);
//         sessionStorage.setItem('companyName', officeData.companyName);
//         sessionStorage.setItem('officeId', officeData.officeId);
//         sessionStorage.setItem('officeCode', officeData.officeCode);
//         sessionStorage.setItem('officeNm', officeData.officeNm);
//         sessionStorage.setItem('entityTypeId', officeData.entityTypeId);
//         sessionStorage.setItem('officeTypeId', officeData.officeTypeId);
//         sessionStorage.setItem('officeControlId', officeData.officeControlId);
//         sessionStorage.setItem('txnDt', officeData.txnDt);
//         sessionStorage.setItem('operationMode', officeData.operationMode);
//         sessionStorage.setItem('operationModeFunction', officeData.operationModeFunction);
//         sessionStorage.setItem('instituteType', officeData.instituteType);
//         sessionStorage.setItem('localCurrencyId', officeData.localCurrencyId);
//         sessionStorage.setItem('custProdIdLen', officeData.custProdIdLen);
//         sessionStorage.setItem('custAccountNoLen', officeData.custAccountNoLen);
//         sessionStorage.setItem('accountNoPtrnFlag', officeData.accountNoPtrnFlag);
//         sessionStorage.setItem('errorCode', officeData.errorCode);
//         sessionStorage.setItem('errorMessage', officeData.errorMessage);
//       },
//       error: (err) => {
//         console.error('Error loading office session:', err);
//       }
//     });
//   }
 
 
//   private getUserId(): string {
//     const token = this.keycloak.token || '';
//     if (!token) return '';
//     const decoded = AuthUtils._decodeToken(token);
//     return decoded?.preferred_username || '';
//   }
 
//   getResources(){
//     const userId = this.getUserId();
//     const params = new HttpParams({
//       fromObject: { userId: userId, appId: environment.appId }
//     });
//     let url = environment.sentinelUrl + '/resource-access/retrieveList';
//     return this.http.get<any>(url, {params}).pipe(
//       map((res: any) => {
//         const transformed = (res.resourceUserList || []).map((item: any) => ({
//           attributes: {
//             functionId: item.functionId,
//             functionName: item.functionNm,
//             moduleId: item.moduleId,
//             moduleName: item.moduleNm,
//             functionType: item.functionType,
//             quickRoute: item.quickRouteNo
//           },
//           uris: item.appRoute,
//           routePath: item.routePath,
//           createFlag: item.createFlag,
//           updateFlag: item.updateFlag,
//           deleteFlag: item.deleteFlag,
//           readFlag: item.readFlag
//         }));
//         return transformed;
//       })
//     );
//   }
 
//   getUserWiseApplications(){
//     const userId = this.getUserId();
//     const params = new HttpParams({
//       fromObject: { userId: userId }
//     });
//     let url = environment.sentinelUrl  + '/user-access/getAppsByUserId';
//     return this.http.get<any>(url, {params}).pipe(
//       map((res: any) => {
//         return (res.apps || []).map((app: any) => ({
//           appId: app.appId,
//           appName: app.appName,
//           appUri: app.appUri || ''
//         }));
//       })
//     );
//   }
 
//   getAllApplications(){
//     const params = new HttpParams({
//       fromObject: { appId: environment.appId }
//     });
//     let url = environment.bffUrl + '/applications-generic'
//     return this.http.get<any>(url, {params});
//   }
 
//   /**
//    * Store function ID in session storage
//    * Call this when user selects or navigates to a function
//    */
//   setFunctionId(functionId: string): void {
//     if (functionId) {
//       sessionStorage.setItem('functionId', functionId);
//     }
//   }
 
//   /**
//    * Get stored function ID from session storage
//    */
//   getFunctionId(): string {
//     return sessionStorage.getItem('functionId') || '';
//   }
 
//   /**
//    * Get stored user ID from session storage
//    */
//   getStoredUserId(): string {
//     return sessionStorage.getItem('userId') || '';
//   }
 
//   /**
//    * Get stored app ID from session storage
//    */
//   getStoredAppId(): string {
//     return sessionStorage.getItem('appId') || '';
//   }
 
// }
 
 
 
 
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
 
import { map } from 'rxjs/operators';
 
import {
  inject,
  Injectable
} from '@angular/core';
 
import Keycloak from 'keycloak-js';
 
import { AuthUtils } from './auth.utils';
import { User } from '../user/user.types';
import { UserService } from '../user/user.service';
import { environment } from '../../../environments/environment';
 
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  private _authenticated: boolean = false;
 
  private _keycloak: Keycloak | undefined;
 
  private http: HttpClient = inject(HttpClient);
 
  private _userService = inject(UserService);
 
  private _token: string = '';
 
 
  // =========================================================
  // TOKEN
  // =========================================================
 
  get token(): string {
    return this._token;
  }
 
 
  // =========================================================
  // PUBLIC ROUTE CHECK
  // =========================================================
 
  private isPublicRoute(): boolean {

  const path = window.location.pathname;

  return (
    path === '/' ||

    path === '/onb/user' ||
    path.startsWith('/onb/user/') ||

    path === '/onboardingAdmineKYC' ||
    path.startsWith('/onboardingAdmineKYC/')
  );
}
 
  // =========================================================
  // KEYCLOAK GETTER
  // =========================================================
 
  get keycloak(): Keycloak {
 
    if (!this._keycloak) {
 
      this._keycloak = new Keycloak({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });
 
    }
 
    return this._keycloak;
  }
 
 
  // =========================================================
  // AUTHENTICATED
  // =========================================================
 
  get authenticated(): boolean {
    return this._authenticated;
  }
 
 
  // =========================================================
  // INITIALIZE AUTH
  // =========================================================
 
  async init(): Promise<boolean> {
 
    // -------------------------------------------------------
    // PUBLIC eKYC ROUTE
    // Keycloak এখানে initialize হবে না
    // -------------------------------------------------------
 
    if (this.isPublicRoute()) {
 
      console.log(
        '✅ Public onboarding route detected. Keycloak skipped.'
      );
 
      this._authenticated = false;
      this._token = '';
 
      return false;
    }
 
 
    // -------------------------------------------------------
    // SECURED ROUTES
    // -------------------------------------------------------
 
    try {
 
      this._authenticated = await this.keycloak.init({
 
        onLoad: 'check-sso',
 
        redirectUri:
          window.location.origin +
          window.location.pathname,
 
        pkceMethod: 'S256',
 
        checkLoginIframe: true,
 
        checkLoginIframeInterval: 5
 
      });
 
 
      // -----------------------------------------------------
      // AUTHENTICATED USER
      // -----------------------------------------------------
 
      if (this._authenticated) {
 
        this._token =
          this.keycloak.token || '';
 
        this.decodeToken();
 
      }
 
 
      // -----------------------------------------------------
      // TOKEN EXPIRED
      // -----------------------------------------------------
 
      this.keycloak.onTokenExpired = () => {
 
        if (this.isPublicRoute()) {
          return;
        }
 
 
        this.keycloak
          .updateToken(29)
          .then(refreshed => {
 
            if (refreshed) {
 
              this._token =
                this.keycloak.token || '';
 
              this.decodeToken();
 
            }
 
          })
          .catch(error => {
 
            console.error(
              'Token refresh failed:',
              error
            );
 
 
            if (!this.isPublicRoute()) {
              this.login();
            }
 
          });
 
      };
 
 
      // -----------------------------------------------------
      // GLOBAL LOGOUT DETECT
      // -----------------------------------------------------
 
      this.keycloak.onAuthLogout = () => {
 
        if (!this.isPublicRoute()) {
          this.login();
        }
 
      };
 
 
      return this._authenticated;
 
    } catch (error) {
 
      console.error(
        'Keycloak initialization failed:',
        error
      );
 
      this._authenticated = false;
      this._token = '';
 
      return false;
    }
 
  }
 
 
  // =========================================================
  // LOGIN
  // =========================================================
 
  login(): void {
 
    // Public onboarding থেকে Keycloak login না
    if (this.isPublicRoute()) {
 
      console.log(
        'Public onboarding page. Keycloak login skipped.'
      );
 
      return;
    }
 
 
    this.keycloak.login({
 
      redirectUri:
        environment.redirectUri
 
    });
 
  }
 
 
  // =========================================================
  // LOGOUT
  // =========================================================
 
  logout(): void {
 
    localStorage.clear();
    sessionStorage.clear();
 
 
    this._authenticated = false;
    this._token = '';
 
 
    // Public onboarding route হলে
    // Keycloak object touch করবে না
    if (this.isPublicRoute()) {
 
      console.log(
        'Public onboarding page. Keycloak logout skipped.'
      );
 
      return;
    }
 
 
    this.keycloak.logout({
 
      redirectUri:
        environment.loginUrl
 
    });
 
  }
 
 
  // =========================================================
  // DECODE TOKEN
  // =========================================================
 
  decodeToken(): void {
 
    // Public route-এ Keycloak ব্যবহার করবে না
    if (this.isPublicRoute()) {
      return;
    }
 
 
    // _keycloak use করছি যাতে unnecessary
    // getter call করে object create না হয়
    const token =
      this._keycloak?.token || '';
 
 
    if (!token) {
      return;
    }
 
 
    sessionStorage.setItem(
      'access_token',
      token
    );
 
 
    this.userInfo(token);
 
  }
 
 
  // =========================================================
  // USER INFO
  // =========================================================
 
  userInfo(token: string): void {
 
    if (this.isPublicRoute()) {
      return;
    }
 
 
    if (!token) {
      return;
    }
 
 
    const decodeToken =
      AuthUtils._decodeToken(token);
 
 
    if (!decodeToken) {
      return;
    }
 
 
    const user = {} as User;
 
 
    user.name =
      decodeToken.name;
 
    user.email =
      decodeToken.email;
 
    user.realmAccess =
      decodeToken.realm_access;
 
    user.resourceAccess =
      decodeToken.resource_access;
 
    user.officeId =
      decodeToken.officeId;
 
    user.orgId =
      decodeToken.orgId;
 
    user.employeeId =
      decodeToken.employeeId;
 
    user.username =
      decodeToken.preferred_username;
 
    user.clickStreamTrack =
      decodeToken.clickStreamTrack;
 
    user.userTerminalIP =
      decodeToken.userTerminalIP;
 
 
    // -------------------------------------------------------
    // USER ID
    // -------------------------------------------------------
 
    if (user.username) {
 
      sessionStorage.setItem(
        'userId',
        user.username
      );
 
    }
 
 
    // -------------------------------------------------------
    // EMPLOYEE ID
    // -------------------------------------------------------
 
    if (user.employeeId) {
 
      sessionStorage.setItem(
        'employeeId',
        user.employeeId
      );
 
    }
 
 
    // -------------------------------------------------------
    // APPLICATION ID
    // -------------------------------------------------------
 
    if (environment.appId) {
 
      sessionStorage.setItem(
        'appId',
        environment.appId
      );
 
    }
 
 
    // -------------------------------------------------------
    // UPDATE USER SERVICE
    // -------------------------------------------------------
 
    this._userService.user = user;
 
 
    // -------------------------------------------------------
    // OFFICE SESSION
    // -------------------------------------------------------
 
    if (user.officeId) {
 
      this.getSessionData(
        user.officeId
      );
 
    }
 
  }
 
 
  // =========================================================
  // OFFICE SESSION DATA
  // =========================================================
 
  getSessionData(
    officeId: string
  ): void {
 
    this.http.get(
 
      `${environment.centrinoUrl}/office-session/getOfficeSession/${officeId}`
 
    ).subscribe({
 
      next: (officeData: any) => {
 
        console.log(
          'officeData...',
          officeData
        );
 
 
        sessionStorage.setItem(
          'companyId',
          officeData.companyId
        );
 
        sessionStorage.setItem(
          'companyName',
          officeData.companyName
        );
 
        sessionStorage.setItem(
          'officeId',
          officeData.officeId
        );
 
        sessionStorage.setItem(
          'officeCode',
          officeData.officeCode
        );
 
        sessionStorage.setItem(
          'officeNm',
          officeData.officeNm
        );
 
        sessionStorage.setItem(
          'entityTypeId',
          officeData.entityTypeId
        );
 
        sessionStorage.setItem(
          'officeTypeId',
          officeData.officeTypeId
        );
 
        sessionStorage.setItem(
          'officeControlId',
          officeData.officeControlId
        );
 
        sessionStorage.setItem(
          'txnDt',
          officeData.txnDt
        );
 
        sessionStorage.setItem(
          'operationMode',
          officeData.operationMode
        );
 
        sessionStorage.setItem(
          'operationModeFunction',
          officeData.operationModeFunction
        );
 
        sessionStorage.setItem(
          'instituteType',
          officeData.instituteType
        );
 
        sessionStorage.setItem(
          'localCurrencyId',
          officeData.localCurrencyId
        );
 
        sessionStorage.setItem(
          'custProdIdLen',
          officeData.custProdIdLen
        );
 
        sessionStorage.setItem(
          'custAccountNoLen',
          officeData.custAccountNoLen
        );
 
        sessionStorage.setItem(
          'accountNoPtrnFlag',
          officeData.accountNoPtrnFlag
        );
 
        sessionStorage.setItem(
          'errorCode',
          officeData.errorCode
        );
 
        sessionStorage.setItem(
          'errorMessage',
          officeData.errorMessage
        );
 
      },
 
 
      error: (err) => {
 
        console.error(
          'Error loading office session:',
          err
        );
 
      }
 
    });
 
  }
 
 
  // =========================================================
  // GET USER ID
  // =========================================================
 
  private getUserId(): string {
 
    // Public route-এ Keycloak object create করব না
    if (this.isPublicRoute()) {
      return '';
    }
 
 
    const token =
      this._keycloak?.token || '';
 
 
    if (!token) {
      return '';
    }
 
 
    const decoded =
      AuthUtils._decodeToken(token);
 
 
    return (
      decoded?.preferred_username || ''
    );
 
  }
 
 
  // =========================================================
  // GET RESOURCES
  // =========================================================
 
  getResources() {
 
    const userId =
      this.getUserId();
 
 
    const params =
      new HttpParams({
 
        fromObject: {
 
          userId: userId,
 
          appId:
            environment.appId
 
        }
 
      });
 
 
    const url =
      environment.sentinelUrl +
      '/resource-access/retrieveList';
 
 
    return this.http
      .get<any>(
        url,
        { params }
      )
      .pipe(
 
        map((res: any) => {
 
          const transformed =
            (res.resourceUserList || [])
              .map((item: any) => ({
 
                attributes: {
 
                  functionId:
                    item.functionId,
 
                  functionName:
                    item.functionNm,
 
                  moduleId:
                    item.moduleId,
 
                  moduleName:
                    item.moduleNm,
 
                  functionType:
                    item.functionType,
 
                  quickRoute:
                    item.quickRouteNo
 
                },
 
                uris:
                  item.appRoute,
 
                routePath:
                  item.routePath,
 
                createFlag:
                  item.createFlag,
 
                updateFlag:
                  item.updateFlag,
 
                deleteFlag:
                  item.deleteFlag,
 
                readFlag:
                  item.readFlag
 
              }));
 
 
          return transformed;
 
        })
 
      );
 
  }
 
 
  // =========================================================
  // USER WISE APPLICATIONS
  // =========================================================
 
  getUserWiseApplications() {
 
    const userId =
      this.getUserId();
 
 
    const params =
      new HttpParams({
 
        fromObject: {
          userId: userId
        }
 
      });
 
 
    const url =
      environment.sentinelUrl +
      '/user-access/getAppsByUserId';
 
 
    return this.http
      .get<any>(
        url,
        { params }
      )
      .pipe(
 
        map((res: any) => {
 
          return (
            res.apps || []
          ).map((app: any) => ({
 
            appId:
              app.appId,
 
            appName:
              app.appName,
 
            appUri:
              app.appUri || ''
 
          }));
 
        })
 
      );
 
  }
 
 
  // =========================================================
  // GET ALL APPLICATIONS
  // =========================================================
 
  getAllApplications() {
 
    const params =
      new HttpParams({
 
        fromObject: {
 
          appId:
            environment.appId
 
        }
 
      });
 
 
    const url =
      environment.bffUrl +
      '/applications-generic';
 
 
    return this.http.get<any>(
      url,
      { params }
    );
 
  }
 
 
  // =========================================================
  // SET FUNCTION ID
  // =========================================================
 
  setFunctionId(
    functionId: string
  ): void {
 
    if (functionId) {
 
      sessionStorage.setItem(
        'functionId',
        functionId
      );
 
    }
 
  }
 
 
  // =========================================================
  // GET FUNCTION ID
  // =========================================================
 
  getFunctionId(): string {
 
    return (
      sessionStorage.getItem(
        'functionId'
      ) || ''
    );
 
  }
 
 
  // =========================================================
  // STORED USER ID
  // =========================================================
 
  getStoredUserId(): string {
 
    return (
      sessionStorage.getItem(
        'userId'
      ) || ''
    );
 
  }
 
 
  // =========================================================
  // STORED APP ID
  // =========================================================
 
  getStoredAppId(): string {
 
    return (
      sessionStorage.getItem(
        'appId'
      ) || ''
    );
 
  }
 
}