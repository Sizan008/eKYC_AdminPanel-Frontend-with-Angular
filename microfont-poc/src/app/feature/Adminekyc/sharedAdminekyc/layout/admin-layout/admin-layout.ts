import { Component, input, output } from '@angular/core';
import { AdminSidebar, AdminSidebarActiveMenu } from '../admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../admin-topbar/admin-topbar';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [
    AdminSidebar,
    AdminTopbar
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {
  readonly title = input<string>('Digital Onboarding');
  readonly username = input<string>('Digital Onboarding Admin');
  readonly activeMenu = input<AdminSidebarActiveMenu>('dashboard');
  readonly drawerOpened = input<boolean>(true);

  readonly menuClicked = output<void>();
  readonly userClicked = output<void>();
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

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onUserClick(): void {
    this.userClicked.emit();
  }

  onDashboardClick(): void {
    this.dashboardClicked.emit();
  }
  onChannelManagementClick(): void {
  this.channelManagementClicked.emit();
}

onProductManagementClick(): void {
  this.productManagementClicked.emit();
}

onWorkflowManagementClick(): void {
  this.workflowManagementClicked.emit();
}

onParametersClick(): void {
  this.parametersClicked.emit();
}

onApiManagementClick(): void {
  this.apiManagementClicked.emit();
}

  onAuthorizedClick(): void {
    this.authorizedClicked.emit();
  }

  onUnauthorizedClick(): void {
    this.unauthorizedClicked.emit();
  }

  onIncompleteClick(): void {
    this.incompleteClicked.emit();
  }
  onEcVerificationClick(): void {
  this.ecVerificationClicked.emit();
}
onDeclinedClick(): void {
  this.declinedClicked.emit();
}
onUserActivityLogClick(): void {
  this.userActivityLogClicked.emit();
}

onKycReportByYearClick(): void {
  this.kycReportByYearClicked.emit();
}
}