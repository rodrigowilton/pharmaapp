import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class FarmaciasService {
  constructor(private api: ApiService) {}
  stats()                                      { return this.api.get<any>('/admin/stats'); }
  listar()                                     { return this.api.get<any[]>('/admin/farmacias'); }
  buscar(id: string)                           { return this.api.get<any>(`/admin/farmacias/${id}`); }
  criar(dados: any)                            { return this.api.post<any>('/admin/farmacias', dados); }
  alterarStatus(id: string, status: string)    { return this.api.patch<any>(`/admin/farmacias/${id}/status`, { status }); }
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  constructor(private api: ApiService) {}
  listar(busca?: string) {
    const q = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    return this.api.get<any[]>(`/farmacia/clientes${q}`);
  }
  buscar(id: string)              { return this.api.get<any>(`/farmacia/clientes/${id}`); }
  criar(dados: any)               { return this.api.post<any>('/farmacia/clientes', dados); }
  atualizar(id: string, d: any)   { return this.api.put<any>(`/farmacia/clientes/${id}`, d); }
}

@Injectable({ providedIn: 'root' })
export class ProdutosService {
  constructor(private api: ApiService) {}
  listar()                        { return this.api.get<any[]>('/farmacia/produtos'); }
  criticos()                      { return this.api.get<any[]>('/farmacia/produtos/criticos'); }
  criar(dados: any)               { return this.api.post<any>('/farmacia/produtos', dados); }
  atualizar(id: string, d: any)   { return this.api.put<any>(`/farmacia/produtos/${id}`, d); }
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  constructor(private api: ApiService) {}
  listar(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.api.get<any[]>(`/farmacia/pedidos${q}`);
  }
  criar(dados: any)                            { return this.api.post<any>('/farmacia/pedidos', dados); }
  atualizarStatus(id: string, status: string)  { return this.api.patch<any>(`/farmacia/pedidos/${id}/status`, { status }); }
  meusPedidos()                                { return this.api.get<any[]>('/cliente/meus-pedidos'); }
}
