import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';

@Injectable({ providedIn: 'root' })
export class SuperAdminGuard implements CanActivate {
  constructor(private auth: AdminAuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.isSuperAdmin()) return true;
    if (this.auth.isNormalAdmin()) {
      void this.router.navigate(['/accueil']);
      return false;
    }
    void this.router.navigate(['/admin/myrass-secure'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
