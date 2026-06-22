import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  busy = false;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit(): Promise<void> {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Enter your email and password.';
      return;
    }
    this.busy = true;
    const res = await this.supabase.signIn(this.email.trim(), this.password);
    this.busy = false;
    if (res.ok) {
      this.router.navigate(['/admin']);
    } else {
      this.error = res.message;
    }
  }
}
