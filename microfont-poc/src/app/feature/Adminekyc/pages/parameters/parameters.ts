import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import { AdminParameter, ParameterFormValue } from '../../core/models/parameters.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { ParametersService } from '../../core/services/parameters.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { GenericDataGrid } from '../../../../shared/common-components/generic-component-type/generic-data-grid';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';

type ParameterPageMode = 'list' | 'create' | 'edit';

type ParameterFormGroup = {
  parameterName: FormControl<string>;
  parameterValue: FormControl<string>;
  parameterDescription: FormControl<string>;
  privacyLevel: FormControl<string>;
};

@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    GenericDataGrid,
    InputTextBox,
    GenericModal
  ],
  templateUrl: './parameters.html',
  styleUrl: './parameters.scss'
})
export class Parameters implements OnInit {
  readonly parameters = signal<AdminParameter[]>([]);
  readonly selectedParameter = signal<AdminParameter | null>(null);

  readonly pageMode = signal<ParameterPageMode>('list');
  readonly isLoading = signal<boolean>(false);
  readonly isOpeningForm = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>('');

  readonly successModalOpened = signal<boolean>(false);
  readonly successMessage = signal<string>('Saved successfully.');

  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = 12;

  readonly parameterGridColumns = [
    'parameterName',
    'parameterValue',
    'parameterDescription'
  ];
  readonly parameterGridColumnNames = {
    parameterName: 'Parameter Name',
    parameterValue: 'Parameter Value',
    parameterDescription: 'Parameter Description'
  };

  readonly parameterForm = new FormGroup<ParameterFormGroup>({
    parameterName: new FormControl('', { nonNullable: true }),
    parameterValue: new FormControl('', { nonNullable: true }),
    parameterDescription: new FormControl('', { nonNullable: true }),
    privacyLevel: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private parametersService: ParametersService
  ) {}

  ngOnInit(): void {
    this.loadParameters();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadParameters(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.pageErrorMessage.set('');

    this.parametersService.getParameters().subscribe({
      next: (parameters) => {
        this.parameters.set(parameters);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load parameters.')
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
    this.selectedParameter.set(null);

    this.parametersService.getCreateForm().subscribe({
      next: (defaults) => {
        this.patchForm(defaults);
        this.parameterForm.controls.parameterName.enable();
        this.pageMode.set('create');
        this.isOpeningForm.set(false);
      },
      error: (error: unknown) => {
        this.isOpeningForm.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to open parameter create form.')
        );
      }
    });
  }

  showEditFromGrid(payload: string): void {
    try {
      this.showEdit(JSON.parse(payload) as AdminParameter);
    } catch {
      this.pageErrorMessage.set('Unable to read the selected parameter.');
    }
  }

  showEdit(parameter: AdminParameter): void {
    if (this.isOpeningForm()) {
      return;
    }

    this.isOpeningForm.set(true);
    this.pageErrorMessage.set('');

    // Index returns ParamValue truncated to 30 characters. Fetch Edit/{name}
    // so the form always receives the complete stored parameter value.
    try {
      this.parametersService.getParameter(parameter.id).subscribe({
        next: (details) => {
          this.selectedParameter.set(details);
          this.patchForm(details);
          this.parameterForm.controls.parameterName.disable();
          this.pageMode.set('edit');
          this.isOpeningForm.set(false);
        },
        error: (error: unknown) => {
          this.isOpeningForm.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to load parameter details.')
          );
        }
      });
    } catch (error: unknown) {
      this.isOpeningForm.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to load parameter details.')
      );
    }
  }

  backToList(): void {
    this.pageMode.set('list');
    this.selectedParameter.set(null);
    this.parameterForm.controls.parameterName.enable();
    this.pageErrorMessage.set('');
  }

  saveParameter(): void {
    const selected = this.selectedParameter();
    if (!selected || this.isSaving()) {
      return;
    }

    const formValue = this.parameterForm.getRawValue() as ParameterFormValue;
    this.pageErrorMessage.set('');
    this.isSaving.set(true);

    try {
      this.parametersService.updateParameter(selected.id, formValue).subscribe({
        next: (message) => {
          this.isSaving.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.pageMode.set('list');
          this.selectedParameter.set(null);
          this.parameterForm.controls.parameterName.enable();
          this.loadParameters();
        },
        error: (error: unknown) => {
          this.isSaving.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to save parameter.')
          );
        }
      });
    } catch (error: unknown) {
      this.isSaving.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to save parameter.')
      );
    }
  }

  createParameter(): void {
    if (this.isSaving()) {
      return;
    }

    const formValue = this.parameterForm.getRawValue() as ParameterFormValue;
    this.pageErrorMessage.set('');
    this.isSaving.set(true);

    try {
      this.parametersService.createParameter(formValue).subscribe({
        next: (message) => {
          this.isSaving.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.pageMode.set('list');
          this.loadParameters();
        },
        error: (error: unknown) => {
          this.isSaving.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to create parameter.')
          );
        }
      });
    } catch (error: unknown) {
      this.isSaving.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to create parameter.')
      );
    }
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.parameters().length / this.itemsPerPage));
  }

  getPaginatedParameters(): AdminParameter[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    return this.parameters().slice(startIndex, endIndex);
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

  private patchForm(value: ParameterFormValue | AdminParameter): void {
    this.parameterForm.reset({
      parameterName: value.parameterName ?? '',
      parameterValue: value.parameterValue ?? '',
      parameterDescription: value.parameterDescription ?? '',
      privacyLevel: value.privacyLevel ?? ''
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
