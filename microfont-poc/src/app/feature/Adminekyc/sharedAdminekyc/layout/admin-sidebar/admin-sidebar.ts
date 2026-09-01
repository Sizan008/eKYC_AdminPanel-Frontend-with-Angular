import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges, input, output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Subscription } from 'rxjs';

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
  imports: [MatIcon],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss'
})
export class AdminSidebar implements OnInit, OnChanges, OnDestroy {
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

    this.openParentMenuForActiveMenu();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeMenu']) {
      this.openParentMenuForActiveMenu();
    }
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
    this.channelManagementClicked.emit();
  }

  onProductManagementClicked(): void {
    this.productManagementClicked.emit();
  }

  onWorkflowManagementClicked(): void {
    this.workflowManagementClicked.emit();
  }

  onParametersClicked(): void {
    this.parametersClicked.emit();
  }

  onApiManagementClicked(): void {
    this.apiManagementClicked.emit();
  }

  onAuthorizedClicked(): void {
    this.authorizedClicked.emit();
  }

  onUnauthorizedClicked(): void {
    this.unauthorizedClicked.emit();
  }

  onIncompleteClicked(): void {
    this.incompleteClicked.emit();
  }

  onDeclinedClicked(): void {
    this.declinedClicked.emit();
  }

  onEcVerificationClicked(): void {
    this.closeAllParentMenus();
    this.ecVerificationClicked.emit();
  }

  onUserActivityLogClicked(): void {
    this.userActivityLogClicked.emit();
  }

  onKycReportByYearClicked(): void {
    this.kycReportByYearClicked.emit();
  }


  toggleParentMenu(controlName: SidebarParentControl): void {
    const control = this.sidebarForm.controls[controlName];
    control.setValue(!control.value);
  }

  private openParentMenuForActiveMenu(): void {
    const menu = this.activeMenu();

    if (menu === 'channelManagement' || menu === 'productManagement' || menu === 'workflowManagement') {
      this.openOnlyParentMenu('productChannelOpened');
      return;
    }

    if (menu === 'parameters' || menu === 'apiManagement') {
      this.openOnlyParentMenu('configurationsOpened');
      return;
    }

    if (menu === 'authorized' || menu === 'unauthorized' || menu === 'incomplete' || menu === 'declined') {
      this.openOnlyParentMenu('authorizationQueueOpened');
      return;
    }

    if (menu === 'userActivityLog' || menu === 'kycReportByYear') {
      this.openOnlyParentMenu('logsOpened');
      return;
    }

    this.closeAllParentMenus();
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