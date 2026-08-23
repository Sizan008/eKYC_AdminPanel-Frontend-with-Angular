import { Routes } from '@angular/router';
import { AddStock } from './pages/add-stock/add-stock';
import { UpdateStock } from './pages/update-stock/update-stock';

export const STOCK_ROUTES: Routes = [

  {
    path: 'add-stock',
    component: AddStock
  },

  {
    path: 'update-stock',
    component: UpdateStock
  }
];