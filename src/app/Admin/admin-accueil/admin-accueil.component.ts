import { Component } from '@angular/core';
import { AdminAuthService } from '../auth/admin-auth.service';

@Component({
  selector: 'app-admin-accueil',
  templateUrl: './admin-accueil.component.html',
  styleUrl: './admin-accueil.component.scss',
})
export class AdminAccueilComponent {
  greeting = '';

  constructor(private auth: AdminAuthService) {
    const h = new Date().getHours();
    this.greeting = h >= 5 && h < 18 ? 'Bonjour' : 'Bonsoir';
  }

  displayName(): string {
    return this.auth.getDisplayName();
  }
}
