export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminRegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  roleId?: number;
  adminId?: number;
  prenom?: string;
  nom?: string;
  email?: string;
  role?: { id: number };
  message?: string;
}

export interface AdminSessionOverview {
  adminId: number;
  prenom: string;
  nom: string;
  email: string;
  roleId: number;
  roleName: string | null;
  lastLoginUtc: string | null;
  approxOnline: boolean;
}

export interface AdminRegistrationPending {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  requestedUtc: string;
  status: number;
}

export interface AdminCreateBySuper {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  roleId: number;
}

/** Mise à jour d'un admin — le mot de passe est optionnel (vide = pas de changement). */
export interface AdminUpdateBySuper {
  prenom: string;
  nom: string;
  email: string;
  password: string | null;
  roleId: number;
}
