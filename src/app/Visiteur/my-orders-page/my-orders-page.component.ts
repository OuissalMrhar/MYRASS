import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { SiteLanguageService } from '../../core/site-language.service';
import { OrdersLabels } from '../../core/visitor-i18n';
import { UserAuthService } from '../../services/user-auth.service';
import { CommandeResponseDto, OrdersApiService } from '../../services/orders-api.service';

@Component({
  selector: 'app-my-orders-page',
  templateUrl: './my-orders-page.component.html',
  styleUrls: ['./my-orders-page.component.scss'],
})
export class MyOrdersPageComponent {
  readonly currentUser$ = this.userAuth.currentUser$;
  readonly orders$: Observable<{ rows: CommandeResponseDto[]; error: string | null }>;
  readonly labels$: Observable<OrdersLabels>;

  constructor(
    private readonly userAuth: UserAuthService,
    private readonly ordersApi: OrdersApiService,
    private readonly siteLang: SiteLanguageService,
  ) {
    this.labels$ = this.siteLang.ordersLabels$;
    this.orders$ = this.userAuth.currentUser$.pipe(
      switchMap((user) => {
        if (!user?.id || !this.userAuth.getAccessToken()) {
          return of({ rows: [] as CommandeResponseDto[], error: null as string | null });
        }
        return this.ordersApi.getMy().pipe(
          map((rows) => ({ rows, error: null as string | null })),
          catchError(() =>
            of({
              rows: [] as CommandeResponseDto[],
              error: "Impossible de charger vos commandes. Vérifiez que l'API est démarrée.",
            }),
          ),
        );
      }),
      shareReplay(1),
    );
  }

  openLogin(): void {
    this.userAuth.requestOpenLoginPanel();
  }

  formatDate(iso: string, lang?: string): string {
    try {
      const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-GB' : 'fr-FR';
      return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  statutLabel(statut: string, t: OrdersLabels): string {
    const s = (statut ?? '').toLowerCase();
    if (s === 'en_attente') return t.statusPending;
    if (s === 'confirmée' || s === 'confirmee') return t.statusConfirmed;
    return statut || '—';
  }

  trackByOrderId(_: number, o: CommandeResponseDto): number {
    return o.id;
  }
}
