import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { InputIdBox } from '../../../../shared/common-components/input-types/input-id-box/input-id-box';
import { GenericSwitch } from '../../../../shared/common-components/generic-component-type/generic-switch/generic-switch';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextArea } from '../../../../shared/common-components/input-types/input-text-area/input-text-area';
import { InputAmountInWord } from '../../../../shared/common-components/input-types/input-amount-in-word/input-amount-in-word';
import { InputTagComponent } from '../../../../shared/common-components/input-types/input-tag/input-tag';
import { InputSelectOptionField } from '../../../../shared/common-components/input-types/input-select-option-field/input-select-option-field';
import { InputDate } from '../../../../shared/common-components/input-types/input-date/input-date';
import { GenericMultiInputSelectOption } from '../../../../shared/common-components/generic-component-type/generic-multi-select-option/generic-multi-select-option';
import { InputFile } from '../../../../shared/common-components/input-types/input-file/input-file';
import { InputOfficeBox } from '../../../../shared/common-components/input-types/input-office-box/input-office-box';
import { GenericDataGrid } from '../../../../shared/common-components/generic-component-type/generic-data-grid/generic-data-grid';
import { InputNumber } from '../../../../shared/common-components/input-types/input-number/input-number';
import { InputAmount } from '../../../../shared/common-components/input-types/input-amount/input-amount';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';
import { CommonQuillEditorComponent } from '../../../../shared/common-components/common-quill-editor/common-quill-editor';
import { ExpansionPanelHeader } from '../../../../shared/common-components/expansion-panel-header/expansion-panel-header';
import { ExpansionSubPanelHeader } from '../../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ExpansionSubSubPanelHeader } from '../../../../shared/common-components/expansion-sub-sub-panel-header/expansion-sub-sub-panel-header';
import { AlertExamplePage } from '../../../../shared/common-components/test-component-page/alert-example-page/alert-example-page';
import {
  DynamicTableComponent,
  DynamicTableConfig
} from '../../../../shared/common-components/generic-component-type/generic-table/generic-table';
import { Label } from '../../../../shared/common-components/generic-component-type/generic-label/generic-label';
import { InputTime } from '../../../../shared/common-components/input-types/input-time/input-time';
import { InputAddressSearch } from '../../../../shared/common-components/input-types/input-address-search/input-address-search';
import { FilePreviewCardComponent } from '../../../../shared/common-components/file-preview/file-preview-card.component';
import { MonthYearPickerComponent } from '../../../../shared/common-components/input-types/month-year-picker/month-year-picker';
import { FilePreviewData } from '../../../../shared/common-components/file-preview/file-preview.component';
import { ApiService } from '../../services/api.service';
import { StockCreateDTO, Stock, StockUpdateDTO } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';
import { WarehouseAddressSearchComponent } from './warehouse-address-search.component';
import { ProductIdListDialogComponent } from './product-id-list.dialog';

interface Option {
  key: any;
  value: string;
}

@Component({
  selector: 'app-add-stock',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    InputTextBox,
    InputIdBox,
    GenericSwitch,
    GenericButton,
    InputTextArea,
    InputAmountInWord,
    InputTagComponent,
    InputSelectOptionField,
    InputDate,
    GenericMultiInputSelectOption,
    InputFile,
    InputOfficeBox,
    GenericDataGrid,
    InputNumber,
    InputAmount,
    GenericModal,
    CommonQuillEditorComponent,
    ExpansionPanelHeader,
    ExpansionSubPanelHeader,
    ExpansionSubSubPanelHeader,
    AlertExamplePage,
    DynamicTableComponent,
    Label,
    InputTime,
    InputAddressSearch,
    FilePreviewCardComponent,
    MonthYearPickerComponent,
    WarehouseAddressSearchComponent,
    ProductIdListDialogComponent
  ],
  templateUrl: './add-stock.html',
  styleUrl: './add-stock.scss'
})
export class AddStock implements OnInit {
  frmGroup!: FormGroup;
  isOpenSignal = signal(true);
  primaryPanelOpen = signal(true);
  pricingPanelOpen = signal(true);
  logisticsPanelOpen = signal(true);
  specialPanelOpen = signal(true);
  attachmentsPanelOpen = signal(true);
  stockPreviewPanelOpen = signal(true);
  recentStockPanelOpen = signal(true);
  attachmentPreview: FilePreviewData | null = null;

