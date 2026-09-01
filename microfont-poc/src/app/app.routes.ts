import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Landing } from './layout/landing/landing';
import { AllComponentsPage } from './shared/common-components/test-component-page/all-components-page/all-components-page';
import { STOCK_ROUTES } from './feature/stock/stock.routes';
import { adminekycRoutes } from './feature/Adminekyc/adminekyc.routes';
export const routes: Routes = [

//   { path: '', redirectTo: 'landing/home', pathMatch: 'full' },
//   // { path: 'login', component: Landing },
//   {path:'', component: Layout,
//     children:[{path:'mx/components', component: AllComponentsPage}]
//    },
//   {
//     path: 'landing', component: Layout,
//     data: {
//       layout: 'empty'
//     },
//     children: [
//       { path: '', loadChildren: () => import('./layout/landing.routing').then(m => m.landingRouting) },
//     ]
//   },
//   {
//     path: '', component: Layout,
//     data: {
//       layout: 'empty'
//     },
//     children: [
//       { path: 'dashboard', loadChildren: () => import('./layout/landing.routing').then(m => m.landingRouting) },
//       { path: 'poc', loadChildren: () => import('./shared/features/approval/poc.routing').then(m => m.PocRouting) },
//      // { path: 'gl', loadChildren: () => import('./modules/finbook/finbook-routing').then(m => m.FinBookRouting) },
//     ]
//   },
//   {path: '', redirectTo: 'usernote', pathMatch: 'full'},
//   {
//     path: 'poc', component: Layout,
//     data: {
//       layout: 'empty'
//     },
//     children: [
//       {
//         path: '',
//         loadChildren: () => import('./shared/features/approval/poc.routing').then(m => m.PocRouting)
//       },
//     ]
//   },
//   {
//     path: 'feature', component: Layout,
//     data: {
//       layout: 'empty'
//     },
//     children: [
//       { path: '', loadChildren: () => import('./shared/features/feature.routing').then(m => m.featureRoutes) },
//     ]
//   },
//   {
//     path: 'rpt', component: Layout,
//     data: {
//       layout: 'empty'
//     },
//     children: [
//       { path: '', loadChildren: () => import('./shared/features/report/report.routing').then(m => m.reportRoutes) },
//     ]
//   },
//  {
//     path: '', component: Layout,
//     data: {
//       layout: 'empty'
//     },
//     children: [
//       { path: '', loadChildren: () => import('./feature/stock/stock.routes').then(m => m.STOCK_ROUTES) },
//     ]
//   },
//   {
//   path: 'test',
//   loadChildren: () =>
//     import('./feature/test/test.routes').then((m) => m.testRoutes),
// },
  
    
    ...adminekycRoutes

];


// { path: 'dashboard', loadChildren: () => import('./modules/landing/landing.routing').then(m => m.landingRouting) },

