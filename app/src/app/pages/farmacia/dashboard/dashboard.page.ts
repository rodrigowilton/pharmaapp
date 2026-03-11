import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { PedidosService, ProdutosService, ClientesService } from '../../../services/data.services';

@Component({
  selector: 'app-farmacia-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner],
  template: `
<ion-header><ion-toolbar>
  <ion-title>🏪 Minha Farmácia</ion-title>
  <ion-buttons slot="end"><ion-button (click)="auth.logout()"><ion-icon name="log-out-outline"></ion-icon></ion-button></ion-buttons>
</ion-toolbar></ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div class="grid2">
      <div class="stat-card teal"><div class="si">👥</div><div class="sv">{{totalCli}}</div><div class="sl">Clientes</div></div>
      <div class="stat-card amber"><div class="si">🛒</div><div class="sv">{{pendentes.length}}</div><div class="sl">Pendentes</div></div>
    </div>

    <div class="sec-title">Pedidos Aguardando</div>
    <div class="empty" *ngIf="pendentes.length===0">Nenhum pedido pendente 🎉</div>
    <ion-list>
      <ion-item *ngFor="let p of pendentes" class="list-item" routerLink="/farmacia/pedidos">
        <ion-label><h2>{{p.nome_cliente}}</h2><p>{{p.itens?.length||0}} itens · R$ {{p.total | number:'1.2-2'}}</p></ion-label>
        <ion-badge slot="end" color="warning">Aguardando</ion-badge>
      </ion-item>
    </ion-list>

    <div class="sec-title mt">⚠️ Estoque Crítico</div>
    <div class="empty" *ngIf="criticos.length===0">Estoque OK ✅</div>
    <ion-list>
      <ion-item *ngFor="let p of criticos" class="list-item">
        <ion-label><h2>{{p.nome}}</h2></ion-label>
        <ion-badge slot="end" color="danger">{{p.estoque}} un.</ion-badge>
      </ion-item>
    </ion-list>

    <div style="display:flex;flex-direction:column;gap:10px;margin-top:24px">
      <ion-button expand="block" routerLink="/farmacia/clientes" style="--background:#0d9488;--border-radius:14px">👥 Clientes</ion-button>
      <ion-button expand="block" routerLink="/farmacia/produtos" style="--background:#0369a1;--border-radius:14px">📦 Produtos</ion-button>
      <ion-button expand="block" routerLink="/farmacia/pedidos"  style="--background:#d97706;--border-radius:14px">🛒 Pedidos</ion-button>
    </div>
  </div>
</ion-content>`
})
export class FarmaciaDashboardPage implements OnInit {
  pendentes: any[] = []; criticos: any[] = []; totalCli = 0;
  constructor(public auth: AuthService, private ped: PedidosService, private prod: ProdutosService, private cli: ClientesService) {
    addIcons({ logOutOutline });
  }
  async ngOnInit() {
    const [p, c, cl] = await Promise.all([this.ped.listar('aguardando'), this.prod.criticos(), this.cli.listar()]);
    this.pendentes = p; this.criticos = c; this.totalCli = cl.length;
  }
}
