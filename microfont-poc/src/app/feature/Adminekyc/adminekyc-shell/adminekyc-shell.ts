import { Component, computed, inject, OnInit } from '@angular/core';

import { AdminekycAuth } from '../core/services/adminekyc-auth';
import { AdminekycState } from '../core/services/adminekyc-state';

import { Login } from '../pages/login/login';
import { Dashboard } from '../pages/dashboard/dashboard';
import { CustomerList } from '../pages/customer-list/customer-list';
import { CustomerDetails } from '../pages/customer-details/customer-details';
import { EcVerification } from '../pages/ec-verification/ec-verification';
import { ChannelManagement } from '../pages/channel-management/channel-management';
import { ProductManagement } from '../pages/product-management/product-management';
import { WorkflowManagement } from '../pages/workflow-management/workflow-management';
import { Parameters } from '../pages/parameters/parameters';
import { ApiManagement } from '../pages/api-management/api-management';
import { UserActivityLogPage } from '../pages/user-activity-log/user-activity-log';
import { KycReportByYear } from '../pages/kyc-report-by-year/kyc-report-by-year';
import { KycReportDetails } from '../pages/kyc-report-details/kyc-report-details';
@Component({
  selector: 'app-adminekyc-shell',
  standalone: true,
  imports: [
    Login,
    Dashboard,
    CustomerList,
    CustomerDetails,
    EcVerification,
    ChannelManagement,
    ProductManagement,
    WorkflowManagement,
    Parameters,
    ApiManagement,
    UserActivityLogPage,
    KycReportByYear,
    KycReportDetails
  ],
  templateUrl: './adminekyc-shell.html',
  styleUrl: './adminekyc-shell.scss'
})
export class AdminekycShell implements OnInit {
  readonly auth = inject(AdminekycAuth);
  readonly state = inject(AdminekycState);

  readonly currentPage = computed(() => this.state.currentPage());

  ngOnInit(): void {
    this.auth.restoreSession().subscribe((admin) => {
      if (admin) {
        this.state.goToDashboard();
        return;
      }

      this.state.goToLogin();
    });
  }

  onLoginSuccess(): void {
    this.state.goToDashboard();
  }
}