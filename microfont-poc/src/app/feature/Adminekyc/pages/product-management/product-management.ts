import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';
import {
  AdminProductManagementProduct,
  ProductAssignForm,
  ProductCreateForm,
  ProductManagementAvailableProduct,
  ProductManagementChannel,
  ProductManagementChannelProduct
} from '../../core/models/product-management.model';
import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { ProductManagementService } from '../../core/services/product-management.service';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { InputNumber } from '../../../../shared/common-components/input-types/input-number/input-number';
import { InputSelectOptionField } from '../../../../shared/common-components/input-types/input-select-option-field/input-select-option-field';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';

type ProductPageMode = 'home' | 'list' | 'create' | 'assign';

type ProductCreateFormGroup = {
  productId: FormControl<string>;
  productType: FormControl<string>;
  serviceTypeId: FormControl<string>;
  productName: FormControl<string>;
  productDescription: FormControl<string>;
  amountMax: FormControl<string>;
  amountMin: FormControl<string>;
  gender: FormControl<string>;
  profession: FormControl<string>;
  ageMax: FormControl<string>;
  ageMin: FormControl<string>;
};

type ProductAssignFormGroup = {
  availableProduct: FormControl<string>;
};

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    InputTextBox,
    InputNumber,
    InputSelectOptionField,
    GenericModal
  ],
  templateUrl: './product-management.html',
  styleUrl: './product-management.scss'
})
export class ProductManagement implements OnInit {
  readonly channels = signal<ProductManagementChannel[]>([]);
  readonly channelProducts = signal<ProductManagementChannelProduct[]>([]);
  readonly products = signal<AdminProductManagementProduct[]>([]);
  readonly availableProducts = signal<ProductManagementAvailableProduct[]>([]);

  readonly selectedChannelId = signal<number | null>(null);
  readonly selectedChannelName = signal<string>('');
  readonly pageMode = signal<ProductPageMode>('home');

  readonly isLoadingChannels = signal<boolean>(false);
  readonly isLoadingChannelProducts = signal<boolean>(false);
  readonly isLoadingProducts = signal<boolean>(false);
  readonly isLoadingAvailableProducts = signal<boolean>(false);
  readonly isLoadingCreateDefaults = signal<boolean>(false);
  readonly isCreating = signal<boolean>(false);
  readonly isAssigning = signal<boolean>(false);

  readonly successModalOpened = signal<boolean>(false);
  readonly successMessage = signal<string>('Saved successfully.');
  readonly pageErrorMessage = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = 8;

  // Spring/legacy product type codes are 00001/00002/00003. The label is only
  // display text; the form value sent to the backend must remain the code.
  readonly productTypeOptions = [
    { key: '00001', value: 'Demand' },
    { key: '00002', value: 'Scheme' },
    { key: '00003', value: 'Time' }
  ];

  readonly createForm = new FormGroup<ProductCreateFormGroup>({
    productId: new FormControl('', { nonNullable: true }),
    productType: new FormControl('00001', { nonNullable: true }),
    serviceTypeId: new FormControl('', { nonNullable: true }),
    productName: new FormControl('', { nonNullable: true }),
    productDescription: new FormControl('', { nonNullable: true }),
    amountMax: new FormControl('0', { nonNullable: true }),
    amountMin: new FormControl('0', { nonNullable: true }),
    gender: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    ageMax: new FormControl('0', { nonNullable: true }),
    ageMin: new FormControl('0', { nonNullable: true })
  });

  readonly assignForm = new FormGroup<ProductAssignFormGroup>({
    availableProduct: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private productService: ProductManagementService
  ) {}

  ngOnInit(): void {
    this.loadProductChannels();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  loadProductChannels(): void {
    this.isLoadingChannels.set(true);
    this.pageErrorMessage.set('');

    this.productService.getProductChannels().subscribe({
      next: (channels) => {
        this.channels.set(channels);
        this.isLoadingChannels.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingChannels.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load product channels.')
        );
      }
    });
  }

  onChannelChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement).value;
    const channelId = Number(rawValue);

    this.pageErrorMessage.set('');
    this.successModalOpened.set(false);
    this.currentPage.set(1);
    this.channelProducts.set([]);
    this.availableProducts.set([]);

    if (!rawValue || !Number.isInteger(channelId) || channelId <= 0) {
      this.selectedChannelId.set(null);
      this.selectedChannelName.set('');
      this.pageMode.set('home');
      return;
    }

