import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import {
  AdminekycCreateWorkflowRequest,
  AdminekycSwapWorkflowSequenceRequest,
  AdminekycWorkflowSequenceResponse,
  AdminekycWorkflowSummaryResponse
} from '../models/adminekyc-workflow.model';
import {
  WorkflowCreateForm,
  WorkflowFormValue,
  WorkflowManagementStep,
  WorkflowManagementWorkflow
} from '../models/workflow-management.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class WorkflowManagementService {
  constructor(private api: AdminekycApi) {}

  getWorkflows(): Observable<WorkflowManagementWorkflow[]> {
    return this.api
      .getApi<AdminekycWorkflowSummaryResponse[]>(
        ADMINEKYC_API_ENDPOINTS.workflow.index
      )
      .pipe(
        map((workflows) =>
          (workflows ?? [])
            .map((workflow) => ({
              id: this.toPositiveInteger(workflow.WorkflowId),
              workflowName: this.toText(workflow.WorkflowName)
            }))
            .filter((workflow) => workflow.id > 0)
        )
      );
  }

  getStepsByWorkflow(workflowId: number): Observable<WorkflowManagementStep[]> {
    this.requirePositiveInteger(workflowId, 'Workflow');

    return this.api
      .getApi<AdminekycWorkflowSequenceResponse[]>(
        ADMINEKYC_API_ENDPOINTS.workflow.sequences,
        { id: workflowId }
      )
      .pipe(
        map((steps) =>
          (steps ?? [])
            .map((step) => this.mapStep(step))
            .filter((step) => step.id > 0)
            .sort((a, b) => a.stepSequenceNo - b.stepSequenceNo)
        )
      );
  }

  /**
   * Spring uses GET /Create as the permission-aware create-view endpoint.
   * It currently returns an empty CreateWorkflow object, but calling it keeps
   * the Angular flow aligned with the backend ADD permission contract.
   */
  getCreateForm(): Observable<WorkflowCreateForm> {
    return this.api
      .getApi<AdminekycCreateWorkflowRequest>(
        ADMINEKYC_API_ENDPOINTS.workflow.createView
      )
      .pipe(
        map((response) => ({
          workflowName: this.toText(response?.WorkflowName),
          workflowDescription: this.toText(response?.WorkflowDesc),
          accountOpeningFlag: this.toFormNumber(response?.AccOpnFlag),
          accountAuthenticationSteps: this.toFormNumber(response?.AccAuthStep)
        }))
      );
  }

  createWorkflow(formValue: WorkflowCreateForm): Observable<string> {
    const payload = this.toCreateRequest(formValue);

    return this.api
      .postApiResponse<void, AdminekycCreateWorkflowRequest>(
        ADMINEKYC_API_ENDPOINTS.workflow.create,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'Workflow created successfully.'
        )
      );
  }

  swapStepSequence(
    currentStep: WorkflowManagementStep,
    adjacentStep: WorkflowManagementStep
  ): Observable<string> {
    const currentSequenceId = this.requirePositiveInteger(
      currentStep.id,
      'Current workflow sequence'
    );
    const adjacentSequenceId = this.requirePositiveInteger(
      adjacentStep.id,
      'Adjacent workflow sequence'
    );

    if (currentSequenceId === adjacentSequenceId) {
      throw new Error('Workflow sequence is invalid.');
    }

    const payload: AdminekycSwapWorkflowSequenceRequest = {
      current_wf_sq_id: currentSequenceId,
      next_wf_sq_id: adjacentSequenceId
    };

    return this.api
      .postApiResponse<void, AdminekycSwapWorkflowSequenceRequest>(
        ADMINEKYC_API_ENDPOINTS.workflow.swapStepSequence,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'Workflow step order updated.'
        )
      );
  }

  private mapStep(
    response: AdminekycWorkflowSequenceResponse
  ): WorkflowManagementStep {
    return {
      id: this.toPositiveInteger(response.wf_seq_id),
      stepId: this.toPositiveInteger(response.StepId),
      stepSequenceNo: this.toPositiveInteger(response.StepSeqNo),
      stepName: this.toText(response.StepName)
    };
  }

  private toCreateRequest(
    formValue: WorkflowCreateForm
  ): AdminekycCreateWorkflowRequest {
    const workflowName = this.requireText(
      formValue.workflowName,
      'Workflow Name',
      2000
    );

    return {
      WorkflowName: workflowName,
      WorkflowDesc: this.toNullableText(
        formValue.workflowDescription,
        'Workflow Description',
        2000
      ),
      AccOpnFlag: this.toOptionalByte(
        formValue.accountOpeningFlag,
        'Account Opening Flag'
      ),
      AccAuthStep: this.toOptionalByte(
        formValue.accountAuthenticationSteps,
        'Account Authentication Steps'
      )
    };
  }

  private requireText(
    value: WorkflowFormValue,
    label: string,
    maxLength: number
  ): string {
    const normalized = this.normalizeFormValue(value);

    if (!normalized) {
      throw new Error(`${label} is required.`);
    }

    if (normalized.length > maxLength) {
      throw new Error(`${label} must be at most ${maxLength} characters.`);
    }

    return normalized;
  }

  private toNullableText(
    value: WorkflowFormValue,
    label: string,
    maxLength: number
  ): string | null {
    const normalized = this.normalizeFormValue(value);

    if (!normalized) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new Error(`${label} must be at most ${maxLength} characters.`);
    }

    return normalized;
  }

  private toOptionalByte(
    value: WorkflowFormValue,
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

  private requirePositiveInteger(value: number, label: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${label} is invalid.`);
    }

    return value;
  }

  private toPositiveInteger(value: number | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }

  private toFormNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private normalizeFormValue(value: WorkflowFormValue): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private toText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}
