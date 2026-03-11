import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon,
  LoadingController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon],
  template: `
<ion-content>
  <div class="wrap">
    <div class="logo">
      <div class="pill">💊</div>
      <h1>PharmaApp</h1>
      <p>Gestão inteligente para farmácias</p>
    </div>
    <div class="card">
      <ion-item lines="none" class="field">
        <ion-label position="stacked">E-mail</ion-label>
        <ion-input type="email" [(ngModel)]="email" placeholder="seu@email.com" autocomplete="email"></ion-input>
      </ion-item>
      <ion-item lines="none" class="field">
        <ion-label position="stacked">Senha</ion-label>
        <ion-input [type]="show?'text':'password'" [(ngModel)]="senha" placeholder="••••••••"></ion-input>
        <ion-button slot="end" fill="clear" (click)="show=!show">
          <ion-icon [name]="show?'eye-off-outline':'eye-outline'"></ion-icon>
        </ion-button>
      </ion-item>
      <ion-button expand="block" class="btn" (click)="entrar()">Entrar</ion-button>
    </div>
  </div>
</ion-content>`,
  styles: [`
    ion-content { --background: #09090b; }
    .wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100%; padding:32px 24px; }
    .logo { text-align:center; margin-bottom:40px; }
    .pill { font-size:56px; }
    h1 { color:#fff; font-size:26px; font-weight:700; margin:10px 0 4px; }
    p  { color:#52525b; font-size:13px; margin:0; }
    .card { width:100%; max-width:400px; background:#111; border:1px solid #27272a; border-radius:20px; padding:24px; }
    .field { --background:#18181b; --border-radius:12px; margin-bottom:12px; border-radius:12px; }
    .field ion-label { color:#71717a !important; font-size:11px !important; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
    .field ion-input { --color:#fff; --placeholder-color:#3f3f46; }
    .btn { --background:#0d9488; --border-radius:12px; --color:#fff; font-weight:700; height:50px; margin-top:20px; }
  `]
})
export class LoginPage {
  email = ''; senha = ''; show = false;

  constructor(
    private auth: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { addIcons({ eyeOutline, eyeOffOutline }); }

  async entrar() {
    if (!this.email || !this.senha) return;
    const l = await this.loadingCtrl.create({ message: 'Entrando...' });
    await l.present();
    try {
      await this.auth.login(this.email, this.senha);
    } catch {
      const t = await this.toastCtrl.create({ message: 'E-mail ou senha incorretos', duration: 3000, color: 'danger', position: 'top' });
      t.present();
    } finally { l.dismiss(); }
  }
}
