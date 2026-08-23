import { Component, input } from '@angular/core';

@Component({
  selector: 'admin-info-row',
  standalone: true,
  templateUrl: './admin-info-row.html',
  styleUrl: './admin-info-row.scss'
})
export class AdminInfoRow {
  readonly label = input.required<string>();
  readonly value = input<string | number | null | undefined>('-');
}