import { Component, input, output, signal, computed, OnInit, OnDestroy, effect, WritableSignal, TemplateRef, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GenericMultiInputSelectOption } from '../generic-multi-select-option/generic-multi-select-option';
import { ExpansionPanelHeader } from '../../expansion-panel-header/expansion-panel-header';
import { GenericButton } from '../generic-button/generic-button';
import { InputTime } from '../../input-types/input-time/input-time';
import { InputDate } from '../../input-types/input-date/input-date';
import { DataGridStateService, DataGridState } from '../../../services/data-grid-state.service';

/**
 * Defines custom styling for a cell based on cell value or row data
 */
export interface CellStyleDefinition {
  /** Condition to apply styles (row data and cell value available) */
  condition: (cellValue: any, rowData?: any) => boolean;
  /** Custom CSS classes to apply */
  cssClasses?: string | string[];
  /** Inline styles object */
  styles?: Record<string, string | number>;
  /** Custom HTML attributes */
  attributes?: Record<string, string>;
}

/**
 * Defines custom styling for an entire row based on row data
 */
export interface RowStyleDefinition {
  /** Condition to apply styles */
  condition: (rowData: any) => boolean;
  /** Custom CSS classes to apply */
  cssClasses?: string | string[];
  /** Inline styles object */
  styles?: Record<string, string | number>;
}

/**
 * Emitted when pagination state changes (page, sort, filter)
 * Used for backend data requests
 */
export interface DataGridStateChange {
  pageIndex: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  totalRecords: number;
  totalPages: number;
}

/**
 * Defines custom content rendering for a cell or column
 */
export interface CellRenderFunction {
  (cellValue: any, rowData: any, rowIndex: number, columnProperty: string): string | SafeHtml | any;
}

/**
 * Defines custom row rendering
 */
export interface RowRenderFunction {
  (rowData: any, rowIndex: number): Record<string, string | number>;
}

/**
 * Legacy row styling interface - superseded by RowStyleDefinition
 */
export interface TableRowDesigner {
  condition: (item: any) => boolean;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: string;
  borderColor?: string;
}

export interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface GridColumn {
  property: string;
  header: string;
  isEditable: boolean;
  isNumeric: boolean;
  isVisible: boolean;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  isDropdown?: boolean;
  dropdownOptions?: DropdownOption[];
  dropdownOptionsSource?: string;
  isMultiSelect?: boolean;
  isCheckbox?: boolean;
  showSelectAll?: boolean; // New property for checkbox columns
  readOnly?: boolean; // New property to make checkboxes read-only
  isTimeField?: boolean; // New property for time picker fields
  isDateField?: boolean; // New property for date picker fields

  // NEW: Complete styling freedom
  /** Custom CSS classes to apply to all cells in this column */
  cssClasses?: string | string[];
  /** Inline styles to apply to all cells in this column */
  styles?: Record<string, string | number>;
  /** Header-specific CSS classes */
  headerCssClasses?: string | string[];
  /** Header-specific inline styles */
  headerStyles?: Record<string, string | number>;

  // NEW: Conditional styling per cell
  /** Apply styles conditionally based on cell value or row data */
  cellStyleDefinitions?: CellStyleDefinition[];

  // NEW: Custom content rendering
  /** Function to render arbitrary content (HTML, icons, badges, components, etc.) */
  renderFunction?: CellRenderFunction;
  /** Template reference for custom cell rendering */
  cellTemplate?: TemplateRef<any>;
}

export interface GridAction {
  type: 'edit' | 'delete' | 'view' | 'print';
  icon: string;
  tooltip: string;
  visible: boolean;
  disabled?: boolean;
}

type ActionVisibilityKey =
  | 'edit'
  | 'delete'
  | 'view'
  | 'print'
  | 'progress'
  | 'customAction1'
  | 'customAction2';

type ActionVisibilityMap = Partial<Record<ActionVisibilityKey, boolean>>;

export interface CheckboxChangeEvent {
  item: any;
  property: string;
  value: boolean;
  index: number;
}

export interface ColumnSelectAllEvent {
  property: string;
  checked: boolean;
}

export interface Option {
  key: string;
  value: string;
}

@Component({
  selector: 'generic-data-grid',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    GenericMultiInputSelectOption,
    ExpansionPanelHeader,
    GenericButton,
    InputTime,
    InputDate
  ],
  templateUrl: './generic-data-grid.html',
  styleUrl: './generic-data-grid.scss'
})
export class GenericDataGrid<T extends Record<string, any> = any> implements OnInit, OnDestroy {
  frmGroup: FormGroup;
  private stateService = inject(DataGridStateService);

  // Basic Inputs
  readonly id = input<string>('');
  readonly showEditButton = input<boolean>(false);
  readonly showDeleteButton = input<boolean>(false);
  readonly showViewButton = input<boolean>(false);
  readonly showProgressButton = input<boolean>(false);
  readonly showPrintButton = input<boolean>(false);
  readonly showCustomAction1 = input<boolean>(false);
  readonly customActionIcon1 = input<string>('');
  readonly customActionSvg1 = input<string>('');
  readonly customActionTooltip1 = input<string>('');
  readonly showCustomAction2 = input<boolean>(false);
  readonly customActionIcon2 = input<string>('');
  readonly customActionSvg2 = input<string>('');
  readonly customActionTooltip2 = input<string>('');
  readonly iconPathPrefix = input<string>('/asset/icons');
  readonly enableSelection = input<boolean>(false);
  readonly tblClass = input<string>('');
  readonly customColumnNames = input<Record<string, string>>({});
  readonly selectedColumns = input<string[]>([]);
  readonly editableColumns = input<string[]>([]);
  readonly numberColumns = input<string[]>([]);
  readonly rowDesignerList = input<TableRowDesigner[]>([]);
  readonly dataSource = input<T[]>([]);
  readonly initPageSize = input<number>(5);
  readonly useInlineEdit = input<boolean>(true);
  readonly searchEnabled = input<boolean>(false);
  readonly groupOptionEnabled = input<boolean>(false);
  readonly gridTitle = input<string>('');
  readonly summaryGridPosition = input<string>('above');
  readonly summaryGridEnabled = input<boolean>(false);
  readonly pageSizeOptions = input<number[]>([]);  // Custom page size options

  // Dropdown Inputs
  readonly dropdownColumns = input<string[]>([]);
  readonly dropdownOptions = input<Record<string, DropdownOption[]>>({});
  readonly multiSelectColumns = input<string[]>([]);
  readonly dynamicDropdownSources = input<Record<string, string>>({});

