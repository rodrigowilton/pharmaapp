# 💊 PharmaApp

App de gestão para farmácias | PostgreSQL + Node.js API + Ionic/Capacitor

---

## 📁 ESTRUTURA DO PROJETO

```
pharmaapp-completo/
│
├── banco/
│   └── setup.sql          ← rode no PostgreSQL do EasyPanel
│
├── api/                   ← suba como serviço no EasyPanel
│   ├── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example       ← copie para .env e preencha
│
└── app/                   ← app Ionic (mobile + web)
    ├── package.json
    ├── angular.json
    ├── capacitor.config.ts
    └── src/
        ├── main.ts
        ├── index.html
        ├── global.scss
        ├── environments/
        │   └── environment.ts  ← coloque a URL da sua API aqui
        └── app/
            ├── app.component.ts
            ├── app.config.ts
            ├── app.routes.ts
            ├── guards/guards.ts
            ├── services/
            │   ├── api.service.ts
            │   ├── auth.service.ts
            │   └── data.services.ts
            └── pages/
                ├── auth/login/
                ├── admin/dashboard/
                ├── admin/farmacias/
                ├── farmacia/dashboard/
                ├── farmacia/clientes/
                ├── farmacia/produtos/
                ├── farmacia/pedidos/
                └── cliente/home/
```

---

## 🚀 PASSO 1 — Banco de Dados (5 min)

No EasyPanel, clique no serviço **postgres** → ícone **>_** (terminal):

```bash
psql -U postgres
```

Depois cole TODO o conteúdo do arquivo `banco/setup.sql` e pressione Enter.

✅ Isso cria: banco, tabelas, triggers, views e usuário admin padrão.

**Login admin padrão:**
- E-mail: `admin@pharmaapp.com`
- Senha: `admin123`  ← troque depois!

---

## 🚀 PASSO 2 — API no EasyPanel (5 min)

1. EasyPanel → **+ Service → App**
2. Nome: `pharmaapp-api`
3. Source: faça upload da pasta `api/` **ou** aponte para o GitHub
4. Em **Environment Variables** adicione:

```
PORT=3333
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pharmaapp
DB_USER=pharmaapp_api
DB_PASSWORD=ApiSenha123!
JWT_SECRET=coloque-uma-frase-secreta-longa-aqui-minimo-32-chars
```

5. **Port:** `3333`
6. Clique **Deploy**

✅ Teste: `http://SEU_IP:3333/health` → deve retornar `{"ok":true}`

---

## 🚀 PASSO 3 — Configurar o App (1 min)

Abra `app/src/environments/environment.ts` e troque:

```typescript
apiUrl: 'http://SEU_IP_OU_DOMINIO:3333'
```

---

## 🚀 PASSO 4 — Rodar o App

```bash
# Instalar dependências globais (só uma vez)
npm install -g @ionic/cli

# Entrar na pasta do app
cd app
npm install

# Testar no navegador
ionic serve

# Gerar APK Android
ionic build
ionic capacitor add android
ionic capacitor sync android
# Abra o Android Studio → Build → Generate Signed APK
```

---

## 📤 SUBIR PARA O GIT

```bash
# Na raiz do projeto (pharmaapp-completo/)
git init
git add .
git commit -m "feat: PharmaApp inicial"
git remote add origin https://github.com/SEU_USUARIO/pharmaapp.git
git push -u origin main
```

No EasyPanel, ao configurar a API, você pode apontar direto pro repositório GitHub
e o EasyPanel vai fazer deploy automático a cada push!

---

## 👥 PERFIS DE ACESSO

| Perfil | Como criar | Acesso |
|--------|-----------|--------|
| Admin | Já existe (setup.sql) | Gerencia todas as farmácias |
| Farmácia | Admin cria pelo painel | Gerencia sua farmácia |
| Cliente | A ser implementado | Vê seus pedidos |

---

## 🔌 ENDPOINTS DA API

| Método | Rota | Quem usa |
|--------|------|----------|
| POST | /auth/login | todos |
| GET  | /admin/stats | admin |
| GET  | /admin/farmacias | admin |
| POST | /admin/farmacias | admin |
| PATCH| /admin/farmacias/:id/status | admin |
| GET  | /farmacia/clientes | farmacia |
| POST | /farmacia/clientes | farmacia |
| PUT  | /farmacia/clientes/:id | farmacia |
| GET  | /farmacia/produtos | farmacia |
| POST | /farmacia/produtos | farmacia |
| PUT  | /farmacia/produtos/:id | farmacia |
| GET  | /farmacia/pedidos | farmacia |
| POST | /farmacia/pedidos | farmacia |
| PATCH| /farmacia/pedidos/:id/status | farmacia |
| GET  | /cliente/meus-pedidos | cliente |
