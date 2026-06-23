import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService, PostRecord, EventRecord, SponsorRecord, NamedRow } from '../supabase.service';
import { CloudinaryService } from '../cloudinary.service';
import { DeleteConfirmationComponent } from '../components/delete-confirmation.component';
import { SpinnerComponent } from '../shared/spinner.component';

type PendingDelete = { title: string; message: string; action: () => Promise<void> };

type SponsorForm = {
  business_name: string;
  flyer_url: string;
  link_url: string;
  active: boolean;
  sort_order: number;
};

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

type EventForm = {
  name: string;
  event_date: string;
  location: string;
  blurb: string;
  body: string;
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
  imports: [CommonModule, FormsModule, RouterLink, DeleteConfirmationComponent, SpinnerComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  // Shared delete-confirmation modal state (posts, events, sponsors all use it)
  pendingDelete: PendingDelete | null = null;
  deleting = false;

  userEmail = '';
  posts: PostRecord[] = [];
  categories: NamedRow[] = [];
  authors: NamedRow[] = [];
  gradients = GRADIENT_PRESETS;

  activeTab: 'overview' | 'posts' | 'events' | 'sponsors' = 'overview';

  subscribers: { email: string; created_at: string }[] = [];

  loading = true;
  saving = false;
  uploading = false;
  message = '';
  editingId: string | null = null;

  form: PostForm = this.blankForm();

  // Events
  events: EventRecord[] = [];
  eventForm: EventForm = this.blankEventForm();
  editingEventId: string | null = null;
  savingEvent = false;
  eventMessage = '';

  // Sponsors
  sponsors: SponsorRecord[] = [];
  sponsorForm: SponsorForm = this.blankSponsorForm();
  editingSponsorId: string | null = null;
  savingSponsor = false;
  sponsorUploading = false;
  sponsorMessage = '';
  private sponsorDeleteToken: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private cloudinary: CloudinaryService,
    private router: Router
  ) {}

  // Delete token for an image uploaded but not yet saved (so we can undo it)
  private pendingDeleteToken: string | null = null;

  coverIsVideo(url: string): boolean {
    return CloudinaryService.isVideo(url);
  }

  /** Remove an uploaded-but-unsaved image from Cloudinary (re-choose / cancel). */
  private async discardPendingUpload(): Promise<void> {
    if (this.pendingDeleteToken) {
      await this.cloudinary.deleteByToken(this.pendingDeleteToken);
      this.pendingDeleteToken = null;
    }
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.message = '';
    this.uploading = true;
    try {
      // If they're replacing an image they just uploaded, delete the old one first
      await this.discardPendingUpload();
      const result = await this.cloudinary.upload(file);
      this.form.cover_url = result.url;
      this.pendingDeleteToken = result.deleteToken ?? null;
    } catch (err: any) {
      this.message = err?.message ?? 'Upload failed.';
    } finally {
      this.uploading = false;
      input.value = ''; // allow re-selecting the same file
    }
  }

  /** "Remove cover" button — also cleans up Cloudinary if it was just uploaded. */
  async removeCover(): Promise<void> {
    await this.discardPendingUpload();
    this.form.cover_url = '';
  }

  async ngOnInit(): Promise<void> {
    this.userEmail = (await this.supabase.currentUserEmail()) ?? '';
    await Promise.all([this.refresh(), this.refreshEvents(), this.refreshSponsors()]);
    [this.categories, this.authors, this.subscribers] = await Promise.all([
      this.supabase.getCategories(),
      this.supabase.getAuthors(),
      this.supabase.getSubscribers()
    ]);
    this.loading = false;
  }

  // ─────────────── Overview stats (computed from already-loaded data) ───────────────

  get publishedPosts(): number { return this.posts.filter(p => p.published).length; }
  get draftPosts(): number { return this.posts.filter(p => !p.published).length; }
  get publishedEvents(): number { return this.events.filter(e => e.published).length; }

  /** [{ name, count }] of published posts per category, busiest first. */
  get postsByCategory(): { name: string; count: number }[] {
    const nameById = new Map(this.categories.map(c => [c.id, c.name]));
    const counts = new Map<string, number>();
    for (const p of this.posts) {
      const name = (p.category_id && nameById.get(p.category_id)) || 'Uncategorised';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  get recentSubscribers(): { email: string; created_at: string }[] {
    return this.subscribers.slice(0, 8);
  }

  async refresh(): Promise<void> {
    this.posts = await this.supabase.getAllPosts();
  }

  async refreshEvents(): Promise<void> {
    this.events = await this.supabase.getAllEvents();
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

  async startNew(): Promise<void> {
    await this.discardPendingUpload();
    this.editingId = null;
    this.form = this.blankForm();
    this.message = '';
  }

  async editPost(p: PostRecord): Promise<void> {
    await this.discardPendingUpload();
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
      this.pendingDeleteToken = null; // saved — keep the image, don't discard it
      await this.refresh();
      this.startNew();
    }
  }

  remove(p: PostRecord): void {
    this.askDelete('Delete post?', `"${p.title}" will be permanently deleted.`, async () => {
      const res = await this.supabase.deletePost(p.id);
      this.message = res.message;
      if (res.ok) {
        if (this.editingId === p.id) await this.startNew();
        await this.refresh();
      }
    });
  }

  // ─────────────── Events ───────────────

  blankEventForm(): EventForm {
    return { name: '', event_date: '', location: '', blurb: '', body: '', published: true };
  }

  startNewEvent(): void {
    this.editingEventId = null;
    this.eventForm = this.blankEventForm();
    this.eventMessage = '';
  }

  editEvent(e: EventRecord): void {
    this.editingEventId = e.id;
    this.eventMessage = '';
    this.eventForm = {
      name: e.name,
      event_date: e.event_date,
      location: e.location ?? '',
      blurb: e.blurb ?? '',
      body: e.body ?? '',
      published: e.published
    };
  }

  async saveEvent(): Promise<void> {
    this.eventMessage = '';
    if (!this.eventForm.name.trim() || !this.eventForm.event_date.trim()) {
      this.eventMessage = 'Name and date are required.';
      return;
    }

    const payload: Partial<EventRecord> = {
      name: this.eventForm.name.trim(),
      event_date: this.eventForm.event_date.trim(),
      location: this.eventForm.location.trim() || null,
      blurb: this.eventForm.blurb.trim() || null,
      body: this.eventForm.body.trim() || null,
      published: this.eventForm.published
    };

    this.savingEvent = true;
    const res = this.editingEventId
      ? await this.supabase.updateEvent(this.editingEventId, payload)
      : await this.supabase.createEvent(payload);
    this.savingEvent = false;

    this.eventMessage = res.message;
    if (res.ok) {
      await this.refreshEvents();
      this.startNewEvent();
    }
  }

  removeEvent(e: EventRecord): void {
    this.askDelete('Delete event?', `"${e.name}" will be permanently deleted.`, async () => {
      const res = await this.supabase.deleteEvent(e.id);
      this.eventMessage = res.message;
      if (res.ok) {
        if (this.editingEventId === e.id) await this.startNewEvent();
        await this.refreshEvents();
      }
    });
  }

  // ─────────────── Sponsors / flyers ───────────────

  blankSponsorForm(): SponsorForm {
    return { business_name: '', flyer_url: '', link_url: '', active: true, sort_order: 0 };
  }

  async refreshSponsors(): Promise<void> {
    this.sponsors = await this.supabase.getAllSponsors();
  }

  private async discardSponsorUpload(): Promise<void> {
    if (this.sponsorDeleteToken) {
      await this.cloudinary.deleteByToken(this.sponsorDeleteToken);
      this.sponsorDeleteToken = null;
    }
  }

  async onSponsorFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.sponsorMessage = '';
    this.sponsorUploading = true;
    try {
      await this.discardSponsorUpload();
      const result = await this.cloudinary.upload(file);
      this.sponsorForm.flyer_url = result.url;
      this.sponsorDeleteToken = result.deleteToken ?? null;
    } catch (err: any) {
      this.sponsorMessage = err?.message ?? 'Upload failed.';
    } finally {
      this.sponsorUploading = false;
      input.value = '';
    }
  }

  async removeFlyer(): Promise<void> {
    await this.discardSponsorUpload();
    this.sponsorForm.flyer_url = '';
  }

  async startNewSponsor(): Promise<void> {
    await this.discardSponsorUpload();
    this.editingSponsorId = null;
    this.sponsorForm = this.blankSponsorForm();
    this.sponsorMessage = '';
  }

  async editSponsor(s: SponsorRecord): Promise<void> {
    await this.discardSponsorUpload();
    this.editingSponsorId = s.id;
    this.sponsorMessage = '';
    this.sponsorForm = {
      business_name: s.business_name,
      flyer_url: s.flyer_url,
      link_url: s.link_url ?? '',
      active: s.active,
      sort_order: s.sort_order
    };
  }

  async saveSponsor(): Promise<void> {
    this.sponsorMessage = '';
    if (!this.sponsorForm.business_name.trim() || !this.sponsorForm.flyer_url) {
      this.sponsorMessage = 'Business name and a flyer image are required.';
      return;
    }

    const payload: Partial<SponsorRecord> = {
      business_name: this.sponsorForm.business_name.trim(),
      flyer_url: this.sponsorForm.flyer_url,
      link_url: this.sponsorForm.link_url.trim() || null,
      active: this.sponsorForm.active,
      sort_order: Number(this.sponsorForm.sort_order) || 0
    };

    this.savingSponsor = true;
    const res = this.editingSponsorId
      ? await this.supabase.updateSponsor(this.editingSponsorId, payload)
      : await this.supabase.createSponsor(payload);
    this.savingSponsor = false;

    this.sponsorMessage = res.message;
    if (res.ok) {
      this.sponsorDeleteToken = null; // committed — keep the image
      await this.refreshSponsors();
      this.startNewSponsor();
    }
  }

  removeSponsor(s: SponsorRecord): void {
    this.askDelete('Delete sponsor?', `"${s.business_name}" will be permanently removed.`, async () => {
      const res = await this.supabase.deleteSponsor(s.id);
      this.sponsorMessage = res.message;
      if (res.ok) {
        if (this.editingSponsorId === s.id) await this.startNewSponsor();
        await this.refreshSponsors();
      }
    });
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }

  // ─────────────── Shared delete confirmation modal ───────────────

  private askDelete(title: string, message: string, action: () => Promise<void>): void {
    this.pendingDelete = { title, message, action };
  }

  async confirmDelete(): Promise<void> {
    if (!this.pendingDelete) return;
    this.deleting = true;
    try {
      await this.pendingDelete.action();
    } finally {
      this.deleting = false;
      this.pendingDelete = null;
    }
  }

  cancelDelete(): void {
    if (!this.deleting) this.pendingDelete = null;
  }
}
