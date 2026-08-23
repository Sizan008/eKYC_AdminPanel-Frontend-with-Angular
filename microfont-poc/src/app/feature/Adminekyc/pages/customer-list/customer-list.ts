import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdminCustomer } from '../../core/models/admin-customer.model';
import { AdminekycCustomerSearchQuery } from '../../core/models/adminekyc-customer-list.model';
import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycCustomer } from '../../core/services/adminekyc-customer';
import { AdminekycState, CustomerListType } from '../../core/services/adminekyc-state';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { AdminCustomerSummaryCard } from '../../sharedAdminekyc/components/admin-customer-summary-card/admin-customer-summary-card';
import {
  AdminCustomerSearchForm,
  AdminFilterPanel
} from '../../sharedAdminekyc/components/admin-filter-panel/admin-filter-panel';

const EMPTY_SEARCH_FORM: AdminCustomerSearchForm = {
  branchId: '',
  mobileNumber: '',
  trackingNumber: '',
  nidNumber: '',
  customerId: '',
  fromDate: '',
  toDate: '',
  customersPerPage: '',
  accountFrom: '',
  accountTo: ''
};

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    AdminLayout,
    GenericButton,
    AdminFilterPanel,
    AdminCustomerSummaryCard
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss'
})
export class CustomerList implements OnInit {
  private readonly customerService = inject(AdminekycCustomer);

  readonly auth = inject(AdminekycAuth);
  readonly state = inject(AdminekycState);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly customers = signal<AdminCustomer[]>([]);
  readonly searchForm = signal<AdminCustomerSearchForm>({ ...EMPTY_SEARCH_FORM });
  readonly searchActive = signal<boolean>(false);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(8);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);

  readonly pageConfig = computed(() => this.state.customerListPageConfig());
  readonly pageTitle = computed(() => `Total ${this.pageConfig().title} Found`);

  readonly canGoPrevious = computed(() => this.currentPage() > 1 && !this.isLoading());
  readonly canGoNext = computed(() =>
    this.totalPages() > 0 &&
    this.currentPage() < this.totalPages() &&
    !this.isLoading()
  );

  ngOnInit(): void {
    this.loadCustomers(1);
  }

  loadCustomers(pageNumber = 1): void {
    if (this.isLoading()) {
      return;
    }

    const normalizedPage = Math.max(1, Math.floor(pageNumber));
    const type = this.pageConfig().type;
    const request$ = this.searchActive()
      ? this.customerService.searchCustomerPage(
          type,
          this.toSearchQuery(this.searchForm()),
          normalizedPage
        )
      : this.customerService.getCustomerPage(type, normalizedPage);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    request$.subscribe({
      next: (page) => {
        this.customers.set(page.customers);
        this.currentPage.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.totalCount.set(page.totalCount);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.customers.set([]);
        this.totalCount.set(0);
        this.totalPages.set(0);
        this.isLoading.set(false);

        if (this.isSessionExpired(error)) {
          this.state.closeUserModal();
          this.state.goToLogin();
          return;
        }

        this.errorMessage.set(
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load customers.'
        );
      }
    });
  }

  updateSearchForm(form: AdminCustomerSearchForm): void {
    this.searchForm.set(form);
  }

  resetSearch(): void {
    this.searchForm.set({ ...EMPTY_SEARCH_FORM });
    this.searchActive.set(false);
    this.loadCustomers(1);
  }

  searchCustomers(): void {
    this.searchActive.set(this.hasSearchCriteria(this.searchForm()));
    this.loadCustomers(1);
  }

  goToPreviousPage(): void {
    if (this.canGoPrevious()) {
      this.loadCustomers(this.currentPage() - 1);
    }
  }

  goToNextPage(): void {
    if (this.canGoNext()) {
      this.loadCustomers(this.currentPage() + 1);
    }
  }

  goToList(type: CustomerListType): void {
    if (type === 'authorized') {
      this.state.goToAuthorizedCustomers();
      return;
    }

    if (type === 'unauthorized') {
      this.state.goToUnauthorizedCustomers();
      return;
    }

    if (type === 'declined') {
      this.state.goToDeclinedCustomers();
      return;
    }

    this.state.goToIncompleteCustomers();
  }

  backToDashboard(): void {
    this.state.goToDashboard();
  }

  viewDetails(customer: AdminCustomer): void {
    this.state.goToCustomerDetails(customer.id);
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Digital Onboarding Admin';
  }

  getActiveMenu(): 'authorized' | 'unauthorized' | 'incomplete' | 'declined' {
    return this.pageConfig().type;
  }

  private toSearchQuery(form: AdminCustomerSearchForm): AdminekycCustomerSearchQuery {
    return {
      branchId: form.branchId,
      mobileNumber: form.mobileNumber,
      trackingNumber: form.trackingNumber,
      nidNumber: form.nidNumber,
      customerId: form.customerId,
      fromDate: form.fromDate,
      toDate: form.toDate,
      accountFrom: form.accountFrom,
      accountTo: form.accountTo
    };
  }

  private hasSearchCriteria(form: AdminCustomerSearchForm): boolean {
    return [
      form.branchId,
      form.mobileNumber,
      form.trackingNumber,
      form.nidNumber,
      form.customerId,
      form.fromDate,
      form.toDate,
      form.accountFrom,
      form.accountTo
    ].some((value) => Boolean(value?.trim()));
  }

  private isSessionExpired(error: unknown): boolean {
    return error instanceof AdminekycApiError &&
      error.status === 'UNAUTH' &&
      error.apiMessage?.trim().toLowerCase() === 'valid session required.';
  }
}
