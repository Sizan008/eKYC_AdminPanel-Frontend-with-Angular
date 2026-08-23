import { Component, forwardRef, input, output, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { AddressDto } from '../../../../shared/models/address.model';
import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'warehouse-address-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-form-field [formGroup]="frmGroup()" [appearance]="'outline'" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [formControl]="warehouseControl"
        [placeholder]="placeholder()"
        [matAutocomplete]="auto"
        (blur)="handleTouched()"
      />
      <mat-autocomplete #auto="matAutocomplete">
        <mat-option *ngFor="let warehouse of filteredWarehouses$ | async" [value]="warehouse">
          {{ warehouse.villWardNm }} - {{ warehouse.thanaNm }}, {{ warehouse.districtNm }}
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [`
    .w-full {
      width: 100%;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WarehouseAddressSearchComponent),
      multi: true
    }
  ]
})
export class WarehouseAddressSearchComponent implements ControlValueAccessor {
  readonly frmGroup = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input<string>('Search warehouse address...');

  readonly warehouseSelected = output<AddressDto>();

  private warehouseService = inject(WarehouseService);
  filteredWarehouses$: Observable<AddressDto[]> = of([]);
  warehouseControl: FormControl<any> = new FormControl('');

  private onChange = (value: AddressDto | null) => {};
  private onTouchedCallback = () => {};

  handleTouched(): void {
    this.onTouchedCallback();
  }

  constructor() {
    setTimeout(() => {
      this.warehouseControl = this.frmGroup().get(this.controlName()) as FormControl;
      this.filteredWarehouses$ = this.warehouseControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query: any) => {
          if (typeof query === 'string') {
            return this.warehouseService.searchWarehouses(query);
          }
          return of([query]);
        })
      );
    });
  }

  writeValue(obj: any): void {
    if (obj) {
      this.warehouseControl.setValue(obj, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.warehouseControl.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.warehouseControl.disable() : this.warehouseControl.enable();
  }
}
