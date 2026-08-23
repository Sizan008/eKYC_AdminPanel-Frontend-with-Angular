import { Component, input } from '@angular/core';

@Component({
  selector: 'admin-section-card',
  standalone: true,
  imports: [],
  templateUrl: './admin-section-card.html',
  styleUrl: './admin-section-card.scss'
})
export class AdminSectionCard {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
}