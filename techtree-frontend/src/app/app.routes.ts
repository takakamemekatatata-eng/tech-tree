import { Routes } from '@angular/router';
import { AppComponent } from './app';
import { NodeSelectionComponent } from './features/node-selection/node-selection.component';

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'selection', component: NodeSelectionComponent },
  { path: '**', redirectTo: '' }
];
