import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  
  constructor(private router: Router) {}

  onLogin() {
    if (this.username && this.password) {
      // Simulate successful login
      console.log('Login successful');
      this.router.navigate(['/verification']);
    } else {
      alert('Please enter username and password');
    }
  }
}
