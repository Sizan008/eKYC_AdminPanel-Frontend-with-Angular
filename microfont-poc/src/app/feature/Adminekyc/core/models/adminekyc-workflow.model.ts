/** Exact Result item returned by GET /api/Workflow/Index. */
export interface AdminekycWorkflowSummaryResponse {
  WorkflowId: number | null;
  WorkflowName: string | null;
}

/** Exact Result item returned by GET /api/Workflow/WorkflowSequences. */
export interface AdminekycWorkflowSequenceResponse {
  wf_seq_id: number | null;
  StepSeqNo: number | null;
  StepId: number | null;
  StepName: string | null;
}

/** Exact JSON contract used by GET/POST /api/Workflow/Create. */
export interface AdminekycCreateWorkflowRequest {
  WorkflowName: string | null;
  WorkflowDesc: string | null;
  AccOpnFlag: number | null;
  AccAuthStep: number | null;
}

/** Exact JSON contract used by POST /api/Workflow/SwapStepSequence. */
export interface AdminekycSwapWorkflowSequenceRequest {
  current_wf_sq_id: number;
  next_wf_sq_id: number;
}
