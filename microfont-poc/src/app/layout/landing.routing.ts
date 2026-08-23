import {Routes} from '@angular/router';
import { AlertExamplePage } from '../shared/common-components/test-component-page/alert-example-page/alert-example-page';
import {Home} from './home/home';
import { Dashboard } from './dashboard/dashboard';

export const landingRouting: Routes = [
  {path: '', redirectTo: 'dashboard', pathMatch: "full"},
  {path: 'dashboard', component: Dashboard},
  {path: 'home', component: Home},
  // {path: 'config/approval-items', component: ApprovalItems},
  {path: 'alert-example-page', component: AlertExamplePage}
];

