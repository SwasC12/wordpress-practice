import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

/** Blocks access to admin routes unless a Supabase session exists. */
export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const email = await supabase.currentUserEmail();
  if (email) return true;

  return router.createUrlTree(['/login']);
};
