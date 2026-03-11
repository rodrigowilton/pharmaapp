import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonBackButton,
  IonContent, IonBadge, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
  IonButton, ToastController, AlertController
} from '@ionic/angular/standalone';
import { PedidosService } from '../../../services/data.services';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonBackButton,
    IonContent, IonBadge, IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonButton],
  template: `
<ion-header>
  <ion-toolbar>
    <ion-back-button defaultHref="/farmacia/dashboard" slot="start"></ion-back-button>
    <ion-title>Pedidos</ion-title>
  </ion-toolbar>
  <ion-toolbar>
    <ion-segment [(ngModel)]="filtro" (ionChange)="carregar()" scrollable>
      <ion-segment-button value=""><ion-label>Todos</ion-label></ion-segment-button>
      <ion-segment-button value="aguardando"><ion-label>Aguardando</ion-label></ion-segment-button>
      <ion-segment-button value="preparando"><ion-label>Preparando</ion-label></ion-segment-button>
      <ion-segment-button value="entregue"><ion-label>Entregue</ion-label></ion-segment-button>
    </ion-segment>
  </ion-toolbar>
</ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div *ngIf="loading" class="center"><ion-spinner color="primary"></ion-spinner></div>
    <div *ngFor="let p of pedidos" class="pedido-card">
      <div class="head">
        <span class="pid">#{{p.id.slice(-6).toUpperCase()}}</span>
        <ion-badge [color]="cor(p.status)">{{p.status | titlecase}}</ion-badge>
      </div>
      <div class="cli">{{p.nome_cliente}}</div>
      <div class="inf">{{p.itens?.length||0}} itens · R$ {{p.total | number:'1.2-2'}}</div>

      <div class="acoes" *ngIf="p.status==='aguardando'">
        <ion-button expand="block" color="success"  size="small" (click)="mudar(p,'confirmado')">✓ Confirmar</ion-button>
        <ion-button fill="outline"  color="danger"  size="small" (click)="mudar(p,'cancelado')">✕ Cancelar</ion-button>
      </div>
      <div class="acoes" *ngIf="p.status==='confirmado'||p.status==='preparando'">
        <ion-button expand="block" color="tertiary" size="small" (click)="entregar(p)">📦 Marcar Entregue</ion-button>
      </div>
    </div>
    <div class="empty" *ngIf="!loading && pedidos.length===0">Nenhum pedido aqui.</div>
  </div>
</ion-content>`
})
export class PedidosPage implements OnInit {
  pedidos: any[] = []; filtro = ''; loading = true;
  constructor(private svc: PedidosService, private toast: ToastController, private alert: AlertController) {}
  ngOnInit() { this.carregar(); }

  async carregar() {
    this.loading = true;
    this.pedidos = await this.svc.listar(this.filtro || undefined);
    this.loading = false;
  }

  async mudar(p: any, status: string) {
    await this.svc.atualizarStatus(p.id, status);
    p.status = status;
    const t = await this.toast.create({ message:`Pedido ${status}!`, duration:2000, color:'success', position:'top' }); t.present();
  }

  async entregar(p: any) {
    const a = await this.alert.create({
      header: 'Confirmar entrega?',
      message: 'O estoque será atualizado automaticamente.',
      buttons: [
        { text:'Cancelar', role:'cancel' },
        { text:'Confirmar', handler: () => this.mudar(p, 'entregue') }
      ]
    });
    await a.present();
  }

  cor(s: string) { return ({aguardando:'warning',confirmado:'primary',preparando:'tertiary',entregue:'success',cancelado:'danger'} as any)[s]||'medium'; }
}
