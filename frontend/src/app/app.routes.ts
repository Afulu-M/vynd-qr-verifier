import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { VerificationComponent } from './components/verification/verification.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verification', component: VerificationComponent },
  { path: '**', redirectTo: '/login' }
];
