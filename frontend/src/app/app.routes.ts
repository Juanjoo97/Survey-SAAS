import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'create-survey',
    canActivate: [authGuard],
    loadComponent: () => import('./components/create-survey/create-survey').then(m => m.CreateSurveyComponent)
  },
  {
    path: 'edit-survey/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/edit-survey/edit-survey').then(m => m.EditSurveyComponent)
  },
  {
    path: 'preview-survey/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/preview-survey/preview-survey').then(m => m.PreviewSurveyComponent)
  },
  {
    path: 'survey/:id',
    loadComponent: () => import('./components/survey-response/survey-response').then(m => m.SurveyResponseComponent)
  },
  {
    path: 'dashboard/results/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/survey-results/survey-results').then(m => m.SurveyResultsComponent)
  },
  { path: '',   redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
