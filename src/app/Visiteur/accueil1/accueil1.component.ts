import { Component } from '@angular/core';
import { SiteLanguageService } from '../../core/site-language.service';

@Component({
  selector: 'app-accueil1',
  templateUrl: './accueil1.component.html',
  styleUrls: ['./accueil1.component.scss'],
})
export class Accueil1Component {
  readonly homeLabels$ = this.siteLang.homeLabels$;
  brandStoryExpanded = false;

  constructor(private readonly siteLang: SiteLanguageService) {}

  toggleBrandStory(): void {
    this.brandStoryExpanded = !this.brandStoryExpanded;
  }
}

