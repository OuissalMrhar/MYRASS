import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

const GET_TIMEOUT_MS = 15_000;

@Injectable()
export class HttpTimeoutInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.method !== 'GET') return next.handle(req);

    return next.handle(req).pipe(
      timeout(GET_TIMEOUT_MS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => ({
            status: 0,
            error: { message: 'La requête a pris trop de temps. Vérifiez votre connexion.' },
          }));
        }
        return throwError(() => err);
      }),
    );
  }
}
