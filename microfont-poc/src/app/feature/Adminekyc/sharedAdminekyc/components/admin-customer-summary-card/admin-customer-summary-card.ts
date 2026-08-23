import { Component, input, output } from '@angular/core';

import { AdminCustomer } from '../../../core/models/admin-customer.model';

import { AdminStatusBadge } from '../admin-status-badge/admin-status-badge';
import { AdminInfoRow } from '../admin-info-row/admin-info-row';
import { AdminCustomerAvatar } from '../admin-customer-avatar/admin-customer-avatar';

@Component({
  selector: 'admin-customer-summary-card',
  standalone: true,
  imports: [
    AdminStatusBadge,
    AdminInfoRow,
    AdminCustomerAvatar
  ],
  templateUrl: './admin-customer-summary-card.html',
  styleUrl: './admin-customer-summary-card.scss'
})
export class AdminCustomerSummaryCard {
  readonly customer = input.required<AdminCustomer>();

  readonly detailsClicked = output<AdminCustomer>();

  onDetailsClick(): void {
    this.detailsClicked.emit(this.customer());
  }

  getCustomerPhoto(): string {
    return (
      this.customer().documents?.customerPhotoUrl ||
      this.customer().documents?.capturedPhotoUrl ||
      this.customer().documents?.nidPhotoUrl ||
      ''
    );
  }

  getFaceScore(): string {
    const score = this.customer().verification?.faceMatchScore;

    if (score === null || score === undefined) {
      return '-';
    }

    return String(score);
  }

  getAuthentication(): string {
    return this.customer().verification?.authentication || '-';
  }

  getMakeDate(): string {
    return this.customer().makeDate || this.customer().createdAt || '-';
  }
}