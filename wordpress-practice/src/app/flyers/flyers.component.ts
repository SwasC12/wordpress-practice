import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, Sponsor } from '../supabase.service';

@Component({
  selector: 'app-flyers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flyers.component.html',
  styleUrls: ['./flyers.component.css']
})
export class FlyersComponent implements OnInit, OnDestroy {
  flyers: Sponsor[] = [];
  current = 0;

  private timer: any = null;
  private readonly intervalMs = 5000;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    this.flyers = await this.supabase.getSponsors();
    if (this.flyers.length > 1) this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.timer = setInterval(() => this.advance(1), this.intervalMs);
  }

  private stopAutoplay(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private advance(step: number): void {
    const n = this.flyers.length;
    if (n === 0) return;
    this.current = (this.current + step + n) % n;
  }

  /** Manual navigation restarts the autoplay timer so it doesn't jump immediately. */
  go(step: number): void {
    this.advance(step);
    if (this.flyers.length > 1) this.startAutoplay();
  }

  goTo(index: number): void {
    this.current = index;
    if (this.flyers.length > 1) this.startAutoplay();
  }

  pause(): void { this.stopAutoplay(); }
  resume(): void { if (this.flyers.length > 1) this.startAutoplay(); }
}
