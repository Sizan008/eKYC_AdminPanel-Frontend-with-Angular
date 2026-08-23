import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  AdminChannel,
  AdminChannelSummary
} from '../../core/models/channel-management.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { ChannelManagementService } from '../../core/services/channel-management.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { InputNumber } from '../../../../shared/common-components/input-types/input-number/input-number';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';

type ChannelFormGroup = {
  channelName: FormControl<string>;
  channelDescription: FormControl<string>;
  workflowId: FormControl<string>;
  emailConnectionId: FormControl<string>;
  smsApiConnectionId: FormControl<string>;
  sdnApiConnectionId: FormControl<string>;
  cbsApiConnectionId: FormControl<string>;
  verifIdApiConnectionId: FormControl<string>;
  verifIdmlApiConnectionId: FormControl<string>;
  verifIdrpaApiConnectionId: FormControl<string>;
  bizTimeControl: FormControl<string>;
  bizStartTime: FormControl<string>;
  bizEndTime: FormControl<string>;
  alienNetAccess: FormControl<string>;
};

@Component({
  selector: 'app-channel-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    InputTextBox,
    InputNumber,
    GenericModal
  ],
  templateUrl: './channel-management.html',
  styleUrl: './channel-management.scss'
})
export class ChannelManagement implements OnInit {
  readonly channels = signal<AdminChannelSummary[]>([]);
  readonly selectedChannelId = signal<number | null>(null);
  readonly isEditMode = signal<boolean>(false);
  readonly isLoadingChannels = signal<boolean>(false);
  readonly isLoadingDetails = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly savedMessage = signal<string>('Channel updated successfully.');
  readonly savedModalOpened = signal<boolean>(false);

  readonly channelForm = new FormGroup<ChannelFormGroup>({
    channelName: new FormControl('', { nonNullable: true }),
    channelDescription: new FormControl('', { nonNullable: true }),
    workflowId: new FormControl('', { nonNullable: true }),
    emailConnectionId: new FormControl('', { nonNullable: true }),
    smsApiConnectionId: new FormControl('', { nonNullable: true }),
    sdnApiConnectionId: new FormControl('', { nonNullable: true }),
    cbsApiConnectionId: new FormControl('', { nonNullable: true }),
    verifIdApiConnectionId: new FormControl('', { nonNullable: true }),
    verifIdmlApiConnectionId: new FormControl('', { nonNullable: true }),
    verifIdrpaApiConnectionId: new FormControl('', { nonNullable: true }),
    bizTimeControl: new FormControl('', { nonNullable: true }),
    bizStartTime: new FormControl('', { nonNullable: true }),
    bizEndTime: new FormControl('', { nonNullable: true }),
    alienNetAccess: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private channelService: ChannelManagementService
  ) {}

  ngOnInit(): void {
    this.disableForm();
    this.loadChannels();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadChannels(): void {
    this.isLoadingChannels.set(true);
    this.errorMessage.set(null);

    this.channelService.getChannels().subscribe({
      next: (channels) => {
        this.channels.set(channels);
        this.isLoadingChannels.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingChannels.set(false);

        if (this.handleExpiredSession(error)) {
          return;
        }

        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load channels.')
        );
      }
    });
  }

  onChannelChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement).value;
    const channelId = Number(rawValue);

    this.errorMessage.set(null);
    this.savedModalOpened.set(false);
    this.isEditMode.set(false);

    if (!rawValue || !Number.isInteger(channelId) || channelId <= 0) {
      this.selectedChannelId.set(null);
      this.clearForm();
      this.disableForm();
      return;
    }

    this.selectedChannelId.set(channelId);
    this.loadChannelDetails(channelId);
  }

  enableEditMode(): void {
    if (
      !this.selectedChannelId() ||
      this.isLoadingDetails() ||
      this.isSaving()
    ) {
      return;
    }

    this.errorMessage.set(null);
    this.isEditMode.set(true);
    this.channelForm.enable();

    // Spring POST /Channel/Edit locates the existing row by ChannelName rather
    // than ChannelId. Keep the original name immutable so edit cannot turn
    // into a failed rename lookup.
    this.channelForm.controls.channelName.disable();
  }

  saveChannel(): void {
    if (!this.selectedChannelId() || !this.isEditMode() || this.isSaving()) {
      return;
    }

    this.errorMessage.set(null);

    const formValue = this.channelForm.getRawValue();
    if (!formValue.channelName.trim()) {
      this.errorMessage.set('Channel Name is required.');
      return;
    }

    this.isSaving.set(true);

    try {
      this.channelService.updateChannel(formValue).subscribe({
        next: (message) => {
          this.isSaving.set(false);
          this.isEditMode.set(false);
          this.disableForm();
          this.savedMessage.set(message);
          this.savedModalOpened.set(true);
        },
        error: (error: unknown) => {
          this.isSaving.set(false);

          if (this.handleExpiredSession(error)) {
            return;
          }

          this.errorMessage.set(
            this.getErrorMessage(error, 'Unable to update channel.')
          );
        }
      });
    } catch (error: unknown) {
      this.isSaving.set(false);
      this.errorMessage.set(
        this.getErrorMessage(error, 'Unable to update channel.')
      );
    }
  }

  closeSavedModal(): void {
    this.savedModalOpened.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  private loadChannelDetails(channelId: number): void {
    this.isLoadingDetails.set(true);
    this.clearForm();
    this.disableForm();

    this.channelService.getChannelDetails(channelId).subscribe({
      next: (channel) => {
        this.patchForm(channel);
        this.disableForm();
        this.isLoadingDetails.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingDetails.set(false);
        this.clearForm();
        this.disableForm();

        if (this.handleExpiredSession(error)) {
          return;
        }

        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load channel details.')
        );
      }
    });
  }

  private patchForm(channel: AdminChannel): void {
    this.channelForm.patchValue({
      channelName: channel.channelName,
      channelDescription: channel.channelDescription,
      workflowId: channel.workflowId,
      emailConnectionId: channel.emailConnectionId,
      smsApiConnectionId: channel.smsApiConnectionId,
      sdnApiConnectionId: channel.sdnApiConnectionId,
      cbsApiConnectionId: channel.cbsApiConnectionId,
      verifIdApiConnectionId: channel.verifIdApiConnectionId,
      verifIdmlApiConnectionId: channel.verifIdmlApiConnectionId,
      verifIdrpaApiConnectionId: channel.verifIdrpaApiConnectionId,
      bizTimeControl: channel.bizTimeControl,
      bizStartTime: channel.bizStartTime,
      bizEndTime: channel.bizEndTime,
      alienNetAccess: channel.alienNetAccess
    });
  }

  private clearForm(): void {
    this.channelForm.reset({
      channelName: '',
      channelDescription: '',
      workflowId: '',
      emailConnectionId: '',
      smsApiConnectionId: '',
      sdnApiConnectionId: '',
      cbsApiConnectionId: '',
      verifIdApiConnectionId: '',
      verifIdmlApiConnectionId: '',
      verifIdrpaApiConnectionId: '',
      bizTimeControl: '',
      bizStartTime: '',
      bizEndTime: '',
      alienNetAccess: ''
    });
  }

  private disableForm(): void {
    this.channelForm.disable();
  }

  private handleExpiredSession(error: unknown): boolean {
    if (
      error instanceof AdminekycApiError &&
      error.status === 'UNAUTH' &&
      error.apiMessage?.trim().toLowerCase() === 'valid session required.'
    ) {
      this.state.closeUserModal();
      this.state.goToLogin();
      return true;
    }

    return false;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AdminekycApiError) {
      return error.apiMessage?.trim() || error.message || fallback;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
