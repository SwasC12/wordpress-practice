import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Post, CarEvent } from '../supabase.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  brand = 'Gearheads';

  navLinks = ['Home', 'Reviews', 'News', 'Events', 'Guides', 'About'];
  topics = ['EVs', 'Classics', 'Motorsport', 'Restorations', 'Road Trips', 'Tech'];

  featured: Post | null = null;
  posts: Post[] = [];
  events: CarEvent[] = [];
  loading = true;

  email = '';
  subscribeMsg = '';

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const [posts, events] = await Promise.all([
      this.supabase.getPosts(),
      this.supabase.getEvents()
    ]);

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
