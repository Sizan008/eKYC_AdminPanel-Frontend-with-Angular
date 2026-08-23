export type WorkflowFormValue = string | number | null | undefined;

export interface WorkflowManagementWorkflow {
  id: number;
  workflowName: string;
}

export interface WorkflowManagementStep {
  /** PARAM_WF_SEQUENCES.WF_SEQ_ID; this is the ID required by SwapStepSequence. */
  id: number;
  stepId: number;
  stepSequenceNo: number;
  stepName: string;
}

export interface WorkflowCreateForm {
  workflowName: WorkflowFormValue;
  workflowDescription: WorkflowFormValue;
  accountOpeningFlag: WorkflowFormValue;
  accountAuthenticationSteps: WorkflowFormValue;
}
