import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { LoginComponent } from './login.component';
import { MeusPalpitesComponent } from './meus-palpites.component';
import { NotFoundComponent } from './not-found.component';
import { ResultadosComponent } from './resultados.component';
import { RodadasComponent } from './rodadas.component';
import { AdminComponent } from './admin.component';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rodadas',
    component: RodadasComponent,
    canActivate: [authGuard]
  },
  {
    path: 'meus-palpites',
    component: MeusPalpitesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'resultados',
    component: ResultadosComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
