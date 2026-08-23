import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  WorkflowCreateForm,
  WorkflowManagementStep,
  WorkflowManagementWorkflow
} from '../../core/models/workflow-management.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { WorkflowManagementService } from '../../core/services/workflow-management.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { InputNumber } from '../../../../shared/common-components/input-types/input-number/input-number';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';

type WorkflowPageMode = 'list' | 'create';

type WorkflowCreateFormGroup = {
  workflowName: FormControl<string>;
  workflowDescription: FormControl<string>;
  accountOpeningFlag: FormControl<string>;
  accountAuthenticationSteps: FormControl<string>;
};

@Component({
  selector: 'app-workflow-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    InputTextBox,
    InputNumber,
    GenericModal
  ],
  templateUrl: './workflow-management.html',
  styleUrl: './workflow-management.scss'
})
export class WorkflowManagement implements OnInit {
  readonly workflows = signal<WorkflowManagementWorkflow[]>([]);
  readonly steps = signal<WorkflowManagementStep[]>([]);

  readonly selectedWorkflowId = signal<number | null>(null);
  readonly pageMode = signal<WorkflowPageMode>('list');

  readonly isLoadingWorkflows = signal<boolean>(false);
  readonly isLoadingSteps = signal<boolean>(false);
  readonly isLoadingCreateForm = signal<boolean>(false);
  readonly isCreating = signal<boolean>(false);
  readonly reorderingSequenceId = signal<number | null>(null);
  readonly pageErrorMessage = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = 8;

  readonly successModalOpened = signal<boolean>(false);
  readonly successMessage = signal<string>('Workflow created successfully.');

  readonly createForm = new FormGroup<WorkflowCreateFormGroup>({
    workflowName: new FormControl('', { nonNullable: true }),
    workflowDescription: new FormControl('', { nonNullable: true }),
    accountOpeningFlag: new FormControl('', { nonNullable: true }),
    accountAuthenticationSteps: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private workflowService: WorkflowManagementService
  ) {}

  ngOnInit(): void {
    this.loadWorkflows();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadWorkflows(): void {
    if (this.isLoadingWorkflows()) {
      return;
    }

    this.isLoadingWorkflows.set(true);
    this.pageErrorMessage.set('');

    this.workflowService.getWorkflows().subscribe({
      next: (workflows) => {
        this.workflows.set(workflows);
        this.isLoadingWorkflows.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingWorkflows.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load workflows.')
        );
      }
    });
  }

  onWorkflowChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement).value;
    const workflowId = Number(rawValue);

    this.steps.set([]);
    this.currentPage.set(1);
    this.pageErrorMessage.set('');

    if (!rawValue || !Number.isInteger(workflowId) || workflowId <= 0) {
      this.selectedWorkflowId.set(null);
      return;
    }

    this.selectedWorkflowId.set(workflowId);
    this.loadSteps(workflowId);
  }

  loadSteps(workflowId: number): void {
    if (this.isLoadingSteps()) {
      return;
    }

    this.isLoadingSteps.set(true);
    this.pageErrorMessage.set('');

    try {
      this.workflowService.getStepsByWorkflow(workflowId).subscribe({
        next: (steps) => {
          this.steps.set(steps);
          this.currentPage.set(1);
          this.isLoadingSteps.set(false);
        },
        error: (error: unknown) => {
          this.isLoadingSteps.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to load workflow steps.')
          );
        }
      });
    } catch (error: unknown) {
      this.isLoadingSteps.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to load workflow steps.')
      );
    }
  }

  showCreate(): void {
    if (this.isLoadingCreateForm()) {
      return;
    }

    this.pageErrorMessage.set('');
    this.isLoadingCreateForm.set(true);

    this.workflowService.getCreateForm().subscribe({
      next: (defaults) => {
        this.patchCreateForm(defaults);
        this.pageMode.set('create');
        this.isLoadingCreateForm.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingCreateForm.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to open workflow create form.')
        );
      }
    });
  }

  backToList(): void {
    this.pageMode.set('list');
    this.pageErrorMessage.set('');
  }

  createWorkflow(): void {
    if (this.isCreating()) {
      return;
    }

    const formValue = this.createForm.getRawValue() as unknown as WorkflowCreateForm;
    this.pageErrorMessage.set('');
    this.isCreating.set(true);

    try {
      this.workflowService.createWorkflow(formValue).subscribe({
        next: (message) => {
          this.isCreating.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.pageMode.set('list');
          this.selectedWorkflowId.set(null);
          this.steps.set([]);
          this.currentPage.set(1);
          this.loadWorkflows();
        },
        error: (error: unknown) => {
          this.isCreating.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to create workflow.')
          );
        }
      });
    } catch (error: unknown) {
      this.isCreating.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to create workflow.')
      );
    }
  }

  moveStepUp(step: WorkflowManagementStep): void {
    const currentSteps = this.steps();
    const index = currentSteps.findIndex((item) => item.id === step.id);

    if (index <= 0 || this.reorderingSequenceId() !== null) {
      return;
    }

    this.swapSteps(step, currentSteps[index - 1]);
  }

  moveStepDown(step: WorkflowManagementStep): void {
    const currentSteps = this.steps();
    const index = currentSteps.findIndex((item) => item.id === step.id);

    if (
      index < 0 ||
      index >= currentSteps.length - 1 ||
      this.reorderingSequenceId() !== null
    ) {
      return;
    }

    this.swapSteps(step, currentSteps[index + 1]);
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.steps().length / this.itemsPerPage));
  }

  getPaginatedSteps(): WorkflowManagementStep[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    return this.steps().slice(startIndex, endIndex);
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

  private swapSteps(
    currentStep: WorkflowManagementStep,
    adjacentStep: WorkflowManagementStep
  ): void {
    const workflowId = this.selectedWorkflowId();
    if (!workflowId) {
      this.pageErrorMessage.set('Please select a workflow.');
      return;
    }

    this.pageErrorMessage.set('');
    this.reorderingSequenceId.set(currentStep.id);

    try {
      this.workflowService.swapStepSequence(currentStep, adjacentStep).subscribe({
        next: () => {
          this.reorderingSequenceId.set(null);
          this.loadSteps(workflowId);
        },
        error: (error: unknown) => {
          this.reorderingSequenceId.set(null);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to reorder workflow steps.')
          );
        }
      });
    } catch (error: unknown) {
      this.reorderingSequenceId.set(null);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to reorder workflow steps.')
      );
    }
  }

  private patchCreateForm(defaults: WorkflowCreateForm): void {
    this.createForm.reset({
      workflowName: this.toFormString(defaults.workflowName),
      workflowDescription: this.toFormString(defaults.workflowDescription),
      accountOpeningFlag: this.toFormString(defaults.accountOpeningFlag),
      accountAuthenticationSteps: this.toFormString(
        defaults.accountAuthenticationSteps
      )
    });
  }

  private toFormString(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
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
