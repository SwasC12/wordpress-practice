import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/** Global toast host. Mount once (in AppComponent): <app-toast></app-toast> */
@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-wrap">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.success]="t.kind === 'success'" [class.error]="t.kind === 'error'"
             (click)="toast.dismiss(t.id)">
          <span class="icon">{{ t.kind === 'success' ? '✓' : t.kind === 'error' ? '✕' : 'ℹ' }}</span>
          <span class="text">{{ t.text }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrap {
      position: fixed; right: 20px; bottom: 20px; z-index: 2000;
      display: flex; flex-direction: column; gap: 10px; max-width: 340px;
      font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      background: #1d2027; color: #e7e9ee; border: 1px solid #262a32;
      border-left: 3px solid #9aa0ab;
      border-radius: 10px; padding: 12px 14px; cursor: pointer;
      box-shadow: 0 10px 30px rgba(0, 0, 0, .4);
      animation: slide .2s ease;
    }
    .toast.success { border-left-color: #34d399; }
    .toast.error { border-left-color: #e5484d; }
    .icon {
      flex: 0 0 auto; width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 700; background: rgba(154,160,171,.2);
    }
    .toast.success .icon { background: rgba(52,211,153,.2); color: #34d399; }
    .toast.error .icon { background: rgba(229,72,77,.2); color: #ff7a7e; }
    .text { font-size: .9rem; line-height: 1.4; }
    @keyframes slide { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
}
