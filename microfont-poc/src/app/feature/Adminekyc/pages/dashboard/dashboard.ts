import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycDashboard } from '../../core/services/adminekyc-dashboard';
import { AdminekycState } from '../../core/services/adminekyc-state';
import {
  AdminekycDashboardSummary,
  EMPTY_ADMINEKYC_DASHBOARD_SUMMARY
} from '../../core/models/adminekyc-dashboard.model';
import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';

import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { CommonDonutChart, DonutAllRangesPartial } from '../../../../shared/common-components/charts/common-donut-chart/common-donut-chart';
import { AdminSummaryCard } from '../../sharedAdminekyc/components/admin-summary-card/admin-summary-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    GenericButton,
    CommonDonutChart,
    AdminLayout,
    AdminSummaryCard
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(AdminekycDashboard);

  readonly auth = inject(AdminekycAuth);
  readonly state = inject(AdminekycState);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly summary = signal<AdminekycDashboardSummary>({
    ...EMPTY_ADMINEKYC_DASHBOARD_SUMMARY
  });

  readonly chartTotal = computed<number>(() => this.summary().total);

  readonly chartSeriesTotal = computed<number>(() => {
    const currentSummary = this.summary();
    return currentSummary.authorized +
      currentSummary.unauthorized +
      currentSummary.incomplete;
  });

  /**
   * Do not mount ApexCharts with an all-zero donut. The dashboard summary is
   * loaded asynchronously, and an Apex donut created with [0, 0, 0] can keep
   * its empty SVG paths even after the shared wrapper receives the real series.
   * Creating the shared chart only after data arrives gives Apex its real series
   * on the first render without changing the shared microfont component.
   */
  readonly chartReady = computed<boolean>(() =>
    !this.isLoading() && this.chartSeriesTotal() > 0
  );

  readonly chartDataByRange = computed<DonutAllRangesPartial>(() => {
    const currentSummary = this.summary();
    const rangePack = {
      labels: ['Authorized Customers', 'Unauthorized Customers', 'Incomplete Customers'],
      series: [
        currentSummary.authorized,
        currentSummary.unauthorized,
        currentSummary.incomplete
      ]
    };

    return {
      weekly: rangePack,
      monthly: rangePack,
      yearly: rangePack
    };
  });

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load dashboard data.'
        );
      }
    });
  }

  goToAuthorizedCustomers(): void {
    this.state.goToAuthorizedCustomers();
  }

  goToUnauthorizedCustomers(): void {
    this.state.goToUnauthorizedCustomers();
  }

  goToIncompleteCustomers(): void {
    this.state.goToIncompleteCustomers();
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Digital Onboarding Admin';
  }

  private isSessionExpired(error: unknown): boolean {
    return error instanceof AdminekycApiError &&
      error.status === 'UNAUTH' &&
      error.apiMessage?.trim().toLowerCase() === 'valid session required.';
  }
}
