import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EditorComponent } from './editor/editor.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'edit', component: EditorComponent }
];
