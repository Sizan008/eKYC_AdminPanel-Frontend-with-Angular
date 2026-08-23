export interface AdminChannelSummary {
  id: number;
  channelName: string;
}

export interface AdminChannel {
  id: number;
  channelName: string;
  channelDescription: string;
  workflowId: string;
  emailConnectionId: string;
  smsApiConnectionId: string;
  sdnApiConnectionId: string;
  cbsApiConnectionId: string;
  verifIdApiConnectionId: string;
  verifIdmlApiConnectionId: string;
  verifIdrpaApiConnectionId: string;
  bizTimeControl: string;
  bizStartTime: string;
  bizEndTime: string;
  alienNetAccess: string;
}

export interface ChannelManagementForm {
  channelName: string;
  channelDescription: string;
  workflowId: string;
  emailConnectionId: string;
  smsApiConnectionId: string;
  sdnApiConnectionId: string;
  cbsApiConnectionId: string;
  verifIdApiConnectionId: string;
  verifIdmlApiConnectionId: string;
  verifIdrpaApiConnectionId: string;
  bizTimeControl: string;
  bizStartTime: string;
  bizEndTime: string;
  alienNetAccess: string;
}
