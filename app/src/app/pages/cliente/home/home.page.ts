import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonBadge, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { PedidosService } from '../../../services/data.services';

@Component({
  selector: 'app-cliente-home',
  standalone: true,
  imports: [CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonBadge, IonSpinner],
  template: `
<ion-header><ion-toolbar>
  <ion-title>💊 PharmaApp</ion-title>
  <ion-buttons slot="end"><ion-button (click)="auth.logout()"><ion-icon name="log-out-outline"></ion-icon></ion-button></ion-buttons>
</ion-toolbar></ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div style="background:linear-gradient(135deg,#0d9488,#0369a1);border-radius:20px;padding:24px 20px;margin-bottom:24px">
      <div style="color:#fff;font-size:22px;font-weight:700">Olá, {{auth.usuario?.nome?.split(' ')[0]}} 👋</div>
      <div style="color:rgba(255,255,255,.6);font-size:13px;margin-top:4px">Bem-vindo à sua farmácia</div>
    </div>

    <div class="sec-title">Meus Pedidos</div>
    <div *ngIf="loading" class="center"><ion-spinner color="primary"></ion-spinner></div>
    <div class="empty" *ngIf="!loading && pedidos.length===0">Nenhum pedido ainda.</div>
    <div *ngFor="let p of pedidos" class="pedido-card">
      <div class="head">
        <span class="pid">#{{p.id.slice(-6).toUpperCase()}}</span>
        <ion-badge [color]="cor(p.status)">{{p.status | titlecase}}</ion-badge>
      </div>
      <div class="inf">{{p.itens?.length||0}} itens · R$ {{p.total | number:'1.2-2'}}</div>
    </div>
  </div>
</ion-content>`
})
export class ClienteHomePage implements OnInit {
  pedidos: any[] = []; loading = true;
  constructor(public auth: AuthService, private svc: PedidosService) { addIcons({ logOutOutline }); }
  async ngOnInit() { this.pedidos = await this.svc.meusPedidos(); this.loading = false; }
  cor(s: string) { return ({aguardando:'warning',confirmado:'primary',preparando:'tertiary',entregue:'success',cancelado:'danger'} as any)[s]||'medium'; }
}
