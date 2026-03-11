import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton,
  IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonSearchbar,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { ProdutosService } from '../../../services/data.services';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton,
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonSearchbar],
  template: `
<ion-header>
  <ion-toolbar>
    <ion-back-button defaultHref="/farmacia/dashboard" slot="start"></ion-back-button>
    <ion-title>Produtos ({{filtrados.length}})</ion-title>
    <ion-buttons slot="end"><ion-button (click)="novo()"><ion-icon name="add-outline"></ion-icon></ion-button></ion-buttons>
  </ion-toolbar>
  <ion-toolbar>
    <ion-searchbar [(ngModel)]="busca" (ionInput)="filtrar()" placeholder="Buscar produto..." debounce="300"></ion-searchbar>
  </ion-toolbar>
</ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div *ngIf="loading" class="center"><ion-spinner color="primary"></ion-spinner></div>
    <ion-list *ngIf="!loading">
      <ion-item *ngFor="let p of filtrados" class="list-item">
        <div slot="start" style="font-size:24px;width:40px;text-align:center">{{p.precisa_receita?'💊':'🧴'}}</div>
        <ion-label>
          <h2>
            {{p.nome}}
            <ion-badge *ngIf="p.precisa_receita" color="danger" style="font-size:9px;margin-left:4px">Receita</ion-badge>
          </h2>
          <p>{{p.categoria_nome || 'Sem categoria'}}</p>
        </ion-label>
        <div slot="end" class="end-col">
          <span class="valor">R$ {{p.preco | number:'1.2-2'}}</span>
          <span [style.color]="p.estoque<=p.estoque_minimo?'#ef4444':'#71717a'" style="font-size:12px">{{p.estoque}} un.</span>
        </div>
      </ion-item>
    </ion-list>
    <div class="empty" *ngIf="!loading && filtrados.length===0">Nenhum produto cadastrado.</div>
  </div>
</ion-content>`
})
export class ProdutosPage implements OnInit {
  produtos: any[] = []; filtrados: any[] = []; busca = ''; loading = true;
  constructor(private svc: ProdutosService, private alert: AlertController, private toast: ToastController) {
    addIcons({ addOutline });
  }
  async ngOnInit() { this.produtos = await this.svc.listar(); this.filtrar(); this.loading = false; }
  filtrar() { const t = this.busca.toLowerCase(); this.filtrados = this.produtos.filter(p => p.nome.toLowerCase().includes(t)); }

  async novo() {
    const a = await this.alert.create({
      header: 'Novo Produto',
      inputs: [
        { name:'nome',     type:'text',   placeholder:'Nome do produto *' },
        { name:'preco',    type:'number', placeholder:'Preço ex: 12.50 *' },
        { name:'estoque',  type:'number', placeholder:'Estoque inicial' },
        { name:'descricao',type:'text',   placeholder:'Descrição (opcional)' },
      ],
      buttons: [
        { text:'Cancelar', role:'cancel' },
        { text:'Salvar', handler: async (d) => {
          if (!d.nome || !d.preco) return false;
          const n = await this.svc.criar({ ...d, preco: parseFloat(d.preco), estoque: parseInt(d.estoque||'0') });
          this.produtos.unshift(n); this.filtrar();
          const t = await this.toast.create({ message:'Produto cadastrado!', duration:2000, color:'success', position:'top' }); t.present();
          return true;
        }}
      ]
    });
    await a.present();
  }
}
