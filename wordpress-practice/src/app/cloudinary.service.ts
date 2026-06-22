import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface UploadResult {
  url: string;          // hosted secure URL
  resourceType: string; // 'image' | 'video'
}

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  /**
   * Unsigned upload straight from the browser to Cloudinary.
   * Uses the unsigned upload preset — no API secret needed.
   * `auto` lets Cloudinary detect whether it's an image or a video.
   */
  async upload(file: File): Promise<UploadResult> {
    const { cloudinaryCloudName, cloudinaryUploadPreset } = environment;
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/auto/upload`;

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', cloudinaryUploadPreset);

    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
    }
    const data = await res.json();
    return { url: data.secure_url as string, resourceType: data.resource_type as string };
  }

  /** True if a stored cover URL points at a Cloudinary video. */
  static isVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('/video/upload/') || /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
  }
}
