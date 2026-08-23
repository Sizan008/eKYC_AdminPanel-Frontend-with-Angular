import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { GenericButton } from '../../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextBox } from '../../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { InputDate } from '../../../../../shared/common-components/input-types/input-date/input-date';
import { InputNumber } from '../../../../../shared/common-components/input-types/input-number/input-number';
export type AdminCustomerSearchForm = {
  branchId: string;
  mobileNumber: string;
  trackingNumber: string;
  nidNumber: string;
  customerId: string;
  fromDate: string;
  toDate: string;
  customersPerPage: string;
  accountFrom: string;
  accountTo: string;
};

type AdminCustomerSearchFormGroup = {
  branchId: FormControl<string>;
  mobileNumber: FormControl<string>;
  trackingNumber: FormControl<string>;
  nidNumber: FormControl<string>;
  customerId: FormControl<string>;
  fromDate: FormControl<string>;
  toDate: FormControl<string>;
  customersPerPage: FormControl<string>;
  accountFrom: FormControl<string>;
  accountTo: FormControl<string>;
};

@Component({
  selector: 'admin-filter-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GenericButton,
    InputTextBox,
    InputDate,
    InputNumber
  ],
  templateUrl: './admin-filter-panel.html',
  styleUrl: './admin-filter-panel.scss'
})
export class AdminFilterPanel {
  readonly form = input.required<AdminCustomerSearchForm>();

  readonly formChanged = output<AdminCustomerSearchForm>();
  readonly resetClicked = output<void>();
  readonly searchClicked = output<void>();

  readonly filterForm = new FormGroup<AdminCustomerSearchFormGroup>({
    branchId: new FormControl('', { nonNullable: true }),
    mobileNumber: new FormControl('', { nonNullable: true }),
    trackingNumber: new FormControl('', { nonNullable: true }),
    nidNumber: new FormControl('', { nonNullable: true }),
    customerId: new FormControl('', { nonNullable: true }),
    fromDate: new FormControl('', { nonNullable: true }),
    toDate: new FormControl('', { nonNullable: true }),
    customersPerPage: new FormControl('', { nonNullable: true }),
    accountFrom: new FormControl('', { nonNullable: true }),
    accountTo: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      this.filterForm.patchValue(this.form(), {
        emitEvent: false
      });
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.formChanged.emit(this.filterForm.getRawValue());
    });
  }

  onReset(): void {
    this.resetClicked.emit();
  }

  onSearch(): void {
    this.searchClicked.emit();
  }
}