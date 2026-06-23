import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast { id: number; text: string; kind: ToastKind; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(text: string, kind: ToastKind = 'info'): void {
    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  success(text: string): void { this.show(text, 'success'); }
  error(text: string): void { this.show(text, 'error'); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