  // Enhanced Checkbox Inputs
  readonly checkboxColumns = input<string[]>([]);
  readonly checkboxSelectAllColumns = input<string[]>([]); // Columns that should show select all
  readonly readOnlyCheckboxColumns = input<string[]>([]); // Columns that should be read-only
  readonly selectionStateField = input<string>('');
  readonly selectionStateFunction = input<(item: any) => boolean>();
  readonly selectionUpdateField = input<string>('');
  // Time Field Inputs
  readonly timeColumns = input<string[]>([]); // Columns that should use time picker
  // Date Field Inputs
  readonly dateColumns = input<string[]>([]); // Columns that should use date picker
  // Summary
  readonly summaryColumns = input<string[]>([]);
  readonly groupByColumns = input<string[]>([]);
  // Per-row action visibility override. Return a map like { delete: false } to hide delete for that row.
  readonly actionVisibility = input<(row: T) => ActionVisibilityMap>();
  readonly readOnlyColumnResolvers = input<Record<string, (rowData: T) => boolean>>({});


  readonly cellRenderFunctions = input<Record<string, CellRenderFunction>>({});
  /** Conditional cell styling per column */
  readonly cellStyleResolvers = input<Record<string, CellStyleDefinition[]>>({});
  /** Row-level conditional styling */
  readonly rowStyleResolvers = input<RowStyleDefinition[]>([]);
  /** Enable backend-driven pagination - emit state changes instead of filtering locally */
  readonly backendPaginationEnabled = input<boolean>(false);
  readonly autoEditOnAdd = input<boolean>(false);

  readonly showPaginator = input<boolean>(true);

  readonly onPaginationChange = output<{
    pageIndex: number;
    pageSize: number;
    pageNumber: number;
  }>();

  readonly onRowEditStart = output<{
  rowData: T;
  rowIndex: number;
  displayIndex: number;
}>();

  // NEW: Backend-driven pagination state change event
  /**
   * Emitted when pagination state changes (page, sort, filter, search)
   * Used to signal parent component to fetch data from backend
   * Only emitted if backendPaginationEnabled is true
   */
  readonly onDataGridStateChange = output<DataGridStateChange>();

  /**
   * Emitted when a cell value changes (especially for dropdown selections)
   * Useful for triggering cascading updates or dependent dropdowns
   */
  readonly onCellValueChange = output<{
    rowData: T;
    columnProperty: string;
    oldValue: any;
    newValue: any;
  }>();

  // Basic Outputs
  readonly onSelectAllChange = output<{
    isSelectAll: boolean,
    selectedRows: T[],
    count: number
  }>();
  readonly onFHEditClick = output<string>();
  readonly onFHDeleteClick = output<string>();
  readonly onFHViewClick = output<string>();
  readonly onFHProgressClick = output<string>();
  readonly onChecked = output<{ data: string, checked: boolean }>();
  readonly onPrint = output<string>();
  readonly onExtraAction1Click = output<string>();
  readonly onExtraAction2Click = output<string>();
  readonly onCellButtonClick = output<any>();
  readonly dataSourceChanged = output<T[]>();
  readonly onRowDoubleClick = output<string>();
// Add this to your inputs
  readonly uniqueIdField = input<string>('id');
  // Enhanced Checkbox Outputs
  readonly onCheckboxValueChange = output<CheckboxChangeEvent>();
  readonly onColumnSelectAll = output<ColumnSelectAllEvent>();

  // Internal state signals
  public _dataSource = signal<T[]>([]);
  public _filteredData = signal<T[]>([]);
  public _currentPage = signal<number>(0);
  public _pageSize = signal<number>(5);
  public _sortColumn = signal<string>('');
  public _sortDirection = signal<'asc' | 'desc'>('asc');
  public _searchTerm = signal<string>('');
  public _selectedRows = signal<Set<string>>(new Set()); // Changed to store IDs instead of indices
  public _selectAll = signal<boolean>(false);
  public _editingRow = signal<number | null>(null);
  public _editingData = signal<Partial<T>>({});
  public _editingFormGroup = signal<FormGroup | null>(null);
  public _allSummary = signal<Record<string, number>>({});
  public _summaryOption = signal<{ key: string; value: string }[]>([]);
  public _groupByOption = signal<{ key: string; value: string }[]>([]);
  public _gridSummaryColumns = signal<string[]>([]);
  public _gridGroupColumns = signal<string[]>([]);
  public _selectedSummaryColumns = signal<string[]>([]);
  public _selectedGroupColumns = signal<string[]>([]);
  public _panelTitle = signal<string>('');
  businessHeaderPanel: WritableSignal<boolean> = signal(true);

  //Grouped summary (per group)
  public _groupedSummary = signal<any[]>([]);
  private _lastDataSourceCount = 0;
  private _initialized = false;

  //Overall summary
  public _totalSummary = signal<{ totalCount: number; totals: Record<string, number> }>({
    totalCount: 0,
    totals: {}
  });

  // Computed values
  columns = computed(() => this.buildColumns());
  displayedData = computed(() => this.getDisplayedData());
  totalPages = computed(() => Math.ceil(this._filteredData().length / this._pageSize()));
  hasNextPage = computed(() => this._currentPage() < this.totalPages() - 1);
  hasPrevPage = computed(() => this._currentPage() > 0);
  selectedCount = computed(() => this._selectedRows().size);
  isAllSelected = computed(() => {
    const displayedData = this.displayedData();
    if (displayedData.length === 0) return false;
    const idField = this.uniqueIdField();
    if (!idField) return false;
    return displayedData.every(item => this._selectedRows().has(String(item[idField])));
  });

  constructor(private formBuilder: FormBuilder, private sanitizer: DomSanitizer) {
    // Data source effect
    effect(() => {
      const data = this.dataSource();

      if (data && data.length > 0) {
        const previousCount = this._lastDataSourceCount;
        this._lastDataSourceCount = data.length;

        const oldData = untracked(this._dataSource);
        this._dataSource.set([...data]); // Create a copy
        this.applyFilters();

        // Detect addition and trigger auto-edit if enabled
        if (this.autoEditOnAdd() && data.length > previousCount && previousCount > 0) {
          const idField = this.uniqueIdField();
          if (idField) {
            // Find the new items (not in oldData)
            const newItems = data.filter(item => !oldData.find(old => old[idField] === item[idField]));
            if (newItems.length > 0) {
              // Edit the first new item found
              const newItem = newItems[0];
              
              // Wait for change detection to apply filters and update displayedData
              setTimeout(() => {
                // Find in filtered data to know which page it's on
                const rowIndex = this._filteredData().findIndex(item => item[idField] === newItem[idField]);
                if (rowIndex !== -1) {
                  const pageIndex = Math.floor(rowIndex / this._pageSize());
                  this._currentPage.set(pageIndex);
                  
                  // Wait for page change to update displayedData
                  setTimeout(() => {
                    const indexOnPage = this.displayedData().findIndex(item => item[idField] === newItem[idField]);
                    if (indexOnPage !== -1) {
                      this.startEdit(indexOnPage);
                    }
                  });
                }
              });
            }
          }
        }
      } else {
        this._lastDataSourceCount = 0;
        this._dataSource.set([]);
        this._filteredData.set([]);
      }
    });

    // Set initial page size effect
    effect(() => {
      const pageSize = this.initPageSize();
      const id = this.id();
      const savedState = id ? this.stateService.getState(id) : null;
      
      // Only set from initPageSize if no saved state exists for page size
      if (pageSize > 0 && (!savedState || savedState.pageSize === undefined)) {
        this._pageSize.set(pageSize);
      }
    });

    // State persistence effect
    effect(() => {
      const id = this.id();
      if (id) {
        const state: DataGridState = {
          pageSize: this._pageSize(),
          pageIndex: this._currentPage(),
          searchTerm: this._searchTerm(),
          sortColumn: this._sortColumn(),
          sortDirection: this._sortDirection()
        };
        this.stateService.saveState(id, state);
      }
    });

    //Group Summary, Count
    effect(() => {
      if (this._initialized) return; // skip re-run
      this._initialized = true;
      this.allGroupSummary();
    });
  }

