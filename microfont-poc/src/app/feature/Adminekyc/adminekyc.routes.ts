import { Routes } from '@angular/router';
import { AdminekycShell } from './adminekyc-shell/adminekyc-shell';

export const adminekycRoutes: Routes = [

  //To run Admin panel drectly- new
  {
    path: '',
    redirectTo: 'onboardingAdmineKYC',
    pathMatch: 'full'
  },

  //Old Admin panel route
  {
    path: 'onboardingAdmineKYC',
    component: AdminekycShell
  }
];