import { Injectable, signal } from '@angular/core';

export type AdminPage =
  | 'login'
  | 'dashboard'
  | 'channelManagement'
  | 'productManagement'
  | 'workflowManagement'
  | 'parameters'
  | 'apiManagement'
  | 'authorizedCustomers'
  | 'unauthorizedCustomers'
  | 'incompleteCustomers'
  | 'declinedCustomers'
  | 'customerDetails'
  | 'ecVerification'
  | 'userActivityLog'
  | 'kycReportByYear'
  | 'kycReportDetails';

export type CustomerListType =
  | 'authorized'
  | 'unauthorized'
  | 'incomplete'
  | 'declined';

export type CustomerListPageConfig = {
  type: CustomerListType;
  title: string;
  subtitle: string;
  emptyMessage: string;
};

@Injectable({
  providedIn: 'root'
})
export class AdminekycState {
  readonly currentPage = signal<AdminPage>('login');

  readonly drawerOpened = signal<boolean>(true);
  readonly userModalOpened = signal<boolean>(false);

  readonly selectedCustomerId = signal<number | null>(null);
  readonly selectedKycCustomerId = signal<number | null>(null);
  

  goToLogin(): void {
    this.currentPage.set('login');
    this.closeUserModal();
  }

  goToDashboard(): void {
    this.currentPage.set('dashboard');
    this.closeUserModal();
  }

  goToChannelManagement(): void {
  this.currentPage.set('channelManagement');
}

goToProductManagement(): void {
  this.currentPage.set('productManagement');
}

goToWorkflowManagement(): void {
  this.currentPage.set('workflowManagement');
}

goToParameters(): void {
  this.currentPage.set('parameters');
}

goToApiManagement(): void {
  this.currentPage.set('apiManagement');
}

  goToAuthorizedCustomers(): void {
    this.currentPage.set('authorizedCustomers');
  }

  goToUnauthorizedCustomers(): void {
    this.currentPage.set('unauthorizedCustomers');
  }

  goToIncompleteCustomers(): void {
    this.currentPage.set('incompleteCustomers');
  }

  goToDeclinedCustomers(): void {
    this.currentPage.set('declinedCustomers');
  }

  goToCustomerDetails(customerId: number): void {
    this.selectedCustomerId.set(customerId);
    this.currentPage.set('customerDetails');
  }

  goToEcVerification(): void {
    this.currentPage.set('ecVerification');
  }

  goToUserActivityLog(): void {
  this.currentPage.set('userActivityLog');
}

goToKycReportByYear(): void {
  this.currentPage.set('kycReportByYear');
}
goToKycReportDetails(customerId: number): void {
  this.selectedKycCustomerId.set(customerId);
  this.currentPage.set('kycReportDetails');
}

  toggleDrawer(): void {
    this.drawerOpened.update((opened) => !opened);
  }

  openDrawer(): void {
    this.drawerOpened.set(true);
  }

  closeDrawer(): void {
    this.drawerOpened.set(false);
  }

  openUserModal(): void {
    this.userModalOpened.set(true);
  }

  closeUserModal(): void {
    this.userModalOpened.set(false);
  }

  customerListPageConfig(): CustomerListPageConfig {
    const page = this.currentPage();

    if (page === 'authorizedCustomers') {
      return {
        type: 'authorized',
        title: 'Authorized Customers',
        subtitle: 'Customers whose verification checks are successfully completed.',
        emptyMessage: 'No authorized customer found.'
      };
    }

    if (page === 'unauthorizedCustomers') {
      return {
        type: 'unauthorized',
        title: 'Unauthorized Customers',
        subtitle: 'Customers requiring admin review or manual authorization.',
        emptyMessage: 'No unauthorized customer found.'
      };
    }

    if (page === 'declinedCustomers') {
      return {
        type: 'declined',
        title: 'Declined Customers',
        subtitle: 'Customers declined by admin.',
        emptyMessage: 'No declined customer found.'
      };
    }

    return {
      type: 'incomplete',
      title: 'Incomplete Customers',
      subtitle: 'Customers whose onboarding application is not fully completed.',
      emptyMessage: 'No incomplete customer found.'
    };
  }
}