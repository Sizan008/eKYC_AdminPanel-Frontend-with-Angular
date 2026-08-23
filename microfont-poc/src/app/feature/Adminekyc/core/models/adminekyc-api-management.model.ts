/** Exact Spring Boot JSON contract for ApiManagement endpoints. */
export interface AdminekycApiConnectionResponse {
  ApiConnId: number | null;
  ApiConnName: string | null;
  ApiConnKey: string | null;
  ApiConnPort: string | null;
  ApiConnUrl: string | null;
  ApiConnUser: string | null;
  ApiConnPass: string | null;
  ApiCredential: string | null;
}

export interface AdminekycCreateApiConnectionRequest {
  ApiConnName: string | null;
  ApiConnKey: string | null;
  ApiConnPort: string | null;
  ApiConnUrl: string | null;
  ApiConnUser: string | null;
  ApiConnPass: string | null;
  ApiCredential: string | null;
}

export interface AdminekycUpdateApiConnectionRequest
  extends AdminekycCreateApiConnectionRequest {
  ApiConnId: number;
}