  ngOnInit() {
    this.loadState();
    this.frmGroup = this.formBuilder.group({
      summaryColumn: [[]],
      groupColumn: [[]],
    });

    this.loadSummaryOption();
    this.loadGroupOption();

    // Child Panel Title
    const gridTitle = this.gridTitle();
    this._panelTitle.set(`${gridTitle} Summary`);


    console.log('Enhanced GenericDataGrid initialized');
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private loadState() {
    const id = this.id();
    if (!id) return;

    const savedState = this.stateService.getState(id);
    if (savedState) {
      if (savedState.pageSize !== undefined) this._pageSize.set(savedState.pageSize);
      if (savedState.pageIndex !== undefined) this._currentPage.set(savedState.pageIndex);
      if (savedState.searchTerm !== undefined) this._searchTerm.set(savedState.searchTerm);
      if (savedState.sortColumn !== undefined) this._sortColumn.set(savedState.sortColumn);
      if (savedState.sortDirection !== undefined) this._sortDirection.set(savedState.sortDirection);
      
      this.applyFilters();
      this.emitDataGridStateChange();
    }
  }

  // Enhanced Column management
  private buildColumns(): GridColumn[] {
    const allProperties = this._dataSource().length > 0 ? Object.keys(this._dataSource()[0]) : [];
    const propertiesToShow = this.selectedColumns().length > 0 ? this.selectedColumns() : allProperties;

    return propertiesToShow.map(prop => ({
      property: prop,
      header: this.customColumnNames()[prop] || this.formatColumnHeader(prop),
      isEditable: this.editableColumns().includes(prop),
      isNumeric: this.numberColumns().includes(prop),
      isVisible: true,
      sortable: !this.checkboxColumns().includes(prop), // Checkboxes are not sortable by default
      filterable: true,
      width: this.getColumnWidth(prop),

      // Dropdown properties
      isDropdown: this.dropdownColumns().includes(prop),
      dropdownOptions: [], // Not used anymore, options come from input
      dropdownOptionsSource: this.dynamicDropdownSources()[prop],
      isMultiSelect: this.multiSelectColumns().includes(prop),

      // Enhanced checkbox properties
      isCheckbox: this.checkboxColumns().includes(prop),
      showSelectAll: this.checkboxSelectAllColumns().includes(prop),
      readOnly: this.readOnlyCheckboxColumns().includes(prop),

      // Time field properties
      isTimeField: this.timeColumns().includes(prop)
    }));
  }

  // Method to get dropdown options for a column
  getDropdownOptions(column: GridColumn, rowData?: T): DropdownOption[] {
    if (column.dropdownOptionsSource && rowData) {
      // Dynamic options from row data
      const optionsData = this.getPropertyValue(rowData, column.dropdownOptionsSource);
      if (Array.isArray(optionsData)) {
        return optionsData.map(item => ({
          value: typeof item === 'object' ? item.value : item,
          label: typeof item === 'object' ? item.label : String(item)
        }));
      }
    }

    // Static options from current input configuration
    return this.dropdownOptions()[column.property] || [];
  }

  // Method to get display text for dropdown values
  getDropdownDisplayText(column: GridColumn, value: any, rowData?: T): string {
    if (!column.isDropdown) return value;

    const options = this.getDropdownOptions(column, rowData);

    if (column.isMultiSelect && Array.isArray(value)) {
      return value.map(v => {
        const option = options.find(opt => opt.value === v);
        return option ? option.label : v;
      }).join(', ');
    }

    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  // Enhanced setEditingValue to handle all input types
  setEditingValue(property: string, value: any): void {
    const column = this.columns().find(col => col.property === property);
    const oldValue = (this._editingData() as any)?.[property];

    if (column?.isCheckbox) {
      // Ensure boolean value for checkboxes
      this._editingData.set({
        ...this._editingData(),
        [property]: Boolean(value)
      } as Partial<T>);
    } else if (column?.isMultiSelect && typeof value === 'string') {
      // Handle multi-select string conversion if needed
      try {
        const parsedValue = JSON.parse(value);
        this._editingData.set({ ...this._editingData(), [property]: parsedValue } as Partial<T>);
      } catch {
        this._editingData.set({ ...this._editingData(), [property]: value } as Partial<T>);
      }
    } else {
      this._editingData.set({ ...this._editingData(), [property]: value } as Partial<T>);
    }

    // Emit cell value change event
    if (oldValue !== value) {
      this.onCellValueChange.emit({
        rowData: this._editingData() as T,
        columnProperty: property,
        oldValue: oldValue,
        newValue: value
      });
    }
  }

  // Method to handle multi-select changes
  onMultiSelectChange(property: string, selectedValues: any[]): void {
    this.setEditingValue(property, selectedValues);
  }

  // Enhanced checkbox methods
onCheckboxChange(item: T, property: string, checked: boolean, displayIndex: number): void {
  console.log('🔴 onCheckboxChange CALLED', { item, property, checked, displayIndex });

  if (this.readOnlyCheckboxColumns().includes(property)) {
    console.log('🔴 Read-only column, returning');
    return;
  }

  // Get unique ID field
  const idField = this.uniqueIdField();
  console.log('🔴 Using ID field:', idField);

  if (!idField) {
    console.error('🔴 ERROR: No uniqueIdField specified!');
    return;
  }

  const itemId = item[idField];
  console.log('🔴 Looking for item with ID:', itemId);

  // Find by unique ID instead of reference
  const sourceIndex = this._dataSource().findIndex((sourceItem) => {
    return sourceItem[idField] === itemId;
  });

  console.log('🔴 Source index found:', sourceIndex);

  if (sourceIndex === -1) {
    console.error('🔴 ERROR: Could not find item in source data!', {
      itemId,
      idField,
      sourceLength: this._dataSource().length,
      item
    });
    return;
  }

  // Create a new array with the updated item
  // The updated item must be a NEW object to prevent reference sharing issues
  const updatedData = this._dataSource().map((dataItem, idx) => {
    if (idx === sourceIndex) {
      // Create a new object by spreading to ensure it's not a shared reference
      return {
        ...dataItem,
        [property]: checked
      } as T;
    }
    // Return other items unchanged (references are OK for non-updated items)
    return dataItem;
  });

  console.log('🔴 Updated item:', updatedData[sourceIndex]);

  this._dataSource.set(updatedData);
  this.applyFilters();

  console.log('🔴 EMITTING dataSourceChanged');
  this.dataSourceChanged.emit(updatedData);

  this.onCheckboxValueChange.emit({
    item: updatedData[sourceIndex],
    property: property,
    value: checked,
    index: sourceIndex
  });
}

  // Method to check if all values in a column are checked
  isAllColumnValuesChecked(property: string): boolean {
    const displayedData = this.displayedData();
    if (displayedData.length === 0) return false;

    return displayedData.every(item =>
      Boolean(this.getPropertyValue(item, property))
    );
  }

  // Method to check if some (but not all) values in a column are checked
  isSomeColumnValuesChecked(property: string): boolean {
    const displayedData = this.displayedData();
    if (displayedData.length === 0) return false;

    const checkedCount = displayedData.filter(item =>
      Boolean(this.getPropertyValue(item, property))
    ).length;

    return checkedCount > 0 && checkedCount < displayedData.length;
  }

  // Method to select/deselect all checkboxes in a column
  onSelectAllForColumn(property: string, checked: boolean): void {
    if (this.readOnlyCheckboxColumns().includes(property)) {
      return; // Don't allow changes for read-only columns
    }

    const displayedData = this.displayedData();
    const displayedIds = new Set<any>();
    const idField = this.uniqueIdField();

    if (idField) {
      // Collect IDs of displayed items for efficient lookup
      displayedData.forEach(item => {
        displayedIds.add(item[idField]);
      });
    }

    // Create a new array with updated items for displayed rows
    const updatedData = this._dataSource().map(sourceItem => {
      // Check if this item is in the displayed data
      const isDisplayed = idField ? displayedIds.has(sourceItem[idField]) : displayedData.includes(sourceItem);

      if (isDisplayed) {
        // Create a new object to prevent reference sharing
        return {
          ...sourceItem,
          [property]: checked
        } as T;
      }
      // Return unchanged items
      return sourceItem;
    });

    this._dataSource.set(updatedData);
    this.applyFilters();

    // Emit events
    this.dataSourceChanged.emit(updatedData);
    this.onColumnSelectAll.emit({
      property: property,
      checked: checked
    });
  }

  private getColumnWidth(property: string): string {
    // Enhanced width mapping with checkbox consideration
    const widthMap: Record<string, string> = {
      id: '100px',
      name: '200px',
      email: '250px',
      status: '120px',
      isActive: '120px',
      // Add more properties as needed
    };

    // Shorter width for checkbox columns
    if (this.checkboxColumns().includes(property)) {
      return widthMap[property] || '100px';
    }

    return widthMap[property] || '150px'; // Default width
  }

  public formatColumnHeader(property: string): string {
    return property
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }


 private applyDatabaseSelectionState(): void {
   const stateField = this.selectionStateField();
    const stateFunction = this.selectionStateFunction();
    const idField = this.uniqueIdField();

    if (!stateField && !stateFunction) return;
    if (!idField) {
      console.error('Selection state requires uniqueIdField to be set');
      return;
    }

    const newSelected = new Set<string>();
    this._filteredData().forEach((item) => {
      let isSelected = false;

      if (stateFunction) {
        // Use custom function if provided
        isSelected = stateFunction(item);
      } else if (stateField) {
        // Use simple field check
        isSelected = this.getPropertyValue(item, stateField);
      }

      if (isSelected) {
        newSelected.add(String(item[idField]));
      }
    });

    this._selectedRows.set(newSelected);
  }

  private updateRowSelectionInDatabase(item: T, checked: boolean): void {
    const updateField = this.selectionUpdateField() || this.selectionStateField();
    if (!updateField) return;

    const idField = this.uniqueIdField();
    if (!idField) return;

    const itemId = item[idField];
    const sourceIndex = this._dataSource().findIndex(sourceItem => sourceItem[idField] === itemId);

    if (sourceIndex !== -1) {
      const updatedData = [...this._dataSource()];
      (updatedData[sourceIndex] as any)[updateField] = checked;
      this._dataSource.set(updatedData);
      this.applyFilters();
      this.dataSourceChanged.emit(updatedData);
    }
  }

  // Enhanced data filtering and sorting
  private applyFilters(): void {
    let filtered = [...this._dataSource()];

    // Apply search filter
    if (this._searchTerm()) {
      filtered = filtered.filter(item =>
        Object.entries(item as Record<string, any>).some(([key, value]) => {
          const column = this.columns().find(col => col.property === key);

          // Handle different column types for search
          if (column?.isCheckbox) {
            // For checkboxes, search for "true", "false", "yes", "no"
            const searchTerm = this._searchTerm().toLowerCase();
            const boolValue = Boolean(value);
            return (
              (boolValue && ['true', 'yes', '1', 'checked'].includes(searchTerm)) ||
              (!boolValue && ['false', 'no', '0', 'unchecked'].includes(searchTerm))
            );
          } else if (column?.isDropdown) {
            // For dropdowns, search in both value and display text
            const displayText = this.getDropdownDisplayText(column, value, item);
            return displayText.toLowerCase().includes(this._searchTerm().toLowerCase()) ||
                   String(value).toLowerCase().includes(this._searchTerm().toLowerCase());
          } else {
            // Regular search for other columns
            return String(value).toLowerCase().includes(this._searchTerm().toLowerCase());
          }
        })
      );
    }

    // Apply sorting
    if (this._sortColumn()) {
      filtered.sort((a, b) => {
        const aVal = this.getPropertyValue(a, this._sortColumn());
        const bVal = this.getPropertyValue(b, this._sortColumn());

        // Handle different data types for sorting
        const column = this.columns().find(col => col.property === this._sortColumn());

        if (column?.isCheckbox) {
          // Boolean sorting
          const aBool = Boolean(aVal);
          const bBool = Boolean(bVal);
          if (this._sortDirection() === 'asc') {
            return aBool === bBool ? 0 : aBool ? 1 : -1;
          } else {
            return aBool === bBool ? 0 : aBool ? -1 : 1;
          }
        } else if (column?.isNumeric) {
          // Numeric sorting
          const aNum = Number(aVal) || 0;
          const bNum = Number(bVal) || 0;
          return this._sortDirection() === 'asc' ? aNum - bNum : bNum - aNum;
        } else {
          // String sorting
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          if (this._sortDirection() === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
          }
        }
      });
    }

    this._filteredData.set(filtered);

    // Ensure current page is still valid after filtering
    // Only clamp if we have data to prevent resetting to 0 during initial load or empty states
    if (filtered.length > 0) {
      const maxPage = Math.max(0, Math.ceil(filtered.length / this._pageSize()) - 1);
      if (this._currentPage() > maxPage) {
        this._currentPage.set(maxPage);
      }
    }
  }

  public getPropertyValue(item: T, property: string): any {
    return property.split('.').reduce((obj: any, key) => obj?.[key], item);
  }

  private getDisplayedData(): T[] {
    const startIndex = this._currentPage() * this._pageSize();
    const endIndex = startIndex + this._pageSize();
    const displayed = this._filteredData().slice(startIndex, endIndex);
    return displayed;
  }

  // Sorting
getPageSizeOptions(): number[] {
  const customOptions = this.pageSizeOptions();
  const dataLength = this._filteredData().length;

  let options: number[] = [];

  if (customOptions && customOptions.length > 0) {
    options = [...customOptions];
  } else {
    if (dataLength <= 100) {
      options = [5, 10, 25, 50];
    } else if (dataLength <= 500) {
      options = [10, 25, 50, 100];
    } else if (dataLength <= 1000) {
      options = [25, 50, 100, 250];
    } else if (dataLength <= 5000) {
      options = [50, 100, 250, 500];
    } else if (dataLength <= 10000) {
      options = [100, 250, 500, 1000];
    } else {
      options = [250, 500, 1000, 2500];
    }
  }

  // Always include current page size
  const currentSize = this._pageSize();
  if (!options.includes(currentSize)) {
    options.push(currentSize);
  }

  //  Add "All" option (data length)
  if (dataLength > 0 && !options.includes(dataLength)) {
    options.push(dataLength);
  }

  return options.sort((a, b) => a - b);
}

  onSort(column: string): void {
    if (this._sortColumn() === column) {
      this._sortDirection.set(this._sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this._sortColumn.set(column);
      this._sortDirection.set('asc');
    }
    this._currentPage.set(0); // Reset to first page when sorting changes
    this.applyFilters();
    this.emitDataGridStateChange(); // NEW: Emit state change for backend
  }

  // Pagination
onPageChange(event: PageEvent): void {
  const dataLength = this._filteredData().length;

  // If "All" selected
  if (event.pageSize === dataLength) {
    this._currentPage.set(0);
  } else {
    this._currentPage.set(event.pageIndex);
  }

  this._pageSize.set(event.pageSize);

  this.onPaginationChange.emit({
    pageIndex: this._currentPage(),
    pageSize: event.pageSize,
    pageNumber: this._currentPage() + 1
  });

  this.emitDataGridStateChange();
}

  /**
   * Emits the current grid state (pagination, sorting, filtering, search)
   * Used for backend-driven pagination and data requests
   */
  private emitDataGridStateChange(): void {
    if (this.backendPaginationEnabled()) {
      this.onDataGridStateChange.emit({
        pageIndex: this._currentPage(),
        pageSize: this._pageSize(),
        sortColumn: this._sortColumn(),
        sortDirection: this._sortDirection(),
        searchTerm: this._searchTerm(),
        totalRecords: this._filteredData().length,
        totalPages: this.totalPages()
      });
    }
  }


  // Search
  onSearch(term: string): void {
    this._searchTerm.set(term);
    this._currentPage.set(0); // Reset to first page when search term changes
    this.applyFilters();
    this.emitDataGridStateChange(); // NEW: Emit state change for backend
  }

  // Row selection
  onRowSelect(item: T, checked: boolean): void {
    const idField = this.uniqueIdField();
    if (!idField) {
      console.error('Row selection requires uniqueIdField to be set');
      return;
    }

    const itemId = String(item[idField]);
    const newSelected = new Set(this._selectedRows());

    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }

    this._selectedRows.set(newSelected);

    if(this.selectionStateField()) {
      this.updateRowSelectionInDatabase(item, checked);
    }

    this.onChecked.emit({
      data: JSON.stringify(item),
      checked: checked
    });
  }

    onSelectAll(checked: boolean): void {
      this._selectAll.set(checked);

      if (checked) {
        const newSelected = new Set<string>();
        const idField = this.uniqueIdField();
        // Select ALL rows from filtered data, not just displayed page
        this._filteredData().forEach((item) => {
          if (idField) {
            newSelected.add(String(item[idField]));
          }
        });
        this._selectedRows.set(newSelected);
      } else {
        this._selectedRows.set(new Set());
      }

    const selectedRows = this.getSelectedRows();
    this.onSelectAllChange.emit({
      isSelectAll: checked,
      selectedRows: selectedRows,
      count: selectedRows.length
    });
    }

  // Row editing
  startEdit(index: number): void {
    this._editingRow.set(index);
    const rowData = { ...this.displayedData()[index] };
    this._editingData.set(rowData);

  //  Emit the row being edited with full row data
  this.onRowEditStart.emit({
    rowData: rowData,
    rowIndex: this._currentPage() * this._pageSize() + index, // absolute index in filtered data
    displayIndex: index // index on current page
  });

    // Create form group for time and date fields
    const formControls: any = {};
    this.timeColumns().forEach(timeCol => {
      const value = rowData[timeCol] || '';
      formControls[timeCol] = [value];
    });

    this.dateColumns().forEach(dateCol => {
      let value = rowData[dateCol] || '';
      // Parse date string to Date object for the date picker
      if (typeof value === 'string' && value) {
        // Parse ISO date string (YYYY-MM-DD or similar) to Date object
        // Using Date constructor with UTC to avoid timezone issues
        const parts = value.split('-');
        if (parts.length === 3) {
          // Create date from parts to avoid timezone offset issues
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
          const day = parseInt(parts[2], 10);
          value = new Date(year, month, day);
        } else {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date;
          }
        }
      }
      formControls[dateCol] = [value];
    });

    if (Object.keys(formControls).length > 0) {
      const newFormGroup = this.formBuilder.group(formControls);
      this._editingFormGroup.set(newFormGroup);

      // Subscribe to form control value changes for date and time fields
      // This captures changes from date picker and time picker selections
      this.dateColumns().forEach(dateCol => {
        const control = newFormGroup.get(dateCol);
        if (control) {
          control.valueChanges.subscribe(value => {
            this.setEditingValue(dateCol, this.formatDateValue(value));
          });
        }
      });

      this.timeColumns().forEach(timeCol => {
        const control = newFormGroup.get(timeCol);
        if (control) {
          control.valueChanges.subscribe(value => {
            this.setEditingValue(timeCol, value);
          });
        }
      });
    }
  }

  saveEdit(index: number): void {
    const displayedItem = this.displayedData()[index];
    const idField = this.uniqueIdField();
    let sourceIndex = -1;

    if (idField && displayedItem) {
      // Use ID-based lookup
      const itemId = displayedItem[idField];
      sourceIndex = this._dataSource().findIndex(sourceItem => sourceItem[idField] === itemId);
    } else {
      // Fallback to reference comparison
      sourceIndex = this._dataSource().findIndex(sourceItem => sourceItem === displayedItem);
    }

    if (sourceIndex !== -1) {
      const updatedData = this._dataSource().map((item, idx) => {
        if (idx === sourceIndex) {
          return { ...item, ...this._editingData() } as T;
        }
        return item;
      });

      this._dataSource.set(updatedData);
      this._editingRow.set(null);
      this._editingData.set({});
      this._editingFormGroup.set(null);
      this.applyFilters();
      this.dataSourceChanged.emit(updatedData);
    }
  }

  cancelEdit(): void {
    this._editingRow.set(null);
    this._editingData.set({});
    this._editingFormGroup.set(null);
  }

  // Check if a column is a date column
  isDateColumn(columnProperty: string): boolean {
    return this.dateColumns().includes(columnProperty);
  }

  // Check if a column is a time column
  isTimeColumn(columnProperty: string): boolean {
    return this.timeColumns().includes(columnProperty);
  }

  // Check if column should be treated as a date for display purposes
  isDateOrTimeColumn(column: GridColumn): boolean {
    return column.isDateField || this.isDateColumn(column.property) ||
           column.isTimeField || this.isTimeColumn(column.property);
  }

  // Format date value to ISO string (YYYY-MM-DD) using local time (not UTC)
  formatDateValue(value: any): string {
    if (!value) return '';

    // If it's already a string in ISO format, return it
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value;
    }

    // If it's a Date object, convert using local time to avoid timezone offset issues
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return value;
  }

