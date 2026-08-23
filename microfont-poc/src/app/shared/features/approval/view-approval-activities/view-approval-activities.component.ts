import {Component, signal, OnInit, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import { ApprovalService } from '../../../services/approval-service';

// Raw JSON structure from your approval service
interface RawApproval {
  queueId: number;
  setId: number;
  approveLevel: number;
  approverNo: number;
  approveFlag: string;
  userId: string;
  remarks: string | null;
  actionTime: string | null;
}

interface ApproverDetail {
  queueId: number;
  performedBy: string;
  role: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'CREATED';
  performedTime: Date | null;
  comment: string | null;
}

interface ApprovalStep {
  stepOrder: number;
  stepName: string;
  minReqSupervisor: number;
  historyList: ApproverDetail[];
}

@Component({
  selector: 'app-view-approval-activities',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltip
  ],
  templateUrl: './view-approval-activities.component.html',
})
export class ViewApprovalActivitiesComponent implements OnInit{
  /** Data coming from modalComponentData */
  @Input() modalComponentData: any;
  /**  Provided automatically by <generic-modal> for closing / emitting results */
  modalParent?: { close: (result?: any) => void };

  selectedStepId = signal<number | null>(null);
  steps: ApprovalStep[] = [];
  isLoadingHistory = false;
  historyError: string | null = null;

  constructor(
    private approvalService: ApprovalService
  ) {}

  ngOnInit(): void {
    console.log('data in view : ', this.modalComponentData);

    if (this.modalComponentData?.setId) {
      this.loadApprovalHistory(this.modalComponentData.setId);
    } else {
      this.historyError = 'No Set ID provided to load approval activities.';
    }
  }


  private loadApprovalHistory(setId: number): void {
    console.log("?????SETID????????", setId);
    this.isLoadingHistory = true;
    this.historyError = null;
    this.steps = [];
    this.selectedStepId.set(null);

    this.approvalService.getApprovalQueue(setId).subscribe({
      next: (response: RawApproval[]) => {
        const payload = Array.isArray(response) ? response : [];
        console.log("PAYLOAD IN APPROVAL ACTIVITY", payload);
        this.steps = this.transformToSteps(payload);
        const activeStep = this.steps.find(s =>
          ['PENDING', 'CREATED'].includes(this.getStepStatus(s.historyList))
        );
        if (activeStep) {
          this.selectedStepId.set(activeStep.stepOrder);
        }
      },
      error: (err) => {
        console.error('Failed to load approval activities', err);
        this.historyError = 'Unable to load approval history.';
      },
      complete: () => {
        this.isLoadingHistory = false;
      }
    });
  }

  // --- Transform JSON → Step model ---
  private transformToSteps(json: RawApproval[]): ApprovalStep[] {
    const grouped = json.reduce((acc: Record<number, RawApproval[]>, item: RawApproval) => {
      (acc[item.approveLevel] ||= []).push(item);
      return acc;
    }, {});

    return Object.keys(grouped)
      .map(levelStr => Number(levelStr))
      .sort((a, b) => a - b)
      .map(level => {
        const approvers = grouped[level];
        return {
          stepOrder: level,
          stepName: this.getStepName(level),
          minReqSupervisor: Math.max(...approvers.map((a: RawApproval) => a.approverNo ?? 1)),
          historyList: approvers.map((a: RawApproval) => ({
            queueId: a.queueId,
            performedBy: a.userId,
            role: this.getRoleName(a.userId),
            status: this.mapFlag(a.approveFlag),
            performedTime: a.actionTime ? new Date(a.actionTime) : null,
            comment: a.remarks
          }))
        };
      });
  }

  // --- Helper methods ---
  getStepStatus(approvers: ApproverDetail[]): 'APPROVED' | 'REJECTED' | 'PENDING' | 'CREATED' {
    const approved = approvers.filter(a => a.status === 'APPROVED').length;
    const rejected = approvers.filter(a => a.status === 'REJECTED').length;
    const pending = approvers.filter(a => a.status === 'PENDING').length;

    if (rejected > 0) return 'REJECTED';
    if (pending > 0) return 'PENDING';

    // @ts-ignore
    const parent = this.steps.find(s => s.historyList === approvers);
    if (approved >= (parent?.minReqSupervisor ?? 1)) return 'APPROVED';

    return 'CREATED';
  }

  getApprovedCount(list: ApproverDetail[]): number {
    return list.filter(a => a.status === 'APPROVED').length;
  }

  getStepName(level: number): string {
    return {
      1: 'Manager Review',
      2: 'General Manager Approval',
      3: 'CEO Approval'
    }[level] || `Level ${level}`;
  }

  getRoleName(userId: string): string {
    // @ts-ignore
    if (userId.includes('manager')) return 'Manager';
    // @ts-ignore
    if (userId.includes('gm')) return 'General Manager';
    // @ts-ignore
    if (userId.includes('ceo')) return 'CEO';
    return 'Approver';
  }

  mapFlag(flag: string): 'APPROVED' | 'REJECTED' | 'PENDING' | 'CREATED' {
    switch (flag) {
      case 'APPROVED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      case 'PENDING': return 'PENDING';
      default: return 'CREATED';
    }
  }

  toggleStep(id: number) {
    this.selectedStepId.update(cur => (cur === id ? null : id));
  }

  //Step Summay Dashboard
  approvedStepsCount() {
    return this.steps.filter(s => this.getStepStatus(s.historyList) === 'APPROVED').length;
  }

  pendingStepsCount() {
    return this.steps.filter(s => this.getStepStatus(s.historyList) === 'PENDING').length;
  }

  createdStepsCount() {
    return this.steps.filter(s => this.getStepStatus(s.historyList) === 'CREATED').length;
  }

  totalApprovalsCount() {
    return this.steps.reduce((sum, s) => sum + this.getApprovedCount(s.historyList), 0);
  }

  totalApproversCount() {
    return this.steps.reduce((sum, s) => sum + s.historyList.length, 0);
  }

  close() {
    this.modalParent?.close();
  }

}
