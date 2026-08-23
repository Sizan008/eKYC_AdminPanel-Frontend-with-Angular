/** Exact JSON item returned by GET /api/Channel/Index. */
export interface AdminekycChannelSummaryResponse {
  ChannelId: number;
  ChannelName: string;
}

/** Exact Result payload returned by GET /api/Channel/Details?id=... */
export interface AdminekycChannelResponse {
  ChannelName: string;
  ChannelDesc: string | null;
  WorkflowId: number | null;
  EmailConnId: number | null;
  ApiConnIdSms: number | null;
  ApiConnIdSdn: number | null;
  ApiConnIdCbs: number | null;
  ApiConnIdVfApi: number | null;
  ApiConnIdVfMl: number | null;
  ApiConnIdVfRpa: number | null;
  BizTimeControl: number | null;
  BizStartTime: string | null;
  BizEndTime: string | null;
  AlienNetAccess: number | null;
}

/** Exact @JsonProperty contract accepted by POST /api/Channel/Edit. */
export interface AdminekycUpdateChannelRequest {
  ChannelName: string;
  ChannelDesc: string | null;
  WorkflowId: number;
  EmailConnId: number | null;
  ApiConnIdSms: number | null;
  ApiConnIdSdn: number | null;
  ApiConnIdCbs: number | null;
  ApiConnIdVfApi: number | null;
  ApiConnIdVfMl: number | null;
  ApiConnIdVfRpa: number | null;
  BizTimeControl: number | null;
  BizStartTime: string | null;
  BizEndTime: string | null;
  AlienNetAccess: number | null;
}
