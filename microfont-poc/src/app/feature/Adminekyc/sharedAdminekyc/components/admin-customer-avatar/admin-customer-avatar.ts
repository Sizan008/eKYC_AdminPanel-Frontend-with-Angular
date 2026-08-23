import { Component, input } from '@angular/core';

@Component({
  selector: 'admin-customer-avatar',
  standalone: true,
  templateUrl: './admin-customer-avatar.html',
  styleUrl: './admin-customer-avatar.scss'
})
export class AdminCustomerAvatar {
  readonly imageUrl = input<string | null | undefined>(null);
  readonly altText = input<string>('Customer photo');
  readonly fallbackText = input<string>('No Photo');

  imageLoadFailed = false;

  onImageError(): void {
    this.imageLoadFailed = true;
  }

  hasValidImage(): boolean {
    return !!this.imageUrl() && !this.imageLoadFailed;
  }
}