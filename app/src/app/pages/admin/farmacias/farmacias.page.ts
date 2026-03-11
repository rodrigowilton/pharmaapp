import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton,
  IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonSearchbar,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, pauseCircleOutline, playCircleOutline } from 'ionicons/icons';
import { FarmaciasService } from '../../../services/data.services';

@Component({
  selector: 'app-farmacias',
  standalone: true,
  imports: [CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBackButton,
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonSpinner, IonSearchbar],
  template: `
<ion-header>
  <ion-toolbar>
    <ion-back-button defaultHref="/admin/dashboard" slot="start"></ion-back-button>
    <ion-title>Farmácias ({{filtradas.length}})</ion-title>
    <ion-buttons slot="end"><ion-button (click)="nova()"><ion-icon name="add-outline"></ion-icon></ion-button></ion-buttons>
  </ion-toolbar>
  <ion-toolbar>
    <ion-searchbar [(ngModel)]="busca" (ionInput)="filtrar()" placeholder="Buscar..." debounce="300"></ion-searchbar>
  </ion-toolbar>
</ion-header>

<ion-content class="dark-bg">
  <div class="p16">
    <div *ngIf="loading" class="center"><ion-spinner color="primary"></ion-spinner></div>
    <ion-list *ngIf="!loading">
      <ion-item *ngFor="let f of filtradas" class="list-item">
        <div slot="start" class="avatar">{{f.nome[0]}}</div>
        <ion-label>
          <h2>{{f.nome}}</h2>
          <p>{{f.responsavel}}</p>
          <p>{{f.cidade}}/{{f.estado}} · {{f.plano | titlecase}} · {{f.total_clientes}} clientes</p>
        </ion-label>
        <div slot="end" class="end-col">
          <ion-badge [color]="f.status==='ativa'?'success':'danger'">{{f.status}}</ion-badge>
          <ion-button fill="clear" size="small" (click)="toggle(f)">
            <ion-icon [name]="f.status==='ativa'?'pause-circle-outline':'play-circle-outline'"
                      [color]="f.status==='ativa'?'warning':'success'"></ion-icon>
          </ion-button>
        </div>
      </ion-item>
    </ion-list>
    <div class="empty" *ngIf="!loading && filtradas.length===0">Nenhuma farmácia encontrada.</div>
  </div>
</ion-content>`
})
export class FarmaciasPage implements OnInit {
  farmacias: any[] = []; filtradas: any[] = []; busca = ''; loading = true;

  constructor(private svc: FarmaciasService, private alert: AlertController, private toast: ToastController) {
    addIcons({ addOutline, pauseCircleOutline, playCircleOutline });
  }

  async ngOnInit() { this.farmacias = await this.svc.listar(); this.filtrar(); this.loading = false; }

  filtrar() {
    const t = this.busca.toLowerCase();
    this.filtradas = this.farmacias.filter(f => f.nome.toLowerCase().includes(t) || (f.cidade||'').toLowerCase().includes(t));
  }

  async nova() {
    const a = await this.alert.create({
      header: 'Nova Farmácia',
      inputs: [
        { name:'nome',              type:'text',     placeholder:'Nome da farmácia *' },
        { name:'responsavel',       type:'text',     placeholder:'Responsável *' },
        { name:'email',             type:'email',    placeholder:'E-mail de acesso *' },
        { name:'telefone',          type:'tel',      placeholder:'Telefone' },
        { name:'cidade',            type:'text',     placeholder:'Cidade' },
        { name:'estado',            type:'text',     placeholder:'Estado (ex: SP)' },
        { name:'senha_responsavel', type:'password', placeholder:'Senha de acesso *' },
      ],
      buttons: [
        { text:'Cancelar', role:'cancel' },
        { text:'Salvar', handler: async (d) => {
          if (!d.nome || !d.email || !d.senha_responsavel) return false;
          try {
            const nova = await this.svc.criar(d);
            this.farmacias.unshift(nova); this.filtrar();
            this.ok('Farmácia criada! Login: ' + d.email);
          } catch (e: any) { this.err(e?.error?.erro || 'Erro ao criar.'); }
          return true;
        }}
      ]
    });
    await a.present();
  }

  async toggle(f: any) {
    const novo = f.status === 'ativa' ? 'suspensa' : 'ativa';
    await this.svc.alterarStatus(f.id, novo);
    f.status = novo;
    this.ok(`Farmácia ${novo}!`);
  }

  private async ok(m: string)  { const t = await this.toast.create({ message:m, duration:2500, color:'success', position:'top' }); t.present(); }
  private async err(m: string) { const t = await this.toast.create({ message:m, duration:3000, color:'danger',  position:'top' }); t.present(); }
}