  categoryOptions: Option[] = [
    { key: 'electronics', value: 'Electronics' },
    { key: 'pharma', value: 'Pharma' },
    { key: 'fashion', value: 'Fashion' },
    { key: 'grocery', value: 'Grocery' },
    { key: 'accessories', value: 'Accessories' }
  ];

  recentStockItems: Partial<Stock>[] = [];

  summaryTableConfig: DynamicTableConfig = {
    sections: [
      {
        title: 'Stock snapshot',
        rows: []
      }
    ]
  };

  constructor(private fb: FormBuilder, private router: Router, private api: ApiService, private stockService: StockService, private dialog: MatDialog) {
    this.initializeForm();
    this.loadInitialStocks();
  }

  ngOnInit(): void {
    this.loadInitialStocks();
  }

  private loadInitialStocks(): void {
    this.api.getStocks().subscribe({
      next: (stocks) => {
        this.recentStockItems = stocks;
        console.log('Loaded stocks from server:', stocks);
      },
      error: (err) => {
        console.warn('Failed to load initial stocks from server:', err);
        this.recentStockItems = [];
      }
    });
  }

  private initializeForm(): void {
    this.frmGroup = this.fb.group({
      productId: ['', Validators.required],
      productName: ['', [Validators.required, Validators.minLength(2)]],
      brand: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      pricePerItem: [0, [Validators.required, Validators.min(0.01)]],
      totalValue: [{ value: 0, disabled: true }],
      expiryDate: ['', Validators.required],
      manufactureMonthYear: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      warehouseAddress: [''],
      warehouseOffice: [''],
      tags: [[]],
      description: [''],
      notes: [''],
      active: [true],
      attachments: [null]
    });

    this.updateSummaryConfig();

    this.frmGroup.valueChanges.subscribe(() => {
      const quantity = Number(this.frmGroup.get('quantity')?.value) || 0;
      const pricePerItem = Number(this.frmGroup.get('pricePerItem')?.value) || 0;
      const total = quantity * pricePerItem;
      this.frmGroup.get('totalValue')?.setValue(total, { emitEvent: false });
      this.updateSummaryConfig();
    });
  }

  updateSummaryConfig(): void {
    const value = this.frmGroup.getRawValue();
    this.summaryTableConfig = {
      sections: [
        {
          title: 'Stock snapshot',
          rows: [
            {
              cells: [
                { label: 'Product ID', value: value.productId },
                { label: 'Product Name', value: value.productName }
              ]
            },
            {
              cells: [
                { label: 'Brand', value: value.brand },
                { label: 'Category', value: this.categoryOptions.find(opt => opt.key === value.category)?.value || '-' }
              ]
            },
            {
              cells: [
                { label: 'Quantity', value: value.quantity },
                { label: 'Unit Price', value: value.pricePerItem }
              ]
            },
            {
              cells: [
                { label: 'Total Value', value: value.totalValue },
                { label: 'Status', value: value.active ? 'Active' : 'Inactive' }
              ]
            }
          ]
        }
      ]
    };
  }

  onSelectedFilesChanged(files: File[]): void {
    if (!files || files.length === 0) {
      this.attachmentPreview = null;
      return;
    }

    this.attachmentPreview = {
      fileName: files[0].name,
      mimeType: files[0].type,
      fileSize: files[0].size,
      data: files[0]
    };
  }

