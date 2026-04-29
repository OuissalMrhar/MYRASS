import { Pipe, PipeTransform } from '@angular/core';

type CloudinaryImgOptions = {
  /** Max width in pixels (Cloudinary will keep aspect ratio). */
  w?: number;
  /** Cloudinary quality value, ex: 'auto' | 'auto:good' | 'auto:best' | '70'. */
  q?: string;
  /** Force a specific delivery format, ex: 'auto' | 'webp' | 'avif'. */
  f?: string;
  /** Optional crop mode (defaults to c_limit). */
  c?: string;
};

function isCloudinaryImageUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/');
}

function hasTransformationsAfterUpload(url: string): boolean {
  // Cloudinary URL shape: .../image/upload/<transformations>/v123/... OR .../image/upload/v123/...
  // If segment after /upload/ is NOT a version (v123...) then transformations already exist.
  const idx = url.indexOf('/image/upload/');
  if (idx < 0) return false;
  const after = url.slice(idx + '/image/upload/'.length);
  const firstSeg = after.split('/')[0] ?? '';
  return firstSeg.length > 0 && !/^v\d+$/.test(firstSeg);
}

function injectTransformations(url: string, tr: string): string {
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (i < 0) return url;
  return url.slice(0, i + marker.length) + tr + '/' + url.slice(i + marker.length);
}

@Pipe({ name: 'cloudinaryImg', standalone: true })
export class CloudinaryImgPipe implements PipeTransform {
  transform(url: string | null | undefined, opts?: CloudinaryImgOptions | number): string {
    const raw = (url ?? '').trim();
    if (!raw) return '';
    if (!isCloudinaryImageUrl(raw)) return raw;
    if (hasTransformationsAfterUpload(raw)) return raw;

    const o: CloudinaryImgOptions =
      typeof opts === 'number' ? { w: opts } : (opts ?? {});

    const w = Number.isFinite(Number(o.w)) && Number(o.w) > 0 ? Math.round(Number(o.w)) : 900;
    const q = (o.q ?? 'auto:good').trim();
    const f = (o.f ?? 'auto').trim();
    const c = (o.c ?? 'limit').trim();

    // Keep it conservative: limit width, choose best format, auto quality.
    const tr = `f_${f},q_${q},w_${w},c_${c}`;
    return injectTransformations(raw, tr);
  }
}