  // Format date value for display (use the same ISO format for consistency)
  getFormattedDateForDisplay(value: any, column: GridColumn): string {
    if (!value) return '';

    // If it's a Date object, format it properly instead of using toString()
    if (value instanceof Date) {
      return this.formatDateValue(value);
    }

    // If it's a string that looks like an ISO date, just return it
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value;
    }

    // Try to parse as date if it doesn't look like an ISO format
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return this.formatDateValue(date);
      }
    }

    return String(value);
  }

  // Actions
  onEditClick(item: T): void {
    this.onFHEditClick.emit(JSON.stringify(item));
  }

  onDeleteClick(item: T): void {
    this.onFHDeleteClick.emit(JSON.stringify(item));
  }

  onViewClick(item: T): void {
    this.onFHViewClick.emit(JSON.stringify(item));
  }

  onFHProgress(item: T): void {
    this.onFHProgressClick.emit(JSON.stringify(item));
  }

  onPrintClick(item: T): void {
    this.onPrint.emit(JSON.stringify(item));
  }

  // Extra configurable action buttons
  emitExtraAction1(item: T): void {
    this.onExtraAction1Click.emit(JSON.stringify(item));
  }

  emitExtraAction2(item: T): void {
    this.onExtraAction2Click.emit(JSON.stringify(item));
  }

  // Resolve icon URL from public path; will append .svg if no extension provided
  getIconUrl(iconName: string): string {
    if (!iconName) return '';
    const hasExt = /\.\w+$/.test(iconName);
    const prefix = this.iconPathPrefix ? this.iconPathPrefix() : '/asset/icons';
    return `${prefix}/${iconName}${hasExt ? '' : '.svg'}`;
  }

  // Safely render HTML/SVG content
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Row styling
  getRowStyle(item: T): any {
    for (const designer of this.rowDesignerList()) {
      if (designer.condition(item)) {
        return {
          backgroundColor: designer.backgroundColor,
          color: designer.textColor,
          fontWeight: designer.fontWeight,
          borderColor: designer.borderColor
        };
      }
    }

    // NEW: Apply row style definitions (advanced styling)
    for (const styleDefinition of this.rowStyleResolvers()) {
      if (styleDefinition.condition(item)) {
        return this.buildStyleObject(
          styleDefinition.styles,
          styleDefinition.cssClasses
        );
      }
    }

    return {};
  }

  /**
   * Get cell-specific styling based on column and row data
   * Supports:
   * - Column-level CSS classes and styles
   * - Conditional cell styling based on cell value or row data
   * - Cell-level style overrides
   */
  getCellStyle(column: GridColumn, cellValue: any, rowData: T): any {
    const styles: any = {};

    // Apply column-level styles
    if (column.styles) {
      Object.assign(styles, column.styles);
    }

    // Apply conditional cell styling from cellStyleDefinitions
    if (column.cellStyleDefinitions && column.cellStyleDefinitions.length > 0) {
      for (const styleDef of column.cellStyleDefinitions) {
        if (styleDef.condition(cellValue, rowData)) {
          if (styleDef.styles) {
            Object.assign(styles, styleDef.styles);
          }
          break; // Apply first matching condition
        }
      }
    }

    // Apply styling from cellStyleResolvers (global configuration)
    const resolvers = this.cellStyleResolvers()[column.property];
    if (resolvers && resolvers.length > 0) {
      for (const styleDef of resolvers) {
        if (styleDef.condition(cellValue, rowData)) {
          if (styleDef.styles) {
            Object.assign(styles, styleDef.styles);
          }
          break;
        }
      }
    }

    return styles;
  }

  /**
   * Get CSS classes for a cell
   * Combines column-level classes with conditional classes
   */
  getCellCssClasses(column: GridColumn, cellValue: any, rowData: T): string[] {
    const classes: string[] = [];

    // Add column-level CSS classes
    if (column.cssClasses) {
      if (typeof column.cssClasses === 'string') {
        classes.push(column.cssClasses);
      } else {
        classes.push(...column.cssClasses);
      }
    }

    // Add conditional CSS classes from cellStyleDefinitions
    if (column.cellStyleDefinitions && column.cellStyleDefinitions.length > 0) {
      for (const styleDef of column.cellStyleDefinitions) {
        if (styleDef.condition(cellValue, rowData)) {
          if (styleDef.cssClasses) {
            if (typeof styleDef.cssClasses === 'string') {
              classes.push(styleDef.cssClasses);
            } else {
              classes.push(...styleDef.cssClasses);
            }
          }
          break;
        }
      }
    }

    // Add conditional CSS classes from global cellStyleResolvers
    const resolvers = this.cellStyleResolvers()[column.property];
    if (resolvers && resolvers.length > 0) {
      for (const styleDef of resolvers) {
        if (styleDef.condition(cellValue, rowData)) {
          if (styleDef.cssClasses) {
            if (typeof styleDef.cssClasses === 'string') {
              classes.push(styleDef.cssClasses);
            } else {
              classes.push(...styleDef.cssClasses);
            }
          }
          break;
        }
      }
    }

    return classes;
  }

  /**
   * Render cell content using custom render function
   * Supports rendering: HTML, text, icons, badges, buttons, custom components
   */
  renderCellContent(column: GridColumn, cellValue: any, rowData: T, rowIndex: number): any {
    // Check for custom render function
    const renderFunc = this.cellRenderFunctions()[column.property];
    if (renderFunc && typeof renderFunc === 'function') {
      const result = renderFunc(cellValue, rowData, rowIndex, column.property);
      // If result is a string with HTML, wrap it as safe HTML for rendering
      if (typeof result === 'string' && result.includes('<')) {
        return this.getSafeHtml(result);
      }
      return result;
    }

    // Check for column-level render function
    if (column.renderFunction && typeof column.renderFunction === 'function') {
      const result = column.renderFunction(cellValue, rowData, rowIndex, column.property);
      // If result is a string with HTML, wrap it as safe HTML for rendering
      if (typeof result === 'string' && result.includes('<')) {
        return this.getSafeHtml(result);
      }
      return result;
    }

    // Default: return cell value
    return cellValue;
  }



  private getEffectiveRowData(rowData: T, rowIndex: number): T {
    if (this.isRowEditing(rowIndex)) {
      return { ...rowData, ...(this._editingData() as Partial<T>) } as T;
    }
    return rowData;
  }

  isCellReadOnly(columnProperty: string, rowData: T, rowIndex: number): boolean {
    const resolver = this.readOnlyColumnResolvers()[columnProperty];
    if (typeof resolver !== 'function') {
      return false;
    }
    return !!resolver(this.getEffectiveRowData(rowData, rowIndex));
  }

  // Handler for button clicks in rendered cells
  onRenderedButtonClick(action: string, rowData: any, columnName: string): void {
    this.onCellButtonClick.emit({
      action: action,
      rowData: rowData,
      column: columnName,
      timestamp: new Date()
    });
  }

  /**
   * Check if a cell should use custom rendering
   */
  hasCustomCellRendering(column: GridColumn): boolean {
    const globalRenderFunc = this.cellRenderFunctions()[column.property];
    return !!(globalRenderFunc || column.renderFunction);
  }

  /**
   * Helper method to build style object from styles and CSS classes
   */
  private buildStyleObject(styles?: Record<string, string | number>, cssClasses?: string | string[]): any {
    const result: any = {};

    if (styles) {
      Object.assign(result, styles);
    }

    return result;
  }

  // Utility methods
  isRowSelected(item: T): boolean {
    const idField = this.uniqueIdField();
    if (!idField) {
      return false; // Cannot determine selection without ID field
    }
    return this._selectedRows().has(String(item[idField]));
  }

  isRowEditing(index: number): boolean {
    return this._editingRow() === index;
  }

  getEditingValue(property: string): any {
    const value = (this._editingData() as Record<string, any>)[property];
    const column = this.columns().find(col => col.property === property);

    if (column?.isCheckbox) {
      return Boolean(value);
    }

    return value !== undefined ? value : '';
  }

  // Public methods for external access
  getSelectedRows(): T[] {
    const idField = this.uniqueIdField();
    if (!idField) {
      return [];
    }

    const selectedIds = this._selectedRows();
    return this._filteredData().filter(item =>
      selectedIds.has(String(item[idField]))
    );
  }

  clearSelection(): void {
    this._selectedRows.set(new Set());
    this._selectAll.set(false);
  }

  refreshData(): void {
    this.applyFilters();
  }

  private _actionVisibilityResults = computed(() => {
      const resolver = this.actionVisibility();
      const dataSource = this._dataSource();

      if (!resolver) return new Map<number, ActionVisibilityMap>();

      const results = new Map<number, ActionVisibilityMap>();

      dataSource.forEach((row, index) => {
        try {
          const result = resolver(row);
          results.set(index, result || {});
        } catch (error) {
          console.warn('ActionVisibility error for row', index, ':', error);
          results.set(index, {});
        }
      });

      return results;
    });

  // Resolve whether a given action should be visible for the provided row.
 isActionVisible(row: T, key: ActionVisibilityKey, defaultValue: boolean): boolean {
      const results = this._actionVisibilityResults();
      const rowIndex = this._dataSource().findIndex(r => r === row);

      if (rowIndex >= 0) {
        const rowResult = results.get(rowIndex);
        if (rowResult && rowResult[key] !== undefined && rowResult[key] !== null) {
          return !!rowResult[key];
        }
      }

      return defaultValue;
    }


  // Get displayed columns for the table
  getDisplayedColumns(): string[] {
    const columns: string[] = [];

    if (this.enableSelection()) {
      columns.push('selection');
    }

    if (this.showEditButton() || this.showDeleteButton() || this.showViewButton() || this.showPrintButton() || this.showProgressButton() || this.showCustomAction1() || this.showCustomAction2()) {
      columns.push('actions');
    }

    const dataColumns = this.columns().map(col => col.property);
    columns.push(...dataColumns);

    return columns;
  }

  // Row double-click handler (template binds directly, but helper for clarity)
  emitRowDoubleClick(item: T): void {
    this.onRowDoubleClick.emit(JSON.stringify(item));
  }

  // Enhanced public methods for checkbox functionality

  // Get all checked items for a specific column
  getCheckedItemsForColumn(property: string): T[] {
    return this._dataSource().filter(item =>
      Boolean(this.getPropertyValue(item, property))
    );
  }

  // Set checkbox value for a specific item
  setCheckboxValue(item: T, property: string, checked: boolean): void {
    const idField = this.uniqueIdField();
    const itemId = idField ? item[idField] : null;

    let sourceIndex = -1;
    if (itemId !== null) {
      // Use ID-based lookup
      sourceIndex = this._dataSource().findIndex(sourceItem => sourceItem[idField] === itemId);
    } else {
      // Fallback to reference comparison if no ID field
      sourceIndex = this._dataSource().findIndex(sourceItem => sourceItem === item);
    }

    if (sourceIndex !== -1 && !this.readOnlyCheckboxColumns().includes(property)) {
      const updatedData = this._dataSource().map((dataItem, idx) => {
        if (idx === sourceIndex) {
          return {
            ...dataItem,
            [property]: checked
          } as T;
        }
        return dataItem;
      });

      this._dataSource.set(updatedData);
      this.applyFilters();
      this.dataSourceChanged.emit(updatedData);
    }
  }

  // Bulk update checkbox values
  bulkUpdateCheckboxColumn(property: string, checked: boolean, condition?: (item: T) => boolean): void {
    if (this.readOnlyCheckboxColumns().includes(property)) {
      return;
    }

    const updatedData = this._dataSource().map((item, index) => {
      if (!condition || condition(item)) {
        return {
          ...item,
          [property]: checked
        } as T;
      }
      return item;
    });

    // Only trigger updates if something was actually changed
    const hasChanges = updatedData.some((item, idx) => item !== this._dataSource()[idx]);
    if (hasChanges) {
      this._dataSource.set(updatedData);
      this.applyFilters();
      this.dataSourceChanged.emit(updatedData);
    }
  }

  // Mobile detection utility for responsive design
  isMobileView(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  }

  // Math utility for template
  Math = Math;

  // Time field helper methods
  getEditingFormGroup(): FormGroup {
    return this._editingFormGroup() || this.formBuilder.group({});
  }

  onTimeFieldChange(property: string, timeValue: string): void {
    // Get the value from the form control to ensure we have the latest value
    const formGroup = this._editingFormGroup();
    const formValue = formGroup?.get(property)?.value;
    const finalValue = formValue !== undefined ? formValue : timeValue;

    // Update editing data with the correct value
    this.setEditingValue(property, finalValue);
  }

  onDateFieldChange(property: string, dateValue: any): void {
    // Get the value from the form control to ensure we have the latest value
    const formGroup = this._editingFormGroup();
    const formValue = formGroup?.get(property)?.value;
    const finalValue = formValue !== undefined ? formValue : dateValue;

    // Update editing data with the correct value
    this.setEditingValue(property, finalValue);
  }

  /**
   * TrackBy function for mat-table rows
   * Uses unique ID field to help Angular properly identify and reuse row components
   * This prevents Angular from recreating rows unnecessarily and causing checkbox issues
   */
  trackByRowId(index: number, row: T): any {
    const idField = this.uniqueIdField();
    if (idField && row) {
      return row[idField];
    }
    return index;
  }


  private loadSummaryOption() {
    //this.selectedSummaryColumns.set(this.summaryColumns());
    const cols = this.summaryColumns();
    //const cols = this.selectedSummaryColumns();

    if (cols && cols.length > 0) {
      const options: Option[] = cols.map(col => ({
        key: col,
        value: this.formatColumnHeader(col)
      }));

      this._summaryOption.set(options);
    }
    else {
      this._summaryOption.set([]);
    }
  }

  private loadGroupOption() {
    //this.selectedGroupColumns.set(this.groupByColumns());
    //const groupCols = this.selectedGroupColumns();

    const groupCols = this.groupByColumns();

    if (groupCols && groupCols.length > 0) {
      const options: Option[] = groupCols.map(col => ({
        key: col,
        value: this.formatColumnHeader(col)
      }));

      this._groupByOption.set(options);
    }
    else {
      this._groupByOption.set([]);
    }
  }

  onSummaryChange(value: any[]) {
    const keysOnly = value.map(v => v.key ?? v);
    this._selectedSummaryColumns.set(keysOnly);
    console.log(this._selectedSummaryColumns());
  }

  onGroupChange(value: any[]) {
    const keysOnly = value.map(v => v.key ?? v);
    this._selectedGroupColumns.set(keysOnly);
    console.log(this._selectedGroupColumns());
  }

  private selectedGroupSummary() {
    // this._groupedSummary.set([]);
    // this._totalSummary.set({
    //   totalCount: 0,
    //   totals: {}
    // });

    const data = this._dataSource();
    const sumCols = this._selectedSummaryColumns();
    const groupCols = this._selectedGroupColumns();

    this._gridSummaryColumns.set(sumCols);
    this._gridGroupColumns.set(groupCols);

    // Reset if data or grouping not available
    if (!data.length || !groupCols.length) {
      this._groupedSummary.set([]);
      this._totalSummary.set({ totalCount: 0, totals: {} });
      return;
    }

    const groupedMap = new Map<string, any>();
    const totalTotals: Record<string, number> = {};
    sumCols.forEach(c => (totalTotals[c] = 0));
    let totalCount = 0;

    // GROUP + SUM
    data.forEach(row => {
      const key = groupCols.map(c => row[c] ?? '').join('|');
      if (!groupedMap.has(key)) {
        const newObj: any = {};
        groupCols.forEach(c => (newObj[c] = row[c]));
        sumCols.forEach(s => (newObj[s] = 0));
        newObj['count'] = 0;
        groupedMap.set(key, newObj);
      }

      const groupItem = groupedMap.get(key);
      groupItem['count'] += 1;
      totalCount++;

      // Add to group totals and overall totals
      sumCols.forEach(s => {
        const val = Number(row[s]) || 0;
        groupItem[s] += val;
        totalTotals[s] += val;
      });
    });

    // Set computed results
    this._groupedSummary.set(Array.from(groupedMap.values()));
    this._totalSummary.set({ totalCount, totals: totalTotals });

  }

  public allGroupSummary() {
    const data = this._dataSource();
    const groupCols = this.groupByColumns();
    const sumCols = this.summaryColumns();

    this._gridGroupColumns.set(groupCols);
    this._gridSummaryColumns.set(sumCols);

    // Reset if data or grouping not available
    if (!data.length || !groupCols.length) {
      this._groupedSummary.set([]);
      this._totalSummary.set({ totalCount: 0, totals: {} });
      return;
    }

    const groupedMap = new Map<string, any>();
    const totalTotals: Record<string, number> = {};
    sumCols.forEach(c => (totalTotals[c] = 0));
    let totalCount = 0;

    // GROUP + SUM
    data.forEach(row => {
      const key = groupCols.map(c => row[c]).join('|');
      if (!groupedMap.has(key)) {
        const newObj: any = {};
        groupCols.forEach(c => (newObj[c] = row[c]));
        sumCols.forEach(s => (newObj[s] = 0));
        newObj['count'] = 0;
        groupedMap.set(key, newObj);
      }

      const groupItem = groupedMap.get(key);
      groupItem['count'] += 1;
      totalCount++;

      // Add to group totals and overall totals
      sumCols.forEach(s => {
        const val = Number(row[s]) || 0;
        groupItem[s] += val;
        totalTotals[s] += val;
      });
    });

    // Set computed results
    this._groupedSummary.set(Array.from(groupedMap.values()));
    this._totalSummary.set({ totalCount, totals: totalTotals });
  }

  generateSelectedGroupSummary(): void {
    this.selectedGroupSummary();
  }
  // Returns all columns for mat-table including count
  getDisplayedColumnsWithCount(): string[] {
    return [...this.getDisplayedGroupColumns(), 'count'];
  }

  // Example: getDisplayedColumns() returns group + summary columns
  getDisplayedGroupColumns(): string[] {
    return [...this._gridGroupColumns(), ...this._gridSummaryColumns()];
  }
}