    this.selectedChannelId.set(channelId);
    this.selectedChannelName.set(
      this.channels().find((channel) => channel.id === channelId)?.channelName || ''
    );
    this.pageMode.set('home');
    this.loadChannelProducts(channelId);
  }

  showHome(): void {
    this.pageMode.set('home');
    this.pageErrorMessage.set('');
    this.currentPage.set(1);
  }

  showList(): void {
    this.pageMode.set('list');
    this.pageErrorMessage.set('');
    this.currentPage.set(1);
    this.loadAllProducts();
  }

  showCreate(): void {
    if (this.isLoadingCreateDefaults()) {
      return;
    }

    this.pageMode.set('create');
    this.pageErrorMessage.set('');
    this.resetCreateForm();
    this.isLoadingCreateDefaults.set(true);

    this.productService.getCreateDefaults().subscribe({
      next: (defaults) => {
        this.patchCreateForm(defaults);
        this.isLoadingCreateDefaults.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingCreateDefaults.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load product create form.')
        );
      }
    });
  }

  showAssign(): void {
    const channelId = this.selectedChannelId();
    this.pageErrorMessage.set('');

    if (!channelId) {
      this.pageErrorMessage.set('Please select a channel before assigning product.');
      this.pageMode.set('home');
      return;
    }

    this.assignForm.reset({ availableProduct: '' });
    this.availableProducts.set([]);
    this.pageMode.set('assign');
    this.isLoadingAvailableProducts.set(true);

    this.productService.getAvailableProducts(channelId).subscribe({
      next: (response) => {
        this.availableProducts.set(response.products);
        if (response.channelName) {
          this.selectedChannelName.set(response.channelName);
        }
        this.isLoadingAvailableProducts.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingAvailableProducts.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load available products.')
        );
      }
    });
  }

  createProduct(): void {
    if (this.isCreating() || this.isLoadingCreateDefaults()) {
      return;
    }

    this.pageErrorMessage.set('');
    const formValue = this.createForm.getRawValue() as ProductCreateForm;
    this.isCreating.set(true);

    try {
      this.productService.createProduct(formValue).subscribe({
        next: (message) => {
          this.isCreating.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.showList();
        },
        error: (error: unknown) => {
          this.isCreating.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to create product.')
          );
        }
      });
    } catch (error: unknown) {
      this.isCreating.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to create product.')
      );
    }
  }

  assignProduct(): void {
    if (this.isAssigning() || this.isLoadingAvailableProducts()) {
      return;
    }

    const channelId = this.selectedChannelId();
    const formValue = this.assignForm.getRawValue() as ProductAssignForm;
    const productCode = Number(formValue.availableProduct);

    if (!channelId) {
      this.pageErrorMessage.set('Please select a channel before assigning product.');
      return;
    }

    if (!Number.isInteger(productCode) || productCode <= 0) {
      this.pageErrorMessage.set('Please select an available product.');
      return;
    }

    this.pageErrorMessage.set('');
    this.isAssigning.set(true);

    try {
      this.productService.assignProductToChannel(channelId, productCode).subscribe({
        next: (message) => {
          this.isAssigning.set(false);
          this.successMessage.set(message);
          this.successModalOpened.set(true);
          this.pageMode.set('home');
          this.assignForm.reset({ availableProduct: '' });
          this.availableProducts.set([]);
          this.loadChannelProducts(channelId);
        },
        error: (error: unknown) => {
          this.isAssigning.set(false);
          if (this.handleExpiredSession(error)) {
            return;
          }

          this.pageErrorMessage.set(
            this.getErrorMessage(error, 'Unable to assign product.')
          );
        }
      });
    } catch (error: unknown) {
      this.isAssigning.set(false);
      this.pageErrorMessage.set(
        this.getErrorMessage(error, 'Unable to assign product.')
      );
    }
  }

  closeSuccessModal(): void {
    this.successModalOpened.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.products().length / this.itemsPerPage));
  }

  getPaginatedProducts(): AdminProductManagementProduct[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.products().slice(startIndex, startIndex + this.itemsPerPage);
  }

  goToNextPage(): void {
    if (this.currentPage() < this.getTotalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  private loadChannelProducts(channelId: number): void {
    this.isLoadingChannelProducts.set(true);
    this.pageErrorMessage.set('');

    this.productService.getProductsByChannel(channelId).subscribe({
      next: (products) => {
        this.channelProducts.set(products);
        this.isLoadingChannelProducts.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingChannelProducts.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load channel products.')
        );
      }
    });
  }

  private loadAllProducts(): void {
    this.isLoadingProducts.set(true);
    this.pageErrorMessage.set('');

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.currentPage.set(1);
        this.isLoadingProducts.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingProducts.set(false);
        if (this.handleExpiredSession(error)) {
          return;
        }

        this.pageErrorMessage.set(
          this.getErrorMessage(error, 'Unable to load products.')
        );
      }
    });
  }

  private resetCreateForm(): void {
    this.createForm.reset({
      productId: '',
      productType: '00001',
      serviceTypeId: '',
      productName: '',
      productDescription: '',
      amountMax: '0',
      amountMin: '0',
      gender: '',
      profession: '',
      ageMax: '0',
      ageMin: '0'
    });
  }

  private patchCreateForm(defaults: ProductCreateForm): void {
    this.createForm.patchValue({
      productId: this.toFormString(defaults.productId),
      productType: this.toFormString(defaults.productType) || '00001',
      serviceTypeId: this.toFormString(defaults.serviceTypeId),
      productName: this.toFormString(defaults.productName),
      productDescription: this.toFormString(defaults.productDescription),
      amountMax: this.toFormString(defaults.amountMax) || '0',
      amountMin: this.toFormString(defaults.amountMin) || '0',
      gender: this.toFormString(defaults.gender),
      profession: this.toFormString(defaults.profession),
      ageMax: this.toFormString(defaults.ageMax) || '0',
      ageMin: this.toFormString(defaults.ageMin) || '0'
    });
  }

  private toFormString(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private handleExpiredSession(error: unknown): boolean {
    if (
      error instanceof AdminekycApiError &&
      error.status === 'UNAUTH' &&
      error.apiMessage?.trim().toLowerCase() === 'valid session required.'
    ) {
      this.state.closeUserModal();
      this.state.goToLogin();
      return true;
    }

    return false;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AdminekycApiError) {
      return error.apiMessage?.trim() || error.message || fallback;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
