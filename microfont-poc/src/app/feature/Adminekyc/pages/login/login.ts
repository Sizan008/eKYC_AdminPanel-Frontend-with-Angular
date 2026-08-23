import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminekycApiError } from '../../core/models/adminekyc-api-response.model';

import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';
import { AdminSectionCard } from '../../sharedAdminekyc/components/admin-section-card/admin-section-card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GenericButton,
    InputTextBox,
    GenericModal,
    AdminSectionCard
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AdminekycAuth);

  readonly loginSuccess = output<void>();

  readonly isLoading = signal<boolean>(false);
  readonly showErrorModal = signal<boolean>(false);
  readonly errorMessage = signal<string>('Invalid username or password.');

  readonly loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Please enter username and password.');
      this.showErrorModal.set(true);
      return;
    }

    const username = this.loginForm.controls.username.value?.trim() ?? '';
    const password = this.loginForm.controls.password.value ?? '';

    this.isLoading.set(true);

    this.auth
      .login(username, password)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (admin) => {
          if (!admin) {
            this.errorMessage.set('Invalid username or password.');
            this.showErrorModal.set(true);
            return;
          }

          this.loginSuccess.emit();
        },
        error: (error: unknown) => {
          if (error instanceof AdminekycApiError) {
            this.errorMessage.set(
              error.apiMessage || 'Invalid username or password.'
            );
          } else {
            this.errorMessage.set('Unable to connect to admin server.');
          }

          this.showErrorModal.set(true);
        }
      });
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }
}