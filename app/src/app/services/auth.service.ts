import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

export interface Usuario {
  id: string; nome: string; email: string;
  role: 'admin' | 'farmacia' | 'cliente';
  farmacia_id?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _u = new BehaviorSubject<Usuario | null>(null);
  usuario$ = this._u.asObservable();

  constructor(private api: ApiService, private router: Router) {
    const s = localStorage.getItem('usuario');
    if (s) this._u.next(JSON.parse(s));
  }

  async login(email: string, senha: string) {
    const res: any = await this.api.post('/auth/login', { email, senha });
    localStorage.setItem('token',   res.token);
    localStorage.setItem('usuario', JSON.stringify(res.usuario));
    this._u.next(res.usuario);
    const rotas: any = { admin: '/admin/dashboard', farmacia: '/farmacia/dashboard', cliente: '/cliente/home' };
    this.router.navigate([rotas[res.usuario.role]]);
  }

  logout() {
    localStorage.clear();
    this._u.next(null);
    this.router.navigate(['/login']);
  }

  get usuario()    { return this._u.value; }
  get isAdmin()    { return this.usuario?.role === 'admin'; }
  get isFarmacia() { return this.usuario?.role === 'farmacia'; }
  get isCliente()  { return this.usuario?.role === 'cliente'; }
  get logado()     { return !!this.usuario; }
  get farmaciaId() { return this.usuario?.farmacia_id; }
}
