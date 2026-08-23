import { ApiResponse } from "../services/data-selection.service";

// Backend DTO Interface
export interface SwiftMessageRequest {
    branchId: string;
    msgType: number;
    msgRefNo: string | null;
    msgFromDate: string;
    msgToDate: string;

    orgnBrId: string | null;
  }

  export interface SwiftIDTransactionQueueRequest {
    branchId: string;
    orgnBrId: string;
    adviceNo?: string;
    ibtCode?: string;
    orgnDateFrom: string;
    orgnDateTo: string;
}

  // CBS Data Interface - Updated to match backend response
  export interface CBSData {
    msgType: string;
    msgRefNo: string;
    makeBy: string;
    makeDate: string;
    issueDate: string;
    auth1stBy: string;
    auth1stDate: string;
    // Optional fields for compatibility
    amount?: any;
    currency?: string;
    branchId?: string;
    originalData?: any;
  }

  // PACS Incoming Messages Interface - For PACS008/009 data display
  export interface PacsIncomingTableData {
    id: string;
    txId?: string;
    uetr?: string;
    msgId: string;
    endToEndId: string;

    // Branch and routing info
    branchId: string;
    fromBicfi: string;
    toBicfi: string;
    instdAgtBic: string;
    instgAgtBic: string;

    // Amount and currency info
    intrbkSttlmAmt: string;
    intrbkSttlmAmtCcy: string;
    valAmt32a?: string;
    valCurr32a?: string;
    valDate32a?: string;

    // Payment info
    sttlmMtd: string;
    rmtInf: string;
    trnRefNo20: string;

    // Priority and status
    priority: string;
    lastAction: string;

    // Dates
    makeDt: string;
    auth1stBy: string;
    auth1stDt: string;

    // Store original data for processing
    originalData: any;
  }


export interface SwiftMessage {
  msgRefNo: string;
  mtId: string;
  senderBic: string;
  makeBy: string;
  makeDt: string;
}

// Complete response type
export type IncomingMessageApiResponse = ApiResponse<IncomingMessageListResponse>;

export interface IncomingMessageResponse {
  id: number;
  uuid: string;
  filename: string;
  extension: string;
  content: string;
  authStatusId: string;
  makeBy: string;
  makeDate: string;                // ISO date string
  authBy?: string;
  authDate?: string;               // ISO date string
  lastAction: string;
  branchId: string;
  isDeleted?: boolean;
  messageNo?: string;
  messageType?: string;
  senderBic?: string;
  receiverBic?: string;
  amount?:number;
  currency?:string; 
}

// Simplified response structure - only what you need
export interface IncomingMessageListResponse {
  content: IncomingMessageResponse[];  // The actual data
  totalElements: number;               // Total count for pagination
  empty: boolean;                      // Is the result empty
}


// Complete response type
export type OutgoingMessageApiResponse = ApiResponse<OutgoingMessageListResponse>;

export interface OutgoingMessageResponse {
  id: number;
  uuid: string;
  filename: string;
  extension: string;
  content: string;
  authStatusId: string;
  makeBy: string;
  makeDt: string;                // ISO date string
  authBy?: string;
  authDate?: string;               // ISO date string
  lastAction: string;
  branchId: string;
  isDeleted?: boolean;
  messageNo?: string;
  msgRefNo?: string;
  endToEndId?: string;
  mtId?: string;
  senderBic?: string;
  messageType?: string;
}

// Simplified response structure - only what you need
export interface OutgoingMessageListResponse {
  content: OutgoingMessageResponse[];  // The actual data
  totalElements: number;               // Total count for pagination
  empty: boolean;                      // Is the result empty
}
