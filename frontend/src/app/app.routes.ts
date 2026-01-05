import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CreateSurveyComponent } from './components/create-survey/create-survey';
import { EditSurveyComponent } from './components/edit-survey/edit-survey';
import { PreviewSurveyComponent } from './components/preview-survey/preview-survey';
import { SurveyResponseComponent } from './components/survey-response/survey-response';
import { SurveyResultsComponent } from './components/survey-results/survey-results';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [publicGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'create-survey', component: CreateSurveyComponent, canActivate: [authGuard] },
  { path: 'edit-survey/:id', component: EditSurveyComponent, canActivate: [authGuard] },
  { path: 'preview-survey/:id', component: PreviewSurveyComponent, canActivate: [authGuard] },
  { path: 'survey/:id', component: SurveyResponseComponent },
  { path: 'dashboard/results/:id', component: SurveyResultsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
