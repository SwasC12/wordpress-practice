import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { SupabaseService, Post, CarEvent } from './supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'wordpress-practice';

  brand = 'Gearheads';

  navLinks = ['Home', 'Reviews', 'News', 'Events', 'Guides', 'About'];
  topics = ['EVs', 'Classics', 'Motorsport', 'Restorations', 'Road Trips', 'Tech'];

  // Loaded from Supabase
  featured: Post | null = null;
  posts: Post[] = [];
  events: CarEvent[] = [];
  loading = true;

  // Newsletter
  email = '';
  subscribeMsg = '';

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const [posts, events] = await Promise.all([
      this.supabase.getPosts(),
      this.supabase.getEvents()
    ]);

    // Newest post becomes the featured story; the rest fill the grid
    this.featured = posts[0] ?? null;
    this.posts = posts.slice(1);
    this.events = events;
    this.loading = false;
  }

  async onSubscribe(): Promise<void> {
    const email = this.email.trim();
    if (!email) return;
    const res = await this.supabase.subscribe(email);
    this.subscribeMsg = res.message;
    if (res.ok) this.email = '';
  }
}
