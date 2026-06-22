import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { CloudinaryService } from './cloudinary.service';

// ── Shapes used by the public homepage ──
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  gradient: string;
  coverUrl: string | null;   // Cloudinary image/video URL, if any
  coverIsVideo: boolean;
}

// Full article (includes the body) for the post-detail page
export interface FullPost extends Post {
  body: string;
}

export interface CarEvent {
  name: string;
  date: string;
  location: string;
  blurb: string;
}

// ── Shapes used by the admin ──
export interface PostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  gradient: string | null;
  cover_url: string | null;
  read_time: string | null;
  category_id: string | null;
  author_id: string | null;
  published: boolean;
  created_at: string;
}

export interface NamedRow { id: string; name: string; }

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ─────────────── Public reads ───────────────

  async getPosts(): Promise<Post[]> {
    const { data, error } = await this.client
      .from('posts')
      .select('slug, title, excerpt, read_time, gradient, cover_url, created_at, categories(name), authors(name)')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getPosts failed:', error.message);
      return [];
    }

    return (data ?? []).map((row: any) => this.mapPost(row));
  }

  /** A single published article by slug, including its body. Null if not found. */
  async getPostBySlug(slug: string): Promise<FullPost | null> {
    const { data, error } = await this.client
      .from('posts')
      .select('slug, title, excerpt, body, read_time, gradient, cover_url, created_at, categories(name), authors(name)')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      console.error('getPostBySlug failed:', error.message);
      return null;
    }
    if (!data) return null;

    return { ...this.mapPost(data), body: (data as any).body ?? '' };
  }

  private mapPost(row: any): Post {
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? '',
      author: row.authors?.name ?? 'Staff',
      date: this.formatDate(row.created_at),
      category: row.categories?.name ?? 'General',
      readTime: row.read_time ?? '',
      gradient: row.gradient ?? 'linear-gradient(135deg, #1e3a8a, #0ea5e9)',
      coverUrl: row.cover_url ?? null,
      coverIsVideo: CloudinaryService.isVideo(row.cover_url)
    };
  }

  async getEvents(): Promise<CarEvent[]> {
    const { data, error } = await this.client
      .from('events')
      .select('name, event_date, location, blurb')
      .eq('published', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getEvents failed:', error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      name: row.name,
      date: row.event_date,
      location: row.location ?? '',
      blurb: row.blurb ?? ''
    }));
  }

  async subscribe(email: string): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.from('subscribers').insert({ email });
    if (error) {
      if (error.code === '23505') return { ok: true, message: "You're already subscribed!" };
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Thanks for subscribing!' };
  }

  // ─────────────── Auth ───────────────

  async signIn(email: string, password: string): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Signed in' };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  /** Returns the signed-in user's email, or null if not authenticated. */
  async currentUserEmail(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user?.email ?? null;
  }

  // ─────────────── Admin: posts CRUD ───────────────

  /** All posts (incl. unpublished) — requires an authenticated session (RLS). */
  async getAllPosts(): Promise<PostRecord[]> {
    const { data, error } = await this.client
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('getAllPosts failed:', error.message);
      return [];
    }
    return (data ?? []) as PostRecord[];
  }

  async createPost(post: Partial<PostRecord>): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.from('posts').insert(post);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Post created' };
  }

  async updatePost(id: string, post: Partial<PostRecord>): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.from('posts').update(post).eq('id', id);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Post updated' };
  }

  async deletePost(id: string): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.from('posts').delete().eq('id', id);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Post deleted' };
  }

  async getCategories(): Promise<NamedRow[]> {
    const { data } = await this.client.from('categories').select('id, name').order('name');
    return (data ?? []) as NamedRow[];
  }

  async getAuthors(): Promise<NamedRow[]> {
    const { data } = await this.client.from('authors').select('id, name').order('name');
    return (data ?? []) as NamedRow[];
  }

  private formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
