import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cloudinaryOptimize' })
export class CloudinaryOptimizePipe implements PipeTransform {
  transform(url: string | null | undefined, width?: number): string {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com')) return url;
    if (url.includes('/upload/f_auto')) return url; // already optimized

    const w = width ? `,w_${width},c_limit` : '';
    const params = `f_auto,q_auto${w}`;

    return url.replace('/upload/', `/upload/${params}/`);
  }
}
