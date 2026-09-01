import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  AdminApiManagement,
  ApiManagementFormValue
} from '../../core/models/api-management.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { ApiManagementService } from '../../core/services/api-management.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { GenericDataGrid } from '../../../../shared/common-components/generic-component-type/generic-data-grid';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';

type ApiManagementPageMode = 'list' | 'create' | 'edit';

type ApiManagementFormGroup = {
  name: FormControl<string>;
  key: FormControl<string>;
  port: FormControl<string>;
  url: FormControl<string>;
  user: FormControl<string>;
  password: FormControl<string>;
  credential: FormControl<string>;
};

@Component({
  selector: 'app-api-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    GenericDataGrid,
    InputTextBox,
    GenericModal
  ],
  templateUrl: './api-management.html',
  styleUrl: './api-management.scss'
})
export class ApiManagement implements OnInit {
  readonly apiItems = signal<AdminApiManagement[]>([]);
  readonly selectedApi = signal<AdminApiManagement | null>(null);

  readonly pageMode = signal<ApiManagementPageMode>('list');
  readonly isLoading = signal<boolean>(false);
  readonly isOpeningForm = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>('');

  readonly successModalOpened = signal<boolean>(false);
  readonly successMessage = signal<string>('Saved successfully.');

  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = 10;

  readonly apiGridColumns = [
    'name',
    'key',
    'port',
    'url',
    'user',
    'password',
    'credential'
  ];
  readonly apiGridColumnNames = {
    name: 'Name',
    key: 'Key',
    port: 'Port',
    url: 'URL',
    user: 'User',
    password: 'Password',
    credential: 'Credential'
  };

  readonly apiForm = new FormGroup<ApiManagementFormGroup>({
    name: new FormControl('', { nonNullable: true }),
    key: new FormControl('', { nonNullable: true }),
    port: new FormControl('', { nonNullable: true }),
    url: new FormControl('', { nonNullable: true }),
    user: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    credential: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private apiManagementService: ApiManagementService
  ) {}

  ngOnInit(): void {
    this.loadApiManagements();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadApiManagements(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.pageErrorMessage.set('');

    this.apiManagementService.getApiManagements().subscribe({
      next: (apiItems) => {
        this.apiItems.set(apiItems);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load API connections.')
        );
      }
    });
  }

  showCreate(): void {
    if (this.isOpeningForm()) {
      return;
    }

    this.isOpeningForm.set(true);
    this.pageErrorMessage.set('');
    this.selectedApi.set(null);

    this.apiManagementService.getCreateForm().subscribe({
      next: (defaults) => {
        this.patchForm(defaults);
        this.apiForm.controls.name.enable();
        this.pageMode.set('create');
        this.isOpeningForm.set(false);
      },
      error: (error: unknown) => {
        this.isOpeningForm.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to open API create form.')
        );
      }
    });
  }

  showEditFromGrid(payload: string): void {
    try {
      this.showEdit(JSON.parse(payload) as AdminApiManagement);
    } catch {
      this.pageErrorMessage.set('Unable to read the selected API configuration.');
    }
  }

  showEdit(apiItem: AdminApiManagement): void {
    if (this.isOpeningForm()) {
      return;
    }

    this.isOpeningForm.set(true);
    this.pageErrorMessage.set('');

    try {
      this.apiManagementService.getApiManagement(apiItem.id).subscribe({
        next: (details) => {
          this.selectedApi.set(details);
          this.patchForm(details);

          // Spring/.NET update by ApiConnId, so the connection name is editable.
          this.apiForm.controls.name.enable();
          this.pageMode.set('edit');
          this.isOpeningForm.set(false);
        },
        error: (error: unknown) => {
          this.isOpeningForm.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to load API connection details.')
          );
        }
      });
    } catch (error: unknown) {
      this.isOpeningForm.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to load API connection details.')
      );
    }
  }

  backToList(): void {
    this.pageMode.set('list');
    this.selectedApi.set(null);
    this.apiForm.controls.name.enable();
    this.pageErrorMessage.set('');
  }

  saveApiManagement(): void {
    const selected = this.selectedApi();
    if (!selected || this.isSaving()) {
      return;
    }

    const formValue = this.apiForm.getRawValue() as ApiManagementFormValue;
    this.pageErrorMessage.set('');
    this.isSaving.set(true);

    try {
      this.apiManagementService.updateApiManagement(selected.id, formValue).subscribe({
        next: (message) => {
          this.isSaving.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.pageMode.set('list');
          this.selectedApi.set(null);
          this.loadApiManagements();
        },
        error: (error: unknown) => {
          this.isSaving.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to save API connection.')
          );
        }
      });
    } catch (error: unknown) {
      this.isSaving.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to save API connection.')
      );
    }
  }

  createApiManagement(): void {
    if (this.isSaving()) {
      return;
    }

    const formValue = this.apiForm.getRawValue() as ApiManagementFormValue;
    if (!formValue.name.trim()) {
      this.pageErrorMessage.set('Name is required.');
      return;
    }

    this.pageErrorMessage.set('');
    this.isSaving.set(true);

    try {
      this.apiManagementService.createApiManagement(formValue).subscribe({
        next: (message) => {
          this.isSaving.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.pageMode.set('list');
          this.loadApiManagements();
        },
        error: (error: unknown) => {
          this.isSaving.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to create API connection.')
          );
        }
      });
    } catch (error: unknown) {
      this.isSaving.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to create API connection.')
      );
    }
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.apiItems().length / this.itemsPerPage));
  }

  getPaginatedApiItems(): AdminApiManagement[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    return this.apiItems().slice(startIndex, endIndex);
  }

  goToNextPage(): void {
    if (this.currentPage() < this.getTotalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  closeSuccessModal(): void {
    this.successModalOpened.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  private patchForm(value: ApiManagementFormValue | AdminApiManagement): void {
    this.apiForm.reset({
      name: value.name ?? '',
      key: value.key ?? '',
      port: value.port ?? '',
      url: value.url ?? '',
      user: value.user ?? '',
      password: value.password ?? '',
      credential: value.credential ?? ''
    });
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
