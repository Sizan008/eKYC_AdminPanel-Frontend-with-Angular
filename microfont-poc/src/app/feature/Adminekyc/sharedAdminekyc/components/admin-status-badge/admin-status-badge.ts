import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

export type AdminBadgeType =
  | 'authorized'
  | 'unauthorized'
  | 'incomplete'
  | 'matched'
  | 'mismatched'
  | 'pending'
  | 'declined'
  | 'default';

@Component({
  selector: 'admin-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './admin-status-badge.html',
  styleUrl: './admin-status-badge.scss'
})
export class AdminStatusBadge {
  readonly label = input<string>('');
  readonly type = input<AdminBadgeType>('default');
}
