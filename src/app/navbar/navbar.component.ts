import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'] // ⚠️ styleUrls (pluriel)
})
export class NavbarComponent {


  isLoginOpen = false;
  isRegisterOpen = false;


  switchToRegister() {
    this.isLoginOpen = false;
    setTimeout(() => {
      this.isRegisterOpen = true;
    }, 300);
  }

}