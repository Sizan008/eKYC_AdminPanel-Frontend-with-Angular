export interface BaseEntity {
  id: number;
  uuid: string;
  authStatusId: string;
  makeBy: string;
  makeDate: string;
  authBy?: string;
  authDate?: string;
  lastAction: string;
  branchId?: string;
  isDeleted: boolean;
}

export interface SwiftAuthorizationLog extends BaseEntity {
  messageType: string;
  messageId: number;
  msgRefNo: string;
  mtId: number;
  requestBody?: string;
  contentOfMsg?: string;
  remarks?: string;
}

export interface AuthorizationRequest {
  messageId: number;
  remarks?: string;
}

export interface ProcessAuthorizationRequest {
  logId: number;
  action: 'AUTHORIZE' | 'DECLINE';
  authBy: string;
  branchId: string;
  remarks: string;
}

export interface GetUnauthorizedMessagesRequest {
  messageType: string;
  authBy: string;
  branchId: string;
}

export interface AuthorizationResponse {
  success: boolean;
  message: string;
  data?: any;
} 