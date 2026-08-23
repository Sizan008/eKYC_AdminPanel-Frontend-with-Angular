import { Component, input, output } from '@angular/core';

export type AdminSummaryCardType =
  | 'total'
  | 'authorized'
  | 'unauthorized'
  | 'incomplete';

@Component({
  selector: 'admin-summary-card',
  standalone: true,
  templateUrl: './admin-summary-card.html',
  styleUrl: './admin-summary-card.scss'
})
export class AdminSummaryCard {
  readonly title = input.required<string>();
  readonly value = input.required<number>();
  readonly icon = input<string>('👥');
  readonly type = input<AdminSummaryCardType>('total');
  readonly clickable = input<boolean>(true);

  readonly cardClicked = output<void>();

  onCardClick(): void {
    if (!this.clickable()) {
      return;
    }

    this.cardClicked.emit();
  }
}