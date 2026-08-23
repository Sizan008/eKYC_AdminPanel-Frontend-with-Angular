import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'product-id-list-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule],
  template: `
    <h2 mat-dialog-title>Existing Product IDs</h2>
    <mat-dialog-content>
      @if (productIds && productIds.length > 0) {
        <mat-list>
          @for (id of productIds; track id) {
            <mat-list-item (click)="selectId(id)" class="cursor-pointer hover-item">
              {{ id }}
            </mat-list-item>
          }
        </mat-list>
      } @else {
        <p class="text-center text-gray-500">No existing product IDs</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-list-item {
      font-size: 14px;
      padding: 8px 0;
    }
    .text-center {
      text-align: center;
    }
    .text-gray-500 {
      color: #9ca3af;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .hover-item:hover {
      background-color: #f3f4f6;
    }
  `]
})
export class ProductIdListDialogComponent {
  productIds = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ProductIdListDialogComponent>);

  selectId(id: string): void {
    this.dialogRef.close(id);
  }
}
