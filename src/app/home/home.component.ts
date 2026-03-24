import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'], // ✅ virgule ajoutée ici
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
  isLoginOpen = false;
  isRegisterOpen = false;

switchToRegister() {
  this.isLoginOpen = false; // Ferme le login
  setTimeout(() => {
    this.isRegisterOpen = true; // Ouvre le register après 300ms
  }, 300);
}
}