import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService, PostRecord, NamedRow } from '../supabase.service';
import { CloudinaryService } from '../cloudinary.service';

type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  gradient: string;
  cover_url: string;
  read_time: string;
  category_id: string;
  author_id: string;
  published: boolean;
};

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #0f172a, #2563eb)',
  'linear-gradient(135deg, #7c2d12, #f59e0b)',
  'linear-gradient(135deg, #7f1d1d, #ef4444)',
  'linear-gradient(135deg, #064e3b, #34d399)',
  'linear-gradient(135deg, #155e75, #22d3ee)',
  'linear-gradient(135deg, #4c1d95, #a78bfa)'
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  userEmail = '';
  posts: PostRecord[] = [];
  categories: NamedRow[] = [];
  authors: NamedRow[] = [];
  gradients = GRADIENT_PRESETS;

  loading = true;
  saving = false;
  uploading = false;
  message = '';
  editingId: string | null = null;

  form: PostForm = this.blankForm();

  constructor(
    private supabase: SupabaseService,
    private cloudinary: CloudinaryService,
    private router: Router
  ) {}

  coverIsVideo(url: string): boolean {
    return CloudinaryService.isVideo(url);
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.message = '';
    this.uploading = true;
    try {
      const result = await this.cloudinary.upload(file);
      this.form.cover_url = result.url;
    } catch (err: any) {
      this.message = err?.message ?? 'Upload failed.';
    } finally {
      this.uploading = false;
      input.value = ''; // allow re-selecting the same file
    }
  }

  async ngOnInit(): Promise<void> {
    this.userEmail = (await this.supabase.currentUserEmail()) ?? '';
    await this.refresh();
    [this.categories, this.authors] = await Promise.all([
      this.supabase.getCategories(),
      this.supabase.getAuthors()
    ]);
    this.loading = false;
  }

  async refresh(): Promise<void> {
    this.posts = await this.supabase.getAllPosts();
  }

  blankForm(): PostForm {
    return {
      title: '', slug: '', excerpt: '', body: '',
      gradient: GRADIENT_PRESETS[0], cover_url: '', read_time: '',
      category_id: '', author_id: '', published: true
    };
  }

  /** Auto-suggest a slug from the title while typing a new post. */
  onTitleChange(): void {
    if (this.editingId) return; // don't overwrite slug when editing existing
    this.form.slug = this.form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  startNew(): void {
    this.editingId = null;
    this.form = this.blankForm();
    this.message = '';
  }

  editPost(p: PostRecord): void {
    this.editingId = p.id;
    this.message = '';
    this.form = {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      body: p.body ?? '',
      gradient: p.gradient ?? GRADIENT_PRESETS[0],
      cover_url: p.cover_url ?? '',
      read_time: p.read_time ?? '',
      category_id: p.category_id ?? '',
      author_id: p.author_id ?? '',
      published: p.published
    };
  }

  async save(): Promise<void> {
    this.message = '';
    if (!this.form.title.trim() || !this.form.slug.trim()) {
      this.message = 'Title and slug are required.';
      return;
    }

    const payload: Partial<PostRecord> = {
      title: this.form.title.trim(),
      slug: this.form.slug.trim(),
      excerpt: this.form.excerpt.trim() || null,
      body: this.form.body.trim() || null,
      gradient: this.form.gradient || null,
      cover_url: this.form.cover_url || null,
      read_time: this.form.read_time.trim() || null,
      category_id: this.form.category_id || null,
      author_id: this.form.author_id || null,
      published: this.form.published
    };

    this.saving = true;
    const res = this.editingId
      ? await this.supabase.updatePost(this.editingId, payload)
      : await this.supabase.createPost(payload);
    this.saving = false;

    this.message = res.message;
    if (res.ok) {
      await this.refresh();
      this.startNew();
    }
  }

  async remove(p: PostRecord): Promise<void> {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const res = await this.supabase.deletePost(p.id);
    this.message = res.message;
    if (res.ok) {
      if (this.editingId === p.id) this.startNew();
      await this.refresh();
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
