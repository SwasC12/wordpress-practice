import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService, FullPost } from '../supabase.service';
import { SpinnerComponent } from '../shared/spinner.component';
import { BackToTopComponent } from '../shared/back-to-top.component';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, BackToTopComponent],
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.css']
})
export class ArticleComponent implements OnInit {
  post: FullPost | null = null;
  loading = true;

  constructor(private route: ActivatedRoute, private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    // React to slug changes so navigating between articles re-loads
    this.route.paramMap.subscribe(async params => {
      this.loading = true;
      this.post = null;
      const slug = params.get('slug') ?? '';
      this.post = await this.supabase.getPostBySlug(slug);
      this.loading = false;
      window.scrollTo(0, 0);
    });
  }

  /** Split the stored plain-text body into paragraphs on blank lines. */
  get paragraphs(): string[] {
    if (!this.post?.body) return [];
    return this.post.body
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
  }
}
