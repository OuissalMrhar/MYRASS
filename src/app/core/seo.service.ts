import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteName = 'Myrass';
  private readonly defaultDesc =
    "Myrass – Coffrets cadeaux et produits gourmets marocains d'exception : huile d'argan, miel, amlou, cosmétiques naturels.";
  private readonly defaultImage =
    'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776251107/pexels-diego-f-parra-33199-25254868_1_no7oy2.jpg';

  constructor(private title: Title, private meta: Meta) {}

  set(cfg: {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  }): void {
    const full = `${cfg.title} | ${this.siteName}`;
    const desc = cfg.description ?? this.defaultDesc;
    const img  = cfg.image ?? this.defaultImage;

    this.title.setTitle(full);
    this.tag('description', desc);
    this.prop('og:title', full);
    this.prop('og:description', desc);
    this.prop('og:image', img);
    this.prop('og:type', cfg.type ?? 'website');
    this.prop('og:site_name', this.siteName);
    this.tag('twitter:card', 'summary_large_image');
    this.tag('twitter:title', full);
    this.tag('twitter:description', desc);
    this.tag('twitter:image', img);
    if (cfg.url) this.prop('og:url', cfg.url);
  }

  reset(): void {
    this.title.setTitle(this.siteName);
    this.tag('description', this.defaultDesc);
    this.prop('og:title', this.siteName);
    this.prop('og:description', this.defaultDesc);
    this.prop('og:image', this.defaultImage);
    this.prop('og:type', 'website');
  }

  private tag(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }
  private prop(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }
}
