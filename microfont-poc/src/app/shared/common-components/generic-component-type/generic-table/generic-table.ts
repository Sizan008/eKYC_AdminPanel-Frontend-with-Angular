// dynamic-table.component.ts
import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Cell configuration for table
 */
export interface TableCell {
  label?: string;           // Label text (for label cells)
  value?: any;              // Value to display (for value cells)
  colspan?: number;         // Number of columns to span
  rowspan?: number;         // Number of rows to span
  type?: 'label' | 'value'; // Cell type
  highlighted?: boolean;    // Apply highlight style
  className?: string;       // Custom CSS class
  width?: string;          // Custom width (e.g., '25%', '200px')
  style?: Record<string, string>; // Inline styles for direct CSS
}

/**
 * Row configuration - array of cells
 */
export interface TableRow {
  cells: TableCell[];
  className?: string;       // Custom row class
}

/**
 * Section configuration - contains multiple rows
 */
export interface TableSection {
  title: string;            // Section header title
  rows: TableRow[];         // Array of rows
  headerClass?: string;     // Custom header class
}

/**
 * Complete table configuration
 */
export interface DynamicTableConfig {
  sections: TableSection[];
  loading?: boolean;
  error?: string | null;
}

@Component({
  selector: 'generic-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-table.html',
  styleUrls: ['./generic-table.scss']
})
export class DynamicTableComponent implements OnInit {

  // Inputs
  @Input() config: DynamicTableConfig | null = null;
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() customTitle?: string;
  @Input() customSubtitle?: string;

  // Signals
  tableConfig: WritableSignal<DynamicTableConfig | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);
  errorMessage: WritableSignal<string | null> = signal(null);
  currentTime: WritableSignal<Date> = signal(new Date());

  ngOnInit(): void {
    if (this.config) {
      this.tableConfig.set(this.config);
      this.isLoading.set(this.config.loading || false);
      this.errorMessage.set(this.config.error || null);
    }
  }

  /**
   * Update configuration from parent
   */
  updateConfig(config: DynamicTableConfig): void {
    this.tableConfig.set(config);
    this.isLoading.set(config.loading || false);
    this.errorMessage.set(config.error || null);
    this.currentTime.set(new Date());
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Get cell width class
   */
  getCellWidth(cell: TableCell): string {
    if (cell.width) {
      return '';
    }
    if (cell.colspan && cell.colspan > 1) {
      return '';
    }
    return 'w-1/4';
  }

  /**
   * Get cell type class
   */
  getCellClass(cell: TableCell): string {
    const classes: string[] = [];

    // Base classes
    classes.push('p-3', 'text-sm', 'border-r', 'border-slate-200');

    // Type-specific classes
    if (cell.type === 'label' || cell.label !== undefined) {
      classes.push('font-semibold', 'text-slate-700');
    } else {
      classes.push('text-slate-900', 'font-medium');
    }

    // Width class
    const widthClass = this.getCellWidth(cell);
    if (widthClass) {
      classes.push(widthClass);
    }

    // Custom class
    if (cell.className) {
      classes.push(cell.className);
    }

    return classes.join(' ');
  }

  /**
   * Get row class
   */
  getRowClass(row: TableRow, hasHighlightedCell: boolean): string {
    const classes: string[] = [
      'border-b',
      'border-slate-200',
      'hover:bg-slate-50',
      'transition-all',
      'duration-200'
    ];

    if (hasHighlightedCell) {
      classes.push('bg-blue-50');
    } else {
      classes.push('bg-white');
    }

    if (row.className) {
      classes.push(row.className);
    }

    return classes.join(' ');
  }

  /**
   * Check if row has highlighted cell
   */
  hasHighlightedCell(row: TableRow): boolean {
    return row.cells.some(cell => cell.highlighted);
  }

  /**
   * Display cell value
   */
  displayValue(cell: TableCell): string {
    if (cell.label !== undefined) {
      return cell.label;
    }
    if (cell.value !== undefined && cell.value !== null && cell.value !== '') {
      return cell.value.toString();
    }
    return '-';
  }

}
