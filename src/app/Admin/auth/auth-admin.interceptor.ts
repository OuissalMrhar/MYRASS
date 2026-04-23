import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserAuthService } from '../../services/user-auth.service';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AuthAdminInterceptor implements HttpInterceptor {
  constructor(
    private adminAuth: AdminAuthService,
    private userAuth: UserAuthService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Certaines routes sont lisibles sans auth côté backend.
    if (
      req.method === 'GET' &&
      (req.url.includes('/api/volumes') ||
        req.url.includes('/api/tailles') ||
        req.url.includes('/api/types-produit'))
    ) {
      return next.handle(req);
    }

    if (this.adminAuth.isAuthRequest(req.url, req.method)) return next.handle(req);

    // Validation code promo : route publique, ne pas envoyer le jeton admin.
    if (req.url.includes('/api/promo/')) {
      return next.handle(req);
    }

    // Commandes / paniers : uniquement le JWT visiteur (pas le jeton admin).
    if (req.url.includes('/api/commandes') || req.url.includes('/api/paniers')) {
      const visitorToken = this.userAuth.getAccessToken();
      if (visitorToken) {
        return next.handle(
          req.clone({ setHeaders: { Authorization: `Bearer ${visitorToken}` } }),
        );
      }
      return next.handle(req);
    }

    const token = this.adminAuth.getToken();
    if (!token) return next.handle(req);

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });

    return next.handle(authReq).pipe(
      catchError((err) => {
        if (err?.status === 401) {
          this.adminAuth.logout();
          void this.router.navigate(['/admin/myrass-secure']);
        }
        return throwError(() => err);
      }),
    );
  }
}
