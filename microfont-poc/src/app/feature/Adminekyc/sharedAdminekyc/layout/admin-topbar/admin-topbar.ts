import { Component, input, output } from '@angular/core';

@Component({
  selector: 'admin-topbar',
  standalone: true,
  templateUrl: './admin-topbar.html',
  styleUrl: './admin-topbar.scss'
})
export class AdminTopbar {
  readonly title = input<string>('Digital Onboarding');
  readonly username = input<string>('Digital Onboarding Admin');

  readonly menuClicked = output<void>();
  readonly userClicked = output<void>();

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onUserClick(): void {
    this.userClicked.emit();
  }
}