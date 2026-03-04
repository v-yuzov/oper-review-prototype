import { Routes } from '@angular/router';
import { ReportFormComponent } from './pages/home/report-form/report-form.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  { path: 'unit/:id', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  {
    path: 'unit/:id/report/new',
    component: ReportFormComponent,
  },
  {
    path: 'unit/:id/report/:reportId',
    component: ReportFormComponent,
  },
  { path: '**', redirectTo: '' },
];
