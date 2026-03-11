import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton,
  IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonSearchbar,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
import { ClientesService } from '../../../services/data.services';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton,
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonSearchbar],
  template: `
<ion-header>
  <ion-toolbar>
    <ion-back-button defaultHref="/farmacia/dashboard" slot="start"></ion-back-button>
    <ion-title>Clientes ({{filtrados.length}})</ion-title>
    <ion-buttons slot="end"><ion-button (click)="novo()"><ion-icon name="person-add-outline"></ion-icon></ion-button></ion-buttons>
  </ion-toolbar>
  <ion-toolbar>
    <ion-searchbar [(ngModel)]="busca" (ionInput)="filtrar()" placeholder="Nome ou telefone..." debounce="300"></ion-searchbar>
  </ion-toolbar>
</ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div *ngIf="loading" class="center"><ion-spinner color="primary"></ion-spinner></div>
    <ion-list *ngIf="!loading">
      <ion-item *ngFor="let c of filtrados" class="list-item" (click)="detalhe(c)">
        <div slot="start" class="avatar">{{c.nome[0]}}</div>
        <ion-label>
          <h2>{{c.nome}}</h2>
          <p>{{c.telefone || 'Sem telefone'}}</p>
          <p>Última compra: {{c.ultima_compra ? (c.ultima_compra | date:'dd/MM/yyyy') : 'Nenhuma'}}</p>
        </ion-label>
        <div slot="end" class="end-col">
          <span class="valor">R$ {{c.total_gasto | number:'1.2-2'}}</span>
          <ion-badge [color]="c.status==='ativo'?'success':'medium'">{{c.status}}</ion-badge>
        </div>
      </ion-item>
    </ion-list>
    <div class="empty" *ngIf="!loading && filtrados.length===0">Nenhum cliente encontrado.</div>
  </div>
</ion-content>`
})
export class ClientesPage implements OnInit {
  clientes: any[] = []; filtrados: any[] = []; busca = ''; loading = true;
  constructor(private svc: ClientesService, private alert: AlertController, private toast: ToastController) {
    addIcons({ personAddOutline });
  }
  async ngOnInit() { this.clientes = await this.svc.listar(); this.filtrar(); this.loading = false; }
  filtrar() { const t = this.busca.toLowerCase(); this.filtrados = this.clientes.filter(c => c.nome.toLowerCase().includes(t) || (c.telefone||'').includes(t)); }

  async novo() {
    const a = await this.alert.create({
      header: 'Novo Cliente',
      inputs: [
        { name:'nome',     type:'text',  placeholder:'Nome completo *' },
        { name:'telefone', type:'tel',   placeholder:'Telefone' },
        { name:'email',    type:'email', placeholder:'E-mail' },
        { name:'cpf',      type:'text',  placeholder:'CPF' },
      ],
      buttons: [
        { text:'Cancelar', role:'cancel' },
        { text:'Salvar', handler: async (d) => {
          if (!d.nome) return false;
          const n = await this.svc.criar(d);
          this.clientes.unshift(n); this.filtrar();
          const t = await this.toast.create({ message:'Cliente cadastrado!', duration:2000, color:'success', position:'top' }); t.present();
          return true;
        }}
      ]
    });
    await a.present();
  }

  async detalhe(c: any) {
    const a = await this.alert.create({
      header: c.nome,
      message: `📱 ${c.telefone||'—'} | 📧 ${c.email||'—'}<br>💰 Total gasto: R$ ${Number(c.total_gasto).toFixed(2)}`,
      buttons: ['Fechar']
    });
    await a.present();
  }
}
