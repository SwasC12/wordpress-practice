import { Component, HostListener } from '@angular/core';

/** Floating "back to top" button — appears after scrolling down. Drop <app-back-to-top> on any page. */
@Component({
  selector: 'app-back-to-top',
  standalone: true,
  template: `
    @if (visible) {
      <button class="btt" (click)="up()" aria-label="Back to top">↑</button>
    }
  `,
  styles: [`
    .btt {
      position: fixed; right: 22px; bottom: 22px; z-index: 200;
      width: 46px; height: 46px; border-radius: 50%;
      background: #ff5722; color: #fff; border: none; cursor: pointer;
      font-size: 1.3rem; line-height: 1;
      box-shadow: 0 8px 24px rgba(0, 0, 0, .4);
      animation: rise .2s ease;
    }
    .btt:hover { background: #ff6b3d; }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  `]
})
export class BackToTopComponent {
  visible = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.visible = window.scrollY > 600;
  }

  up(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
