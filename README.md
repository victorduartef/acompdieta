# Macro Tracker — Victão

App de rastreamento de macros e calorias com Firebase + Vercel.

---

## Pré-requisitos
- Node.js 18+ instalado
- Conta no GitHub
- Conta no Firebase (console.firebase.google.com)
- Conta no Vercel (vercel.com)

---

## PASSO 1 — Configurar o Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **"Adicionar projeto"** → dê um nome (ex: `macro-tracker-victao`)
3. Desative o Google Analytics (opcional) → **Criar projeto**

### Ativar Firestore
4. No menu lateral: **Build > Firestore Database**
5. Clique **"Criar banco de dados"**
6. Escolha **"Iniciar no modo de teste"** → escolha região (us-east1 ou southamerica-east1) → **Ativar**

### Ativar Authentication
7. No menu lateral: **Build > Authentication**
8. Clique **"Começar"**
9. Na aba **"Sign-in method"**, ative **"Anônimo"** → Salvar

### Pegar as credenciais
10. No menu lateral: **Configurações do projeto** (ícone de engrenagem)
11. Role até **"Seus apps"** → clique em **"</>"** (Web)
12. Dê um nome ao app → **Registrar app**
13. Copie o objeto `firebaseConfig` — você vai precisar dos valores

---

## PASSO 2 — Configurar o projeto local

```bash
# Clone ou baixe os arquivos deste projeto
cd macro-tracker-app

# Instale as dependências
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env.local
```

Abra o `.env.local` e preencha com os valores do Firebase:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Testar localmente
```bash
npm run dev
```
Acesse http://localhost:5173

---

## PASSO 3 — Subir para o GitHub

```bash
# Dentro da pasta do projeto
git init
git add .
git commit -m "primeiro commit"

# Crie um repositório no GitHub (github.com/new)
# Depois:
git remote add origin https://github.com/SEU_USUARIO/macro-tracker.git
git branch -M main
git push -u origin main
```

---

## PASSO 4 — Deploy no Vercel

1. Acesse https://vercel.com → **Add New Project**
2. Importe o repositório do GitHub que você criou
3. Vercel detecta automaticamente que é Vite → clique **Deploy**

### Adicionar as variáveis de ambiente no Vercel
4. Vá em **Settings > Environment Variables**
5. Adicione cada variável do `.env.example` com os valores reais do Firebase:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Após adicionar todas, vá em **Deployments** → clique nos 3 pontos → **Redeploy**

---

## PASSO 5 — Regras de segurança do Firestore (opcional mas recomendado)

No Firebase Console > Firestore > Regras, substitua por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Isso garante que cada usuário só acessa os próprios dados.

---

## Como funciona o armazenamento

- O app usa **autenticação anônima** do Firebase — sem precisar de login/senha
- Cada dispositivo recebe um UID único e os dados ficam salvos no Firestore vinculados a esse UID
- Os dados sincronizam automaticamente entre sessões no mesmo dispositivo
- Se o usuário limpar o cache do navegador, um novo UID será criado e os dados anteriores não serão recuperados

---

## Atualizações futuras

Para atualizar o app depois de fazer mudanças:
```bash
git add .
git commit -m "descrição da mudança"
git push
```
O Vercel faz o redeploy automático.
