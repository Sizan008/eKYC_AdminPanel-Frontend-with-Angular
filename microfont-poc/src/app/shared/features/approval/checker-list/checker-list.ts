import {Component, OnInit, signal, WritableSignal, inject, Type} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import {ViewApprovalActivitiesComponent} from '../view-approval-activities/view-approval-activities.component';
import { ApprovalService } from '../../../services/approval-service';
import { ExpansionPanelHeader } from '../../../common-components/expansion-panel-header/expansion-panel-header';
import { GenericDataGrid } from '../../../common-components/generic-component-type/generic-data-grid';
import { GenericModal } from '../../../common-components/generic-component-type/generic-modal/generic-modal';
import { UserService } from '../../../../core/user/user.service';
import { User } from '../../../../core/user/user.types';



@Component({
  selector: 'app-checker-list',
  standalone: true,
  imports: [CommonModule, GenericDataGrid, ExpansionPanelHeader, GenericModal],
  templateUrl: './checker-list.html',
  styleUrl: './checker-list.scss'
})
export class CheckerList implements OnInit {
  router = inject(Router);
  dialog = inject(MatDialog);
  approvalService = inject(ApprovalService);
  private userService = inject(UserService);
  userId : string;
  // Modal controls
  isModalVisible: boolean = false;
  modalTitle: string = '';
  modalComponent: any = null;
  modalComponentData: any = null;

  businessHeaderPanel: WritableSignal<boolean> = signal(true);

  selectedColumns = ['setId', 'functionName', 'actionType', 'remarks', 'recordUserId', 'currentUxContent'];
  dataSource: any[] = [];


  ngOnInit(): void {
    this.userService.user$.subscribe((user: User) => {
      this.userId = user?.username;
      if (this.userId) {
        this.loadPending();
      }
    });
  }

   loadPending(): void {
    if (!this.userId) {
      return;
    }
    this.approvalService.getUnApprovedList(this.userId).subscribe({
      next: (response: any) => {

        this.dataSource = response
          .sort((a: any, b: any) => b.setId - a.setId)   // sort by setId DESC
          .map((item: any) => ({
            ...item,
            currentContext: this.parseJson(item.currentUxContent),
            previousContext: this.parseJson(item.previousUxContent),
          }));

      }
    });
  }

  view(row: any): void {
    const parsedRow = typeof row === 'string' ? this.parseJson(row) : row;
    if (!parsedRow || typeof parsedRow !== 'object') {
      console.error('Invalid row data for approval movement', row);
      return;
    }
    console.log(' parsed row ', parsedRow);
    this.router.navigateByUrl('poc/approval-movement', {state: {data: parsedRow}});
  }
  // showApprovalSteps(row: any): void {
  //   this.modalTitle = 'Approval Activities';
  //   this.modalComponent = ViewApprovalActivitiesComponent;
  //   this.modalComponentData = row;
  //   this.modalSize = 'lg';
  //   this.modalMaxHeight = '85%';
  //   this.modalMaxWidth = '85%';
  //   this.isModalVisible = true;
  // }

  handleProgressClick(rowDataString: string): void {
    try {

      const rowData = JSON.parse(rowDataString);
      console.log("RAWDATA", rowData);
      // Pass the component and data to openModal
      this.openModal(
        ViewApprovalActivitiesComponent,
        rowData,
        'Approval Activities'
      );
    } catch (e) {
      console.error('Failed to parse row data for modal:', e);
    }
  }

  openModal(componentToLoad: Type<any>, data: any, title: string = 'Modal') {
    this.isModalVisible = false;
    this.modalComponent = undefined;

    setTimeout(() => {
      this.modalTitle = title;
      this.modalComponent = componentToLoad;
      this.modalComponentData = data;
      this.isModalVisible = true;
    }, 50);
  }

  onModalVisibilityChange(visible: boolean): void {
    this.isModalVisible = visible;
  }

  onModalResult(result: any): void {
    //console.log('Modal Result:', result);
  }


  private parseJson(jsonStr: string): any {
    try {
      return JSON.parse(jsonStr || '{}');
    } catch {
      return {};
    }
  }

}
