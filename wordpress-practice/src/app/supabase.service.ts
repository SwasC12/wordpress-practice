import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

// ── Shapes used by the homepage template ──
export interface Post {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  gradient: string;
}

export interface CarEvent {
  name: string;
  date: string;
  location: string;
  blurb: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /** Latest published posts, with their category + author joined in. */
  async getPosts(): Promise<Post[]> {
    const { data, error } = await this.client
      .from('posts')
      .select('title, excerpt, read_time, gradient, created_at, categories(name), authors(name)')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getPosts failed:', error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      title: row.title,
      excerpt: row.excerpt ?? '',
      author: row.authors?.name ?? 'Staff',
      date: this.formatDate(row.created_at),
      category: row.categories?.name ?? 'General',
      readTime: row.read_time ?? '',
      gradient: row.gradient ?? 'linear-gradient(135deg, #1e3a8a, #0ea5e9)'
    }));
  }

  /** Published events, soonest first by insertion order. */
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

  /** Newsletter signup. */
  async subscribe(email: string): Promise<{ ok: boolean; message: string }> {
    const { error } = await this.client.from('subscribers').insert({ email });
    if (error) {
      // 23505 = unique violation (already subscribed)
      if (error.code === '23505') return { ok: true, message: "You're already subscribed!" };
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Thanks for subscribing!' };
  }

  private formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
