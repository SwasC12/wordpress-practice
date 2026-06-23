import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Reusable confirmation modal. Mount it with *ngIf when you need it:
 *
 *   <app-delete-confirmation
 *     *ngIf="pending"
 *     [title]="'Delete post?'"
 *     [message]="'This cannot be undone.'"
 *     [busy]="deleting"
 *     (confirmed)="doDelete()"
 *     (cancelled)="pending = null">
 *   </app-delete-confirmation>
 */
@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  template: `
    <div class="overlay" (click)="onBackdrop($event)">
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="icon">⚠️</div>
        <h3 class="title">{{ title }}</h3>
        <p class="message">{{ message }}</p>
        <div class="actions">
          <button class="btn cancel" (click)="cancelled.emit()" [disabled]="busy">{{ cancelText }}</button>
          <button class="btn danger" (click)="confirmed.emit()" [disabled]="busy">
            {{ busy ? 'Deleting…' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0, 0, 0, .6); backdrop-filter: blur(3px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: fade .15s ease;
    }
    .dialog {
      width: 100%; max-width: 380px;
      background: #15171c; border: 1px solid #262a32; border-radius: 16px;
      padding: 28px 26px; text-align: center;
      color: #e7e9ee; font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .5);
      animation: pop .18s ease;
    }
    .icon { font-size: 2rem; margin-bottom: 8px; }
    .title { margin: 0 0 8px; font-size: 1.25rem; }
    .message { margin: 0 0 22px; color: #9aa0ab; font-size: .95rem; line-height: 1.5; }
    .actions { display: flex; gap: 10px; }
    .btn {
      flex: 1; font: inherit; font-weight: 600; border-radius: 10px;
      padding: 11px 16px; cursor: pointer; border: 1px solid transparent;
    }
    .btn:disabled { opacity: .6; cursor: default; }
    .cancel { background: transparent; color: #e7e9ee; border-color: #262a32; }
    .cancel:hover:not(:disabled) { border-color: #3a414d; }
    .danger { background: #e5484d; color: #fff; }
    .danger:hover:not(:disabled) { background: #f05a5f; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
  `]
})
export class DeleteConfirmationComponent {
  @Input() title = 'Delete item?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmText = 'Delete';
  @Input() cancelText = 'Cancel';
  @Input() busy = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  /** Clicking the dark backdrop (not the dialog) cancels. */
  onBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay') && !this.busy) {
      this.cancelled.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.busy) this.cancelled.emit();
  }
}
