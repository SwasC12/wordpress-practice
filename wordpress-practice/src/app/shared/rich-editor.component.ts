import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges,
  Output, SimpleChanges, ViewChild, inject
} from '@angular/core';
import { CloudinaryService } from '../cloudinary.service';
import { ToastService } from './toast.service';

/**
 * Simple WYSIWYG editor (bold/italic/heading/list/link + inline Cloudinary images).
 * Two-way bound HTML: <app-rich-editor [(value)]="form.body"></app-rich-editor>
 */
@Component({
  selector: 'app-rich-editor',
  standalone: true,
  template: `
    <div class="rt">
      <div class="toolbar">
        <button type="button" title="Bold" (mousedown)="$event.preventDefault()" (click)="cmd('bold')"><b>B</b></button>
        <button type="button" title="Italic" (mousedown)="$event.preventDefault()" (click)="cmd('italic')"><i>I</i></button>
        <button type="button" title="Heading" (mousedown)="$event.preventDefault()" (click)="heading()">H</button>
        <button type="button" title="Bulleted list" (mousedown)="$event.preventDefault()" (click)="cmd('insertUnorderedList')">• List</button>
        <button type="button" title="Add link" (mousedown)="$event.preventDefault()" (click)="addLink()">🔗</button>
        <button type="button" title="Insert image" (mousedown)="$event.preventDefault()" (click)="fileInput.click()">🖼 Image</button>
        <button type="button" title="Remove selected image" (mousedown)="$event.preventDefault()" (click)="removeImage()">🗑 Image</button>
        @if (uploading) { <span class="up">Uploading…</span> }
        <input #fileInput type="file" accept="image/*" hidden (change)="onImage($event)" />
      </div>
      <div #editor class="editor" contenteditable="true" (input)="emit()" (blur)="emit()" (click)="onEditorClick($event)"></div>
      <p class="hint">Tip: click an image to select it, then press Delete or the 🗑 button to remove it.</p>
    </div>
  `,
  styles: [`
    .rt { border: 1px solid #262a32; border-radius: 10px; overflow: hidden; background: #0c0d10; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; border-bottom: 1px solid #262a32; background: #15171c; }
    .toolbar button {
      background: #1d2027; color: #e7e9ee; border: 1px solid #262a32; border-radius: 7px;
      padding: 5px 10px; cursor: pointer; font: inherit; font-size: .85rem; line-height: 1;
    }
    .toolbar button:hover { border-color: #ff5722; color: #ff5722; }
    .up { color: #ffa726; font-size: .82rem; align-self: center; margin-left: 4px; }
    .editor {
      min-height: 340px; padding: 18px; color: #e7e9ee; outline: none;
      font: inherit; font-size: 1.02rem; line-height: 1.7;
    }
    .editor:empty:before { content: 'Write your article…'; color: #6b7280; }
    .editor img { max-width: 100%; border-radius: 8px; margin: 8px 0; cursor: pointer; }
    .editor h3 { font-size: 1.3rem; margin: 18px 0 10px; }
    .editor p { margin: 0 0 14px; }
    .editor ul, .editor ol { margin: 0 0 14px; padding-left: 22px; }
    .editor a { color: #ff7a4d; }
    .hint { margin: 8px 2px 0; font-size: .78rem; color: #6b7280; }
  `]
})
export class RichEditorComponent implements AfterViewInit, OnChanges {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;

  uploading = false;
  private selectedImg: HTMLImageElement | null = null;
  private cloud = inject(CloudinaryService);
  private toast = inject(ToastService);

  ngAfterViewInit(): void {
    this.editorRef.nativeElement.innerHTML = this.value || '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Sync external value changes (e.g. editing a post / resetting form),
    // but never while the user is actively typing (would reset the cursor).
    if (changes['value'] && this.editorRef) {
      const el = this.editorRef.nativeElement;
      if (document.activeElement !== el && el.innerHTML !== (this.value || '')) {
        el.innerHTML = this.value || '';
      }
    }
  }

  emit(): void {
    this.valueChange.emit(this.editorRef.nativeElement.innerHTML);
  }

  /** Click an image to select it (native highlight) so Delete or the 🗑 button removes it. */
  onEditorClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      this.selectedImg = target as HTMLImageElement;
      const range = document.createRange();
      range.selectNode(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else {
      this.selectedImg = null;
    }
  }

  removeImage(): void {
    if (!this.selectedImg) {
      this.toast.error('Click an image first, then remove it.');
      return;
    }
    this.selectedImg.remove();
    this.selectedImg = null;
    this.emit();
  }

  cmd(command: string): void {
    document.execCommand(command, false);
    this.emit();
  }

  heading(): void {
    document.execCommand('formatBlock', false, 'h3');
    this.emit();
  }

  addLink(): void {
    const url = prompt('Link URL:');
    if (url) document.execCommand('createLink', false, url);
    this.emit();
  }

  async onImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    try {
      const res = await this.cloud.upload(file);
      this.editorRef.nativeElement.focus();
      document.execCommand('insertHTML', false, `<img src="${res.url}" alt="" />`);
      this.emit();
    } catch (err: any) {
      this.toast.error(err?.message ?? 'Image upload failed.');
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }
}
