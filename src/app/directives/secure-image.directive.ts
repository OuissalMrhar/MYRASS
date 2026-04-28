import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';

@Directive({ selector: 'img' })
export class SecureImageDirective implements OnInit {
  constructor(private el: ElementRef<HTMLImageElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.setAttribute(this.el.nativeElement, 'draggable', 'false');
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(e: DragEvent): void { e.preventDefault(); }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    const src = this.el.nativeElement.src;
    if (!src) return;
    const ext = src.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
    const finalExt = allowed.includes(ext) ? ext : 'jpg';
    fetch(src)
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `myrass_product.${finalExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => {});
  }
}
