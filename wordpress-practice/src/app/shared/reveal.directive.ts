import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';

/**
 * Fade/slide an element in when it scrolls into view.
 * Usage: <article appReveal>…</article>
 * (Styling lives in global styles.css: .reveal / .reveal-in)
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('reveal');

    // No IntersectionObserver support → just show it (no FOUC trap)
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('reveal-in');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          this.observer?.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });

    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
