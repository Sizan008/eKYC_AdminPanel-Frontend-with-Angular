import { Component, OnDestroy, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { GenericSwitch } from '../../../../../shared/common-components/generic-component-type/generic-switch/generic-switch';

export type AdminSidebarActiveMenu =
  | 'dashboard'
  | 'channelManagement'
  | 'productManagement'
  | 'workflowManagement'
  | 'parameters'
  | 'apiManagement'
  | 'authorized'
  | 'unauthorized'
  | 'incomplete'
  | 'declined'
  | 'ecVerification'
  | 'userActivityLog'
  | 'kycReportByYear';

type SidebarParentControl =
  | 'productChannelOpened'
  | 'configurationsOpened'
  | 'authorizationQueueOpened'
  | 'logsOpened';

@Component({
  selector: 'admin-sidebar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GenericSwitch
  ],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss'
})
export class AdminSidebar implements OnInit, OnDestroy {
  readonly activeMenu = input<AdminSidebarActiveMenu>('dashboard');
  readonly drawerOpened = input<boolean>(true);

  readonly sidebarForm = new FormGroup({
    productChannelOpened: new FormControl(false, { nonNullable: true }),
    configurationsOpened: new FormControl(false, { nonNullable: true }),
    authorizationQueueOpened: new FormControl(false, { nonNullable: true }),
    logsOpened: new FormControl(false, { nonNullable: true })
  });

  readonly dashboardClicked = output<void>();
  readonly channelManagementClicked = output<void>();
  readonly productManagementClicked = output<void>();
  readonly workflowManagementClicked = output<void>();
  readonly parametersClicked = output<void>();
  readonly apiManagementClicked = output<void>();
  readonly authorizedClicked = output<void>();
  readonly unauthorizedClicked = output<void>();
  readonly incompleteClicked = output<void>();
  readonly declinedClicked = output<void>();
  readonly ecVerificationClicked = output<void>();
  readonly userActivityLogClicked = output<void>();
  readonly kycReportByYearClicked = output<void>();

  private readonly subscriptions = new Subscription();
  private syncingParentMenu = false;

  ngOnInit(): void {
    this.subscriptions.add(
      this.sidebarForm.controls.productChannelOpened.valueChanges.subscribe((opened) => {
        if (opened) {
          this.openOnlyParentMenu('productChannelOpened');
        }
      })
    );

    this.subscriptions.add(
      this.sidebarForm.controls.configurationsOpened.valueChanges.subscribe((opened) => {
        if (opened) {
          this.openOnlyParentMenu('configurationsOpened');
        }
      })
    );

    this.subscriptions.add(
      this.sidebarForm.controls.authorizationQueueOpened.valueChanges.subscribe((opened) => {
        if (opened) {
          this.openOnlyParentMenu('authorizationQueueOpened');
        }
      })
    );

    this.subscriptions.add(
      this.sidebarForm.controls.logsOpened.valueChanges.subscribe((opened) => {
        if (opened) {
          this.openOnlyParentMenu('logsOpened');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  isProductChannelOpened(): boolean {
    return this.sidebarForm.controls.productChannelOpened.value;
  }

  isConfigurationsOpened(): boolean {
    return this.sidebarForm.controls.configurationsOpened.value;
  }

  isAuthorizationQueueOpened(): boolean {
    return this.sidebarForm.controls.authorizationQueueOpened.value;
  }

  isLogsOpened(): boolean {
    return this.sidebarForm.controls.logsOpened.value;
  }

  onDashboardClicked(): void {
    this.closeAllParentMenus();
    this.dashboardClicked.emit();
  }

  onChannelManagementClicked(): void {
    this.closeAllParentMenus();
    this.channelManagementClicked.emit();
  }

  onProductManagementClicked(): void {
    this.closeAllParentMenus();
    this.productManagementClicked.emit();
  }

  onWorkflowManagementClicked(): void {
    this.closeAllParentMenus();
    this.workflowManagementClicked.emit();
  }

  onParametersClicked(): void {
    this.closeAllParentMenus();
    this.parametersClicked.emit();
  }

  onApiManagementClicked(): void {
    this.closeAllParentMenus();
    this.apiManagementClicked.emit();
  }

  onAuthorizedClicked(): void {
    this.closeAllParentMenus();
    this.authorizedClicked.emit();
  }

  onUnauthorizedClicked(): void {
    this.closeAllParentMenus();
    this.unauthorizedClicked.emit();
  }

  onIncompleteClicked(): void {
    this.closeAllParentMenus();
    this.incompleteClicked.emit();
  }

  onDeclinedClicked(): void {
    this.closeAllParentMenus();
    this.declinedClicked.emit();
  }

  onEcVerificationClicked(): void {
    this.closeAllParentMenus();
    this.ecVerificationClicked.emit();
  }

  onUserActivityLogClicked(): void {
    this.closeAllParentMenus();
    this.userActivityLogClicked.emit();
  }

  onKycReportByYearClicked(): void {
    this.closeAllParentMenus();
    this.kycReportByYearClicked.emit();
  }

  private openOnlyParentMenu(openedControl: SidebarParentControl): void {
    if (this.syncingParentMenu) {
      return;
    }

    this.syncingParentMenu = true;

    this.sidebarForm.patchValue(
      {
        productChannelOpened: openedControl === 'productChannelOpened',
        configurationsOpened: openedControl === 'configurationsOpened',
        authorizationQueueOpened: openedControl === 'authorizationQueueOpened',
        logsOpened: openedControl === 'logsOpened'
      },
      { emitEvent: false }
    );

    this.syncingParentMenu = false;
  }

  private closeAllParentMenus(): void {
    if (this.syncingParentMenu) {
      return;
    }

    this.syncingParentMenu = true;

    this.sidebarForm.patchValue(
      {
        productChannelOpened: false,
        configurationsOpened: false,
        authorizationQueueOpened: false,
        logsOpened: false
      },
      { emitEvent: false }
    );

    this.syncingParentMenu = false;
  }
}