import { Component } from '@angular/core';
import { SiteLanguageService } from '../../core/site-language.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  openedSection: 'house' | 'shop' | 'help' | null = null;

  readonly footerLabels$ = this.siteLang.footerLabels$;

  constructor(private siteLang: SiteLanguageService) {}

  toggleSection(section: 'house' | 'shop' | 'help'): void {
    this.openedSection = this.openedSection === section ? null : section;
  }
}