  addStock(): void {
    if (this.frmGroup.invalid) {
      this.frmGroup.markAllAsTouched();
      return;
    }

    const productId = this.frmGroup.get('productId')?.value;
    const existingStock = this.recentStockItems.find(item => item.productId === productId);
    const isExistingProduct = !!existingStock;

    const stockItem = {
      productId: productId,
      productName: this.frmGroup.get('productName')?.value,
      brand: this.frmGroup.get('brand')?.value,
      category: this.categoryOptions.find(opt => opt.key === this.frmGroup.get('category')?.value)?.value || '',
      quantity: this.frmGroup.get('quantity')?.value,
      pricePerItem: this.frmGroup.get('pricePerItem')?.value,
      active: this.frmGroup.get('active')?.value
    };

    const payload: StockCreateDTO = {
      productId: stockItem.productId,
      productName: stockItem.productName,
      brand: stockItem.brand,
      category: stockItem.category,
      quantity: stockItem.quantity,
      pricePerItem: stockItem.pricePerItem,
      active: stockItem.active
    };

    // If it's existing product, update the stock (add to quantity)
    if (isExistingProduct && existingStock?.id) {
      // Update existing stock entry
      const updatePayload: StockUpdateDTO = {
        id: existingStock.id,
        quantity: (existingStock.quantity || 0) + stockItem.quantity
      };
      this.api.updateStock(existingStock.id, updatePayload).subscribe({
        next: (res) => {
          // update shared stock state and local preview
          this.stockService.addStock(res);
          this.recentStockItems = this.recentStockItems.map(item => item.id === res.id ? res : item);
          console.log('Stock updated on server', res);
          // reset form immediately after list updates
          this.resetForm();
          // delay navigation to let user see the preview table update
          setTimeout(() => {
            this.router.navigate(['/stock']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to update stock', err);
        }
      });
    } else {
      // Create new stock entry
      this.api.createStock(payload).subscribe({
        next: (res) => {
          // update shared stock state and local preview
          this.stockService.addStock(res);
          this.recentStockItems = [res, ...this.recentStockItems];
          console.log('Stock saved to server', res);
          // reset form immediately after list updates
          this.resetForm();
          // delay navigation to let user see the preview table update
          setTimeout(() => {
            this.router.navigate(['/stock']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to save stock', err);
          // still update UI locally so user sees the item
          this.recentStockItems = [stockItem, ...this.recentStockItems];
        }
      });
    }
  }

  resetForm(): void {
    this.frmGroup.reset({
      productId: '',
      productName: '',
      brand: '',
      category: '',
      quantity: 1,
      pricePerItem: 0,
      totalValue: { value: 0, disabled: true },
      expiryDate: '',
      manufactureMonthYear: '',
      arrivalTime: '',
      warehouseAddress: '',
      warehouseOffice: '',
      tags: [],
      description: '',
      notes: '',
      active: true,
      attachments: null
    });
    this.attachmentPreview = null;
    this.updateSummaryConfig();
  }

  generateProductId(): void {
    // Get all existing product IDs
    const productIds = this.recentStockItems
      .map(item => item.productId)
      .filter((id): id is string => !!id);

    // Open dialog to show existing IDs
    const dialogRef = this.dialog.open(ProductIdListDialogComponent, {
      width: '400px',
      data: productIds
    });

    // Handle selected ID
    dialogRef.afterClosed().subscribe(selectedId => {
      if (selectedId) {
        this.populateFromExistingStock(selectedId);
      }
    });
  }

  private populateFromExistingStock(productId: string): void {
    const existingStock = this.recentStockItems.find(item => item.productId === productId);
    if (existingStock) {
      this.frmGroup.patchValue({
        productId: existingStock.productId,
        productName: existingStock.productName,
        brand: existingStock.brand,
        category: existingStock.category ? this.categoryOptions.find(opt => opt.value === existingStock.category)?.key : '',
        quantity: 1,
        pricePerItem: existingStock.pricePerItem
      });
      console.log('Form populated from existing stock:', existingStock);
    }
  }
}
