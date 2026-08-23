import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycChannelResponse,
  AdminekycChannelSummaryResponse,
  AdminekycUpdateChannelRequest
} from '../models/adminekyc-channel.model';
import {
  AdminChannel,
  AdminChannelSummary,
  ChannelManagementForm
} from '../models/channel-management.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class ChannelManagementService {
  constructor(private api: AdminekycApi) {}

  getChannels(): Observable<AdminChannelSummary[]> {
    return this.api
      .getApi<AdminekycChannelSummaryResponse[]>(
        ADMINEKYC_API_ENDPOINTS.channel.index
      )
      .pipe(
        map((channels) =>
          (channels ?? []).map((channel) => ({
            id: Number(channel.ChannelId),
            channelName: this.toText(channel.ChannelName)
          }))
        )
      );
  }

  getChannelDetails(channelId: number): Observable<AdminChannel> {
    return this.api
      .getApi<AdminekycChannelResponse>(
        ADMINEKYC_API_ENDPOINTS.channel.details,
        { id: channelId }
      )
      .pipe(map((response) => this.mapChannel(channelId, response)));
  }

  updateChannel(formValue: ChannelManagementForm): Observable<string> {
    const payload = this.toUpdateRequest(formValue);

    return this.api
      .postApiResponse<void, AdminekycUpdateChannelRequest>(
        ADMINEKYC_API_ENDPOINTS.channel.edit,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'Channel updated successfully.'
        )
      );
  }

  private mapChannel(
    channelId: number,
    response: AdminekycChannelResponse
  ): AdminChannel {
    return {
      id: channelId,
      channelName: this.toText(response.ChannelName),
      channelDescription: this.toText(response.ChannelDesc),
      workflowId: this.toFormNumber(response.WorkflowId),
      emailConnectionId: this.toFormNumber(response.EmailConnId),
      smsApiConnectionId: this.toFormNumber(response.ApiConnIdSms),
      sdnApiConnectionId: this.toFormNumber(response.ApiConnIdSdn),
      cbsApiConnectionId: this.toFormNumber(response.ApiConnIdCbs),
      verifIdApiConnectionId: this.toFormNumber(response.ApiConnIdVfApi),
      verifIdmlApiConnectionId: this.toFormNumber(response.ApiConnIdVfMl),
      verifIdrpaApiConnectionId: this.toFormNumber(response.ApiConnIdVfRpa),
      bizTimeControl: this.toFormNumber(response.BizTimeControl),
      bizStartTime: this.toText(response.BizStartTime),
      bizEndTime: this.toText(response.BizEndTime),
      alienNetAccess: this.toFormNumber(response.AlienNetAccess)
    };
  }

  private toUpdateRequest(
    formValue: ChannelManagementForm
  ): AdminekycUpdateChannelRequest {
    const workflowId = this.toRequiredInteger(
      formValue.workflowId,
      'Workflow ID'
    );

    return {
      ChannelName: formValue.channelName.trim(),
      ChannelDesc: this.toNullableText(formValue.channelDescription),
      WorkflowId: workflowId,
      EmailConnId: this.toNullableInteger(formValue.emailConnectionId),
      ApiConnIdSms: this.toNullableInteger(formValue.smsApiConnectionId),
      ApiConnIdSdn: this.toNullableInteger(formValue.sdnApiConnectionId),
      ApiConnIdCbs: this.toNullableInteger(formValue.cbsApiConnectionId),
      ApiConnIdVfApi: this.toNullableInteger(formValue.verifIdApiConnectionId),
      ApiConnIdVfMl: this.toNullableInteger(formValue.verifIdmlApiConnectionId),
      ApiConnIdVfRpa: this.toNullableInteger(formValue.verifIdrpaApiConnectionId),
      BizTimeControl: this.toOptionalByte(
        formValue.bizTimeControl,
        'BIZ Time Control'
      ),
      BizStartTime: this.toNullableText(formValue.bizStartTime),
      BizEndTime: this.toNullableText(formValue.bizEndTime),
      AlienNetAccess: this.toOptionalByte(
        formValue.alienNetAccess,
        'Alien Net Access'
      )
    };
  }

  private toRequiredInteger(
    value: string | number | null | undefined,
    label: string
  ): number {
    const normalized = this.normalizeFormValue(value);

    if (!normalized) {
      throw new Error(`${label} is required.`);
    }

    const parsed = Number(normalized);
    if (!Number.isInteger(parsed)) {
      throw new Error(`${label} must be an integer.`);
    }

    return parsed;
  }

  private toNullableInteger(
    value: string | number | null | undefined
  ): number | null {
    const normalized = this.normalizeFormValue(value);
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    if (!Number.isInteger(parsed)) {
      throw new Error('Connection IDs must be integers.');
    }

    return parsed;
  }

  private toOptionalByte(
    value: string | number | null | undefined,
    label: string
  ): number | null {
    const normalized = this.normalizeFormValue(value);
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
      throw new Error(`${label} must be an integer between 0 and 255.`);
    }

    return parsed;
  }

  private normalizeFormValue(
    value: string | number | null | undefined
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private toFormNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private toNullableText(value: string): string | null {
    const normalized = value.trim();
    return normalized || null;
  }

  private toText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}
