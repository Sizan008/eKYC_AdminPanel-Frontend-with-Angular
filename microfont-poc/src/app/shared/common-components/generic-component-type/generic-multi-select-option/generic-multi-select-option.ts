// multi-select-option-field.component.ts
import {
  Component,
  input,
  signal,
  effect,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass,  NgIf } from '@angular/common';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

type Option = { key: any; value: string };

@Component({
  selector: 'generic-multi-select-option',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    MatPseudoCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule
  ],
  templateUrl: './generic-multi-select-option.html',
  styleUrl: './generic-multi-select-option.scss',
  standalone: true
})
export class GenericMultiInputSelectOption implements OnInit {
  @ViewChild('selectTrigger') selectTrigger!: ElementRef<HTMLDivElement>;
  @ViewChild('multiSelectWrapper') multiSelectWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  readonly frmGroup = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly isReadonly = input<boolean>();
  readonly options = input<Option[] | null>(null);
  readonly isVertical = input<boolean>(false);
  readonly placeholder = input<string>('');
  readonly showSelectAll = input<boolean>(true);
  readonly searchable = input<boolean>(true);
  readonly searchPlaceholder = input<string>('Search options...');
  readonly minSearchLength = input<number>(0);
  readonly tooltip = input<string>('Select options');
  readonly tooltipPosition = input<'above' | 'below' | 'left' | 'right'>('above');
  readonly tooltipDelay = input<number>(500);
  readonly tooltipClass = input<string>('custom-tooltip');
  readonly displayMode = input<'horizontal' | 'vertical' | 'outline'>('vertical');

  @Output() selectionChange = new EventEmitter<Option[]>();

  // Component state
  isOpen = signal(false);
  selectedValues = signal<any[]>([]);
  searchTerm = signal<string>('');
  filteredOptions = signal<Option[]>([]);

  constructor() {
    // Sync with form control value
    effect(() => {
      const control = this.frmGroup().get(this.controlName());
      if (control) {
        const controlValue = control.value || [];
        this.selectedValues.set(Array.isArray(controlValue) ? controlValue : []);
      }
    });

    // Update filtered options when search term or options change
    effect(() => {
      const opts = this.options() || [];
      const search = this.searchTerm().toLowerCase().trim();

      if (!search || search.length < this.minSearchLength()) {
        this.filteredOptions.set(opts);
      } else {
        const filtered = opts.filter(option =>
          option.value.toLowerCase().includes(search)
        );
        this.filteredOptions.set(filtered);
      }
    });
  }

  ngOnInit() {
    const control = this.frmGroup().get(this.controlName());
    if (control && control.value) {
      const controlValue = Array.isArray(control.value) ? control.value : [];
      this.selectedValues.set(controlValue);
    }
    this.filteredOptions.set(this.options() || []);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.multiSelectWrapper?.nativeElement?.contains(event.target as Node)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closeDropdown();
    }
  }

  trackByKey(index: number, option: Option): any {
    return option.key;
  }

  isRequired(): boolean {
    const control = this.frmGroup().get(this.controlName());
    if (!control?.validator) return false;
    const validation = control.validator({} as any);
    return !!validation?.['required'];
  }

  getSelectedOptions(): Option[] {
    const selected = this.selectedValues();
    const opts = this.options() || [];
    return opts.filter(option => selected.includes(option.key));
  }

  getDisplayText(): string {
    const selectedOptions = this.getSelectedOptions();
    const totalOptions = this.options()?.length || 0;

    if (selectedOptions.length === 0) return '';
    if (selectedOptions.length === totalOptions && totalOptions > 0)
      return 'All selected';
    if (selectedOptions.length <= 2)
      return selectedOptions.map(opt => opt.value).join(', ');
    return `${selectedOptions.length} items selected`;
  }

  isAllFilteredSelected(): boolean {
    const filtered = this.filteredOptions();
    const selected = this.selectedValues();
    return filtered.length > 0 && filtered.every(option => selected.includes(option.key));
  }

  isFilteredIndeterminate(): boolean {
    const filtered = this.filteredOptions();
    const selected = this.selectedValues();
    const selectedCount = filtered.filter(option => selected.includes(option.key)).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  toggleSelectAllFiltered(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isReadonly()) return;

    const filtered = this.filteredOptions();
    const currentValues = [...this.selectedValues()];

    if (this.isAllFilteredSelected()) {
      filtered.forEach(option => {
        const index = currentValues.indexOf(option.key);
        if (index !== -1) currentValues.splice(index, 1);
      });
    } else {
      filtered.forEach(option => {
        if (!currentValues.includes(option.key)) currentValues.push(option.key);
      });
    }

    this.selectedValues.set(currentValues);

    const control = this.frmGroup().get(this.controlName());
    if (control) {
      control.setValue(currentValues);
      control.markAsTouched();
      control.markAsDirty();
    }

    // ✅ Emit the updated full option objects
    this.selectionChange.emit(this.getSelectedOptions());
  }

  toggleOption(option: Option, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isReadonly()) return;

    const currentValues = [...this.selectedValues()];
    const index = currentValues.indexOf(option.key);

    if (index === -1) {
      currentValues.push(option.key);
    } else {
      currentValues.splice(index, 1);
    }

    this.selectedValues.set(currentValues);

    const control = this.frmGroup().get(this.controlName());
    if (control) {
      control.setValue(currentValues);
      control.markAsTouched();
      control.markAsDirty();
    }

    // ✅ Emit full selected options
    this.selectionChange.emit(this.getSelectedOptions());
  }

  isOptionSelected(option: Option): boolean {
    return this.selectedValues().includes(option.key);
  }

  onTriggerClick(): void {
    if (!this.isReadonly()) this.toggleDropdown();
  }

  onInputClick(event: Event): void {
    if (!this.searchable()) {
      this.toggleDropdown();
    } else if (!this.isOpen()) {
      this.openDropdown();
    }
  }

  onToggleClick(event: Event): void {
    event.stopPropagation();
    if (!this.isReadonly()) {
      this.toggleDropdown();
      if (this.isOpen() && this.searchable()) {
        setTimeout(() => this.searchInput?.nativeElement.focus());
      }
    }
  }

  onInputFocus(): void {
    if (!this.isReadonly() && this.searchable()) this.openDropdown();
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.closeDropdown();
      if (this.searchable()) this.clearSearch();
    }, 200);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isReadonly()) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!this.searchable() || event.key === 'Enter') {
          event.preventDefault();
          if (!this.isOpen()) this.toggleDropdown();
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.closeDropdown();
          this.searchInput?.nativeElement.blur();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) this.openDropdown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) this.closeDropdown();
        break;
    }
  }

  onSearchInput(event: Event): void {
    if (!this.searchable()) return;
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    if (!this.isOpen()) this.openDropdown();
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    if (this.searchInput) this.searchInput.nativeElement.value = '';
  }

  openDropdown(): void {
    if (!this.isReadonly()) {
      this.isOpen.set(true);
      if (this.searchable()) {
        setTimeout(() => this.searchInput?.nativeElement.focus());
      }
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.clearSearch();
  }

  toggleDropdown(): void {
    this.isOpen() ? this.closeDropdown() : this.openDropdown();
  }

  hasSearchResults(): boolean {
    return this.filteredOptions().length > 0;
  }

  getSearchResultsText(): string {
    const filtered = this.filteredOptions().length;
    const total = this.options()?.length || 0;
    return filtered === total ? '' : `${filtered} of ${total} options`;
  }
}
