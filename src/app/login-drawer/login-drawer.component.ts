import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-login-drawer',
  templateUrl: './login-drawer.component.html',
  styleUrls: ['./login-drawer.component.scss']
})
export class LoginDrawerComponent {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();


  showPassword = false; 


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

 
  close(): void {
    this.closeDrawer.emit();
  }


  onSwitch(): void {
    this.switchToRegister.emit();
  }
}