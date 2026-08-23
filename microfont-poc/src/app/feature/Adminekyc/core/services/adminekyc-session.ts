import { Injectable, signal } from '@angular/core';

import { ADMINEKYC_STORAGE_KEYS } from '../constants/adminekyc-api.constants';
import { AdminUser } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminekycSession {
  readonly currentAdmin = signal<AdminUser | null>(this.readCurrentAdmin());

  setCurrentAdmin(admin: AdminUser): void {
    const safeAdmin: AdminUser = {
      ...admin,
      adminPassword: undefined
    };

    sessionStorage.setItem(
      ADMINEKYC_STORAGE_KEYS.currentAdmin,
      JSON.stringify(safeAdmin)
    );

    this.currentAdmin.set(safeAdmin);
  }

  clear(): void {
    sessionStorage.removeItem(ADMINEKYC_STORAGE_KEYS.currentAdmin);
    this.currentAdmin.set(null);
  }

  hasCurrentAdmin(): boolean {
    return this.currentAdmin() !== null;
  }

  private readCurrentAdmin(): AdminUser | null {
    const rawAdmin = sessionStorage.getItem(
      ADMINEKYC_STORAGE_KEYS.currentAdmin
    );

    if (!rawAdmin) {
      return null;
    }

    try {
      return JSON.parse(rawAdmin) as AdminUser;
    } catch {
      sessionStorage.removeItem(ADMINEKYC_STORAGE_KEYS.currentAdmin);
      return null;
    }
  }
}
