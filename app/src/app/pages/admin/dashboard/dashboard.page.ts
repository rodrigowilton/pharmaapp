import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, arrowForwardOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { FarmaciasService } from '../../../services/data.services';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner],
  template: `
<ion-header><ion-toolbar>
  <ion-title>⚙️ Admin — PharmaApp</ion-title>
  <ion-buttons slot="end">
    <ion-button (click)="auth.logout()"><ion-icon name="log-out-outline"></ion-icon></ion-button>
  </ion-buttons>
</ion-toolbar></ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div class="grid2">
      <div class="stat-card teal"><div class="si">🏪</div><div class="sv">{{s?.total_farmacias||0}}</div><div class="sl">Farmácias</div><div class="ss">{{s?.farmacias_ativas||0}} ativas</div></div>
      <div class="stat-card blue"><div class="si">👥</div><div class="sv">{{s?.total_clientes||0}}</div><div class="sl">Clientes</div><div class="ss">total geral</div></div>
      <div class="stat-card amber"><div class="si">🛒</div><div class="sv">{{s?.total_pedidos||0}}</div><div class="sl">Pedidos</div><div class="ss">total geral</div></div>
      <div class="stat-card purple"><div class="si">⭐</div><div class="sv">{{s?.planos_premium||0}}</div><div class="sl">Premium</div><div class="ss">planos ativos</div></div>
    </div>

    <div class="sec-title">Farmácias Cadastradas</div>
    <div *ngIf="loading" class="center"><ion-spinner color="primary"></ion-spinner></div>
    <ion-list *ngIf="!loading">
      <ion-item *ngFor="let f of farmacias.slice(0,5)" class="list-item" [routerLink]="['/admin/farmacias']">
        <div slot="start" class="avatar">{{f.nome[0]}}</div>
        <ion-label><h2>{{f.nome}}</h2><p>{{f.cidade}}/{{f.estado}} · Plano {{f.plano | titlecase}}</p></ion-label>
        <ion-badge slot="end" [color]="f.status==='ativa'?'success':'danger'">{{f.status}}</ion-badge>
      </ion-item>
    </ion-list>

    <ion-button expand="block" routerLink="/admin/farmacias" style="--background:#1c1c1f;--color:#a1a1aa;--border-radius:14px;margin-top:8px">
      Ver todas as farmácias <ion-icon slot="end" name="arrow-forward-outline"></ion-icon>
    </ion-button>
  </div>
</ion-content>`,
  styles: [`ion-item { cursor: pointer; }`]
})
export class AdminDashboardPage implements OnInit {
  s: any = {}; farmacias: any[] = []; loading = true;
  constructor(public auth: AuthService, private svc: FarmaciasService) {
    addIcons({ logOutOutline, arrowForwardOutline });
  }
  async ngOnInit() {
    [this.s, this.farmacias] = await Promise.all([this.svc.stats(), this.svc.listar()]);
    this.loading = false;
  }
}
