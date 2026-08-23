// select-option-field.component.ts
import { Component, input, signal, effect, ElementRef, ViewChild, output, AfterViewInit, OnInit, HostListener, OnDestroy } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { startWith } from 'rxjs';
import { FormControlHighlightDirective } from '../../../directives/form-control-highlight.directive';

type Option = { key: any; value: string };

@Component({
  selector: 'input-select-option-field',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormControlHighlightDirective,
    MatTooltipModule,
    NgClass
  ],
  templateUrl: './input-select-option-field.html',
  standalone: true,
  styleUrls: ['./input-select-option-field.scss']
})
export class InputSelectOptionField implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('selectWrapper') selectWrapper!: ElementRef<HTMLDivElement>;

  readonly frmGroup = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly isReadonly = input<boolean>();
  readonly options = input<Option[] | null>(null);
  readonly searchable = input<boolean>(true);
  readonly tooltip = input<string>();
  readonly tooltipPosition = input<'above' | 'below' | 'left' | 'right'>('above');
  readonly tooltipDelay = input<number>(500);
  readonly tooltipClass = input<string>('custom-tooltip');
  readonly placeholder = input<any>();
  readonly displayMode = input<'horizontal' | 'vertical' | 'outline'>('vertical');
  readonly allowUnselect = input<boolean>(true);
  readonly customErrorMessages = input<{ [key: string]: string }>({});
  readonly onSelect = output<{
    selectedOption: Option;
    selectedKey: any;
    selectedValue: string;
    formControl: any;
  }>();

  // Component state
  searchTerm = signal('');
  filterTerm = signal('');
  isOpen = signal(false);
  highlightedIndex = signal(-1);
  selectedValue = signal<any>('');
  filteredOptions = signal<Option[]>([]);
  displayText = signal<string>('');
  dropdownPosition = signal<'down' | 'up'>('down'); // NEW: Track dropdown position

  private _lastControlValue: any = '';
  private _lastOptionsRef: Option[] | null = null;
  private _isMouseDownOnOption = false;
  private _isMouseDownOnToggle = false;
  private _clickListener: ((event: MouseEvent) => void) | null = null;
  constructor() {
    effect(() => {
      const opts = this.options() || [];
      const optionsChanged = this._lastOptionsRef !== opts;
      this._lastOptionsRef = opts;
      //Select ${this.label()}
      const baseOpts = this.allowUnselect()
        ? [{ key: '', value: this.placeholder() ?? ` ` }, ...opts]
        : opts;

      if (!this.searchable()) {
        this.filteredOptions.set(baseOpts);
      } else {
        const term = this.filterTerm().toLowerCase();
        if (!term) {
          this.filteredOptions.set(baseOpts);
        } else {
          this.filteredOptions.set(
            baseOpts.filter(option =>
              option.value.toLowerCase().includes(term)
            )
          );
        }
      }
      this.highlightedIndex.set(-1);

      if (optionsChanged) {
        this._syncDisplayFromValue(this._lastControlValue);
      }
    });
  }

  ngOnInit(): void {
    const control = this.frmGroup().get(this.controlName());
    if (!control) return;

    control.valueChanges
      .pipe(startWith(control.value))
      .subscribe(val => {
        this._lastControlValue = val ?? '';
        this.selectedValue.set(this._lastControlValue);
        this._syncDisplayFromValue(this._lastControlValue);
      });

    // Add click-outside listener
    this._clickListener = (event: MouseEvent) => this._onDocumentClick(event);
    document.addEventListener('click', this._clickListener);
  }

  ngOnDestroy(): void {
    if (this._clickListener) {
      document.removeEventListener('click', this._clickListener);
    }
  }

  private _onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;

    const target = event.target as HTMLElement;
    const wrapperElement = this.selectWrapper?.nativeElement;

    if (wrapperElement && !wrapperElement.contains(target)) {
      this.closeDropdown();
    }
  }

  private _syncDisplayFromValue(val: any) {
    const opts = this.options() || [];
    const selected = opts.find(o => o.key === val);
    if (selected) {
      this.displayText.set(selected.value);
      if (this.searchable()) this.searchTerm.set(selected.value);
    } else {
      this.displayText.set('');
      if (this.searchable()) this.searchTerm.set('');
    }
  }

  compareFN(item1: any, item2: any): boolean {
    return item1 && item2 ? item1.key === item2.key : item1 === item2;
  }

  isRequired(): boolean {
    const control = this.frmGroup().get(this.controlName());
    if (!control?.validator) return false;
    const validation = control.validator({} as any);
    return !!validation?.['required'];
  }

  getCustomErrorMessage(errorKey: string): string {
    const control = this.frmGroup().get(this.controlName());
    let message = `${this.label()} has validation error: ${errorKey}`;

    if (typeof this.customErrorMessages()[errorKey] === 'string') {
      message = this.customErrorMessages()[errorKey];
    } else if (control?.errors?.[errorKey]) {
      const errorValue = control.errors[errorKey];
      if (typeof errorValue === 'string') {
        message = errorValue;
      }
    }
    return message;
  }

  getCustomErrorKeys(): string[] {
    const control = this.frmGroup().get(this.controlName());
    if (!control?.errors) return [];

    const defaultErrorKeys = ['required'];
    return Object.keys(control.errors).filter(key => !defaultErrorKeys.includes(key));
  }

  hasCustomErrors(): boolean {
    return this.getCustomErrorKeys().length > 0;
  }

  onSearchInput(event: Event): void {
    if (!this.searchable()) return;

    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.filterTerm.set(input.value);
    if (!this.isOpen()) {
      this.openDropdown();
    }

    const currentControl = this.frmGroup().get(this.controlName());
    if (currentControl && currentControl.value) {
      const selectedOption = this.options()?.find(opt => opt.key === currentControl.value);
      if (selectedOption && selectedOption.value !== input.value) {
        currentControl.setValue('');
      }
    }
  }

  onInputClick(): void {
    if (!this.searchable()) {
      this.toggleDropdown();
    }
  }

  onOptionMouseDown(event: MouseEvent): void {
    this._isMouseDownOnOption = true;
    event.preventDefault(); // Prevent input blur
  }

  onToggleMouseDown(event: MouseEvent): void {
    this._isMouseDownOnToggle = true;
    event.preventDefault(); // Prevent input blur
  }

  onInputBlur(): void {
    if (this._isMouseDownOnOption || this._isMouseDownOnToggle) {
      this._isMouseDownOnOption = false;
      this._isMouseDownOnToggle = false;
      return;
    }
    requestAnimationFrame(() => {       // ← swap setTimeout(fn, 200) for this
      this.closeDropdown();
      if (this.searchable()) {
        const control = this.frmGroup().get(this.controlName());
        if (control?.value) {
          const selectedOption = this.options()?.find(opt => opt.key === control.value);
          if (selectedOption) {
            this.searchTerm.set(selectedOption.value);
          }
        } else {
          this.searchTerm.set('');
        }
      }
    });
  }

  clearSelection(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isReadonly() || !this.allowUnselect()) return;

    const control = this.frmGroup().get(this.controlName());
    if (control && control.value !== '') {
      control.setValue('');
      control.markAsTouched();
      control.markAsDirty();
    }

    this.selectedValue.set('');
    this.displayText.set('');
    if (this.searchable()) {
      this.searchTerm.set('');
      this.filterTerm.set('');
    }

    this.onSelect.emit({
      selectedOption: null as any,
      selectedKey: '',
      selectedValue: '',
      formControl: control
    });
  }

  onStaticSelectChange(event: Event): void {
    if (this.isReadonly()) {
      const control = this.frmGroup().get(this.controlName());
      const selectElement = event.target as HTMLSelectElement;
      const current = control?.value ?? '';
      selectElement.value = current ?? '';
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const selectElement = event.target as HTMLSelectElement;
    const selectedKey = selectElement.value;

    if (selectedKey) {
      const selectedOption = this.options()?.find(opt => opt.key === selectedKey);
      if (selectedOption) {
        this.selectedValue.set(selectedKey);
        this.displayText.set(selectedOption.value);

        this.onSelect.emit({
          selectedOption: selectedOption,
          selectedKey: selectedKey,
          selectedValue: selectedOption.value,
          formControl: this.frmGroup().get(this.controlName())
        });
      }
    } else {
      this.selectedValue.set('');
      this.displayText.set('');
    }
  }

  onGuardedMouseDown(event: MouseEvent): void {
    if (this.isReadonly()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onGuardedKeyDown(event: KeyboardEvent): void {
    if (this.isReadonly()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const filteredOpts = this.filteredOptions();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown();
        } else {
          const nextIndex = this.highlightedIndex() < filteredOpts.length - 1
            ? this.highlightedIndex() + 1
            : 0;
          this.highlightedIndex.set(nextIndex);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          const prevIndex = this.highlightedIndex() > 0
            ? this.highlightedIndex() - 1
            : filteredOpts.length - 1;
          this.highlightedIndex.set(prevIndex);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen()) {
          const indexToSelect = this.highlightedIndex() >= 0 ? this.highlightedIndex() : 0;
          const option = filteredOpts[indexToSelect];
          if (option) {
            this.selectOption(option);
          }
        }
        break;

      case 'Escape':
        this.closeDropdown();
        this.searchInput.nativeElement.blur();
        break;
    }
  }

  openDropdown(): void {
    if (!this.isReadonly()) {
      if (this.searchable()) this.filterTerm.set('');
      this.calculateDropdownPosition();
      this.isOpen.set(true);
    }
  }

  private calculateDropdownPosition(): void {
    // Get the input element reference
    const inputElement = this.searchInput?.nativeElement ||
      document.querySelector(`#select_outlined`) as HTMLElement ||
      document.querySelector('.custom-select') as HTMLElement;

    if (!inputElement) {
      this.dropdownPosition.set('down');
      return;
    }

    const rect = inputElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Max height from CSS
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Position up if there's not enough space below but enough space above
    if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
      this.dropdownPosition.set('up');
    } else {
      this.dropdownPosition.set('down');
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
      if (this.searchable()) {
        this.searchInput.nativeElement.focus();
      }
    }
  }

  selectOption(option: Option): void {
    const control = this.frmGroup().get(this.controlName());
    if (control) {
      control.setValue(option.key);
      control.markAsTouched();
      control.markAsDirty();
    }

    if (option.key === '') {
      this.displayText.set('');
      if (this.searchable()) {
        this.searchTerm.set('');
        this.filterTerm.set('');
      }
    } else {
      this.displayText.set(option.value);
      if (this.searchable()) {
        this.searchTerm.set(option.value);
        this.filterTerm.set('');  // ← Reset to '' not option.value
      }
    }
    this.closeDropdown();

    this.onSelect.emit({
      selectedOption: option.key === '' ? (null as any) : option,
      selectedKey: option.key,
      selectedValue: option.key === '' ? '' : option.value,
      formControl: control
    });
  }
}
