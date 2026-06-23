import { Component, Input } from '@angular/core';

/** Reusable loading spinner. Usage: <app-spinner label="Loading stories…"></app-spinner> */
@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="wrap">
      <span class="ring"></span>
      @if (label) { <span class="label">{{ label }}</span> }
    </div>
  `,
  styles: [`
    .wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 0; }
    .ring {
      width: 38px; height: 38px; border-radius: 50%;
      border: 3px solid rgba(255, 87, 34, .22);
      border-top-color: #ff5722;
      animation: spin .8s linear infinite;
    }
    .label { color: #9aa0ab; font-size: .95rem; font-family: "Inter", system-ui, sans-serif; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SpinnerComponent {
  @Input() label = '';
}
