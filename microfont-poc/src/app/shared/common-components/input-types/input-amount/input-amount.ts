import {Component, computed, input, output, signal, effect} from '@angular/core';
import {MatInput} from "@angular/material/input";
import {FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from "@angular/forms";
import {NgClass} from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { FormControlHighlightDirective } from '../../../directives/form-control-highlight.directive';

@Component({
  selector: 'input-amount',
  imports: [
    MatInput,
    ReactiveFormsModule,
    FormControlHighlightDirective,
    MatTooltipModule,
    NgClass,
    MatIconModule,
  ],
  templateUrl: './input-amount.html',
  standalone: true,
  styleUrl: './input-amount.scss'
})
export class InputAmount {

  readonly frmGroup = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly isReadonly = input<boolean>();
  readonly placeholder = input<any>();
  readonly enable = input<boolean>(true);
  readonly valueChange = output<any>();
  readonly cssClass = input<string>('');
  readonly maxLen = input<number>();
  readonly maxAmt = input<number>();
  readonly minAmt = input<number>();
  readonly labelText = input<string>('');
  readonly tooltip = input<string>();
  readonly tooltipPosition = input<'above' | 'below' | 'left' | 'right'>('above');
  readonly tooltipDelay = input<number>(500);
  readonly tooltipClass = input<string>('custom-tooltip');
  // New validation inputs
  readonly decimalPlaces = input<number>(2); // Default to 2 decimal places
  readonly allowNegative = input<boolean>(false);
  readonly allowLeadingZeros = input<boolean>(false);
  readonly isVertical = input<boolean>(false);
  readonly onBlurred = output<any>();

  readonly customErrorMessages = input<{ [key: string]: string }>({});
  readonly displayMode = input<'horizontal' | 'vertical' | 'outline'>('vertical');
  // Outputs
  readonly valueChanged = output<string>();
  readonly onChanged = output<any>();
  // readonly onInput = output<any>();

  // Internal state
  isInvalidState = signal(false);
  errorMessage = signal('');

  constructor() {
    // Effect to update validators when validation inputs change
    effect(() => {
      this.updateValidators();
    });
  }

  // Custom validators
  static amountValidator(decimalPlaces: number, allowLeadingZeros: boolean) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = control.value.toString();

      // Check for leading zeros (like 0987)
      if (!allowLeadingZeros && /^0\d+/.test(value)) {
        return { leadingZeros: { value: control.value } };
      }

      // Create regex based on decimal places
      const decimalRegex = decimalPlaces > 0
        ? new RegExp(`^\\d+(\\.\\d{1,${decimalPlaces}})?$`)
        : /^\d+$/;

      if (!decimalRegex.test(value)) {
        return { invalidAmount: {
          value: control.value,
          maxDecimals: decimalPlaces
        } };
      }

      return null;
    };
  }

  static negativeAmountValidator(allowNegative: boolean) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const numValue = parseFloat(control.value);
      if (!allowNegative && numValue < 0) {
        return { negativeNotAllowed: { value: control.value } };
      }

      return null;
    };
  }

  // Custom validator for maximum length on numbers
  static maxLengthNumberValidator(maxLength: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const value = control.value.toString();
      if (value.length > maxLength) {
        return {
          maxLengthNumber: {
            actualLength: value.length,
            requiredLength: maxLength,
            value: control.value
          }
        };
      }

      return null;
    };
  }

  hasCustomMessage(errorKey: string): boolean {
  const messages = this.customErrorMessages();
  return !!messages && errorKey in messages;
  }

  private updateValidators(): void {
    const control = this.frmGroup().get(this.controlName());
    if (!control) return;

  const existingValidators = control.validator ? [control.validator] : [];

  const validators = [...existingValidators];

    // Check if field was already required
    if (this.isRequired()) {
      validators.push(Validators.required);
    }

    // Add min/max validators if specified
    if (this.minAmt() !== undefined) {
      validators.push(Validators.min(this.minAmt()!));
    }

    if (this.maxAmt() !== undefined) {
      validators.push(Validators.max(this.maxAmt()!));
    }

    // Add max length validator for numbers
    if (this.maxLen() !== undefined && this.maxLen()! > 0) {
      validators.push(InputAmount.maxLengthNumberValidator(this.maxLen()!));
      validators.push(Validators.maxLength(this.maxLen()!));
    }

    // Add custom amount validator
    validators.push(InputAmount.amountValidator(
      this.decimalPlaces(),
      this.allowLeadingZeros()
    ));

    // Add negative validator
    validators.push(InputAmount.negativeAmountValidator(this.allowNegative()));

    // Update the control's validators
    control.setValidators(validators);
    control.updateValueAndValidity();
  }

  // Computed signals for reactive styling
  inputClasses = computed(() => {
    const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';
    const stateClasses = this.isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white';
    const errorClasses = this.isInvalidState() ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-300' : 'border-gray-300';
    const customClasses = this.cssClass() || '';

    return `${baseClasses} ${stateClasses} ${errorClasses} ${customClasses}`;
  });

  isRequired(): boolean {
    const control = this.frmGroup().get(this.controlName());
    if (!control?.validator) return false;
    const validation = control.validator({} as any);
    return !!validation?.['required'];
  }

  isInvalid(): boolean {
    const control = this.frmGroup().get(this.controlName());
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  hasError(errorCode: string): boolean {
    const control = this.frmGroup().get(this.controlName());
    return !!control?.hasError(errorCode);
  }

  getErrorValue(errorCode: string): any {
    const control = this.frmGroup().get(this.controlName());
    const error = control?.getError(errorCode);

    // For min and max errors, Angular returns an object {min: x, actual: y}
    if (errorCode === 'min' && error) {
      return error.min;
    }
    if (errorCode === 'max' && error) {
      return error.max;
    }

    // For custom validators
    if (typeof error === 'object' && error !== null) {
      return error;
    }
    return error;
  }

  get isDisabled(): boolean {
    return !this.enable();
  }

  // Format amount to have the correct decimal places
  private formatAmountValue(value: string | number): string {
    if (!value && value !== 0) return '';

    let val = value.toString().trim();

    // Return empty if value is empty after trim
    if (!val) return '';

    // If value ends with a decimal point, don't format yet (user is still typing)
    if (val.endsWith('.')) return val;

    // Parse as number
    const num = parseFloat(val);
    if (isNaN(num)) return val;

    // Format with correct number of decimal places
    return num.toFixed(this.decimalPlaces());
  }

  // Enhanced input handler with length limiting, leading zero removal, and decimal validation
  onChangeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const control = this.frmGroup().get(this.controlName());
    let value = input.value;

    // Remove leading zeros (convert "0345" to "345", but keep "0" and "0.5")
    if (value && !this.allowLeadingZeros()) {
      // Remove leading zeros but preserve single zero and decimal numbers starting with zero
      if (value !== '0' && !value.startsWith('0.') && /^0+/.test(value)) {
        value = value.replace(/^0+/, '') || '0';
      }
    }

    // Handle decimal places restriction
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > this.decimalPlaces()) {
        // Truncate decimal places
        value = parts[0] + '.' + parts[1].substring(0, this.decimalPlaces());
      }
    }

    // Apply maxLength restriction if specified
    if (this.maxLen() && value.length > this.maxLen()!) {
      value = value.slice(0, this.maxLen()!);
    }

    // Update input and form control if value changed
    if (input.value !== value) {
      input.value = value;
      control?.setValue(value);
    }

    this.valueChange.emit(control?.value);
  }

  // Handle paste events to validate pasted content
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const paste = event.clipboardData?.getData('text') || '';
    const input = event.target as HTMLInputElement;
    const control = this.frmGroup().get(this.controlName());

    // Clean the pasted value
    let cleanValue = paste.replace(/[^0-9.]/g, ''); // Remove non-numeric characters except decimal

    // Remove multiple decimal points (keep only the first one)
    const decimalCount = (cleanValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDecimalIndex = cleanValue.indexOf('.');
      cleanValue = cleanValue.substring(0, firstDecimalIndex + 1) +
                   cleanValue.substring(firstDecimalIndex + 1).replace(/\./g, '');
    }

    // Handle decimal places
    if (cleanValue.includes('.')) {
      const parts = cleanValue.split('.');
      if (parts[1] && parts[1].length > this.decimalPlaces()) {
        cleanValue = parts[0] + '.' + parts[1].substring(0, this.decimalPlaces());
      }

      // If decimal places is 0, remove decimal point
      if (this.decimalPlaces() === 0) {
        cleanValue = parts[0];
      }
    }

    // Remove leading zeros
    if (cleanValue && !this.allowLeadingZeros()) {
      if (cleanValue !== '0' && !cleanValue.startsWith('0.') && /^0+/.test(cleanValue)) {
        cleanValue = cleanValue.replace(/^0+/, '') || '0';
      }
    }

    // Apply max length
    if (this.maxLen() && cleanValue.length > this.maxLen()!) {
      cleanValue = cleanValue.slice(0, this.maxLen()!);
    }

    // Set the cleaned value
    input.value = cleanValue;
    control?.setValue(cleanValue);
    this.valueChange.emit(control?.value);
  }

  // Prevent typing beyond maxLength and decimal places
  onKeyPress(event: KeyboardEvent): boolean {
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const currentLength = currentValue.length;
    const char = event.key;
    const cursorPosition = input.selectionStart || 0;

    // Allow control keys (backspace, delete, tab, escape, enter, arrows)
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) ||
        // Allow Ctrl combinations
        (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase()))) {
      return true;
    }

    // Only allow numbers and decimal point
    if (!/[\d.]/.test(char)) {
      event.preventDefault();
      return false;
    }

    // Handle decimal point restrictions
    if (char === '.') {
      // Prevent multiple decimal points
      if (currentValue.includes('.')) {
        event.preventDefault();
        return false;
      }

      // If decimal places is 0, don't allow decimal point
      if (this.decimalPlaces() === 0) {
        event.preventDefault();
        return false;
      }

      return true;
    }

    // Handle digit input after decimal point
    if (currentValue.includes('.')) {
      const decimalIndex = currentValue.indexOf('.');
      const afterDecimal = currentValue.substring(decimalIndex + 1);

      // If cursor is after decimal point and we already have max decimal places
      if (cursorPosition > decimalIndex && afterDecimal.length >= this.decimalPlaces()) {
        event.preventDefault();
        return false;
      }
    }

    // Prevent leading zeros (except for decimal numbers)
    if (char === '0' && currentValue === '' && !this.allowLeadingZeros()) {
      return true; // Allow single zero
    }

    if (currentValue === '0' && /\d/.test(char) && char !== '.' && !this.allowLeadingZeros()) {
      event.preventDefault();
      return false;
    }

    // Check max length
    if (this.maxLen() && currentLength >= this.maxLen()!) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  // Helper method to format step attribute based on decimal places
  getStepValue(): string {
    if (this.decimalPlaces() === 0) return '1';
    return '0.' + '0'.repeat(this.decimalPlaces() - 1) + '1';
  }


  // Get custom error message for a specific error key
 getCustomErrorMessage(errorKey: string): string {
    const customMessages = this.customErrorMessages();
    const control = this.frmGroup().get(this.controlName());
    let message = `${this.label()} has validation error: ${errorKey}`;

    if (typeof customMessages[errorKey] === 'string') {
      message = customMessages[errorKey];
    } else if (customMessages[errorKey] && typeof customMessages[errorKey] === 'object' && 'message' in customMessages[errorKey]) {
      message = (customMessages[errorKey] as any).message;
    } else if (control?.errors?.[errorKey]) {
      const errorValue = control.errors[errorKey];
      if (typeof errorValue === 'string') {
        message = errorValue;
      } else if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
        message = (errorValue as any).message || message;
      }
    }
    return message;
  }

  // Get all error keys that are not handled by default error messages
  getCustomErrorKeys(): string[] {
    const control = this.frmGroup().get(this.controlName());
    if (!control?.errors) return [];

    const defaultErrorKeys = ['required', 'minlength', 'maxlength', 'specialCharacterNotAllowed'];
    return Object.keys(control.errors).filter(key => !defaultErrorKeys.includes(key));
  }

  // Check if there are any custom errors to display
  hasCustomErrors(): boolean {
    return this.getCustomErrorKeys().length > 0;
  }

  clearInput(): void {
  const control = this.frmGroup().get(this.controlName());
  if (control) {
    control.setValue('');
    control.markAsTouched();
    this.valueChanged.emit('');
    this.onChanged.emit('');
  }
}

onInput(event: Event): void {
  const value = (event.target as HTMLInputElement)?.value;
  this.valueChanged.emit(value);
  this.onChanged.emit(value);
}

onChange(event: Event): void {
  const value = (event.target as HTMLInputElement)?.value;
  this.onChanged.emit(value);
}

onBlur(): void {
  const control = this.frmGroup().get(this.controlName());
  let value = control ? control.value : undefined;

  // Format amount to show decimal places on blur
  if (value && value !== '' && value !== null) {
    const formattedValue = this.formatAmountValue(value);
    if (formattedValue !== value) {
      control?.setValue(formattedValue);
      value = formattedValue;
    }
  }

  this.onChanged.emit(value);
  this.onBlurred.emit(value);
}

}
