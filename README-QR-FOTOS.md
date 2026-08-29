# 📸 Sistema de Fotos com QR Code + Google Drive

Um sistema web elegante para capturar fotos via câmera e enviá-las automaticamente para o Google Drive. Perfeito para casamentos e eventos!

## 🚀 Como usar

### 1. **Arquivos criados:**
- `qr-fotos.html` - Interface principal
- `qr-style.css` - Estilos
- `qr-script.js` - Lógica da aplicação

### 2. **Fluxo de funcionamento:**
```
┌─────────────┐
│  QR Code    │  ← Exibe código QR para escanear
│   View      │
└──────┬──────┘
       │ (ao escanear)
       ↓
┌─────────────┐
│  Câmera     │  ← Abre câmera automaticamente
│   View      │
└──────┬──────┘
       │ (tirar foto)
       ↓
┌─────────────┐
│  Preview    │  ← Confirma/edita/envia foto
│   View      │
└──────┬──────┘
       │ (enviar)
       ↓
┌─────────────┐
│Google Drive │  ← Arquivo salvo automaticamente
└─────────────┘
```

---

## 🔧 Configuração do Google Drive

### Passo 1: Criar Projeto no Google Cloud

1. Acesse: **https://console.cloud.google.com/**
2. Clique em **"Criar um projeto"**
3. Dê um nome: `"Casamento Fotos"` (ou similar)
4. Espere criar

### Passo 2: Ativar Google Drive API

1. No menu lateral, procure por **"APIs e Serviços"**
2. Clique em **"Biblioteca"**
3. Procure por **"Google Drive API"**
4. Clique e depois **"ATIVAR"**

### Passo 3: Criar Credenciais OAuth2

1. Volte para **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"**
3. Escolha **"ID do cliente OAuth 2.0"**
4. Selecione **"Aplicação web"**
5. Dê um nome: `"Fotos Casamento Web"`
6. Em **"URIs autorizados de origem"**, adicione:
   - `http://localhost:5500`
   - `http://localhost:3000`
   - `http://127.0.0.1:5500`
   - Seu domínio final (se tiver)
7. Clique em **"Criar"**
8. **Copie o "ID do cliente"** que aparecer

### Passo 4: Configurar no Script

1. Abra o arquivo `qr-script.js`
2. Na linha 8, encontre:
   ```javascript
   const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';
   ```
3. Substitua `'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com'` pelo seu Client ID copiado

### Passo 5 (Opcional): Especificar Pasta do Google Drive

Por padrão, as fotos são salvas na raiz do Drive. Para salvar em uma pasta específica:

1. Abra o Google Drive
2. Crie uma pasta (ex: `"Fotos Casamento"`)
3. Abra a pasta e copie o ID da URL:
   ```
   https://drive.google.com/drive/folders/PASTA_ID_AQUI
   ```
4. No `qr-script.js`, linha 13:
   ```javascript
   const GOOGLE_DRIVE_FOLDER_ID = 'PASTA_ID_AQUI';
   ```

---

## 🏃 Como rodar localmente

### Opção 1: Com Python
```bash
cd /home/pc/Documentos/casamento
python -m http.server 5500
```
Acesse: `http://localhost:5500/qr-fotos.html`

### Opção 2: Com Node.js (http-server)
```bash
npm install -g http-server
cd /home/pc/Documentos/casamento
http-server -p 5500
```

### Opção 3: Live Server no VS Code
1. Instale a extensão "Live Server"
2. Clique direito no `qr-fotos.html`
3. Escolha "Open with Live Server"

---

## 📱 Como usar no evento

### Para quem vai tirar as fotos (Admin):
1. Abra `qr-fotos.html` em um PC/Tablet
2. Veja o QR Code na tela
3. Deixe exibindo na tela grande ou impressão

### Para os convidados:
1. Escaneia o QR Code com o celular
2. Câmera abre automaticamente
3. Tira a foto
4. Clica "Enviar para Drive"
5. Pronto! Foto já está no Google Drive

---

## 🎨 Personalização

### Mudar cores
Edite `qr-style.css`:
- `#60483c` - Cor principal (marrom)
- `#a77b62` - Cor secundária (laranja)
- Procure por `background`, `color` etc

### Mudar fontes
No `qr-fotos.html`, mude a linha:
```html
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
```

### Mudar textos
Procure por elementos como:
- `<h1>Compartilhe sua foto!</h1>`
- `<p class="qr-subtitle">Escaneie o código QR...</p>`

---

## ⚠️ Possíveis problemas

### "Câmera não abre"
- ✓ Verificar permissões do navegador
- ✓ Usar HTTPS em produção (HTTP local é OK)
- ✓ Testar em Chrome/Edge (melhor suporte)

### "Erro ao autenticar com Google"
- ✓ Verificar Client ID está correto
- ✓ Verificar origem autorizada (localhost, domínio)
- ✓ Limpar cache do navegador (Ctrl+Shift+Del)

### "Upload não funciona"
- ✓ Verificar Google Drive API está ativada
- ✓ Verificar permissões OAuth2
- ✓ Checar console (F12 → Console) para erros

---

## 🔐 Segurança

- **Client-side**: O token OAuth2 fica apenas no navegador
- **HTTPS recomendado**: Para produção, use HTTPS
- **Pasta separada**: Use uma pasta específica no Drive para fotos do evento
- **Compartilhamento**: Configure quem pode acessar a pasta no Drive

---

## 📞 Dúvidas?

Consulte:
- [Google Drive API Docs](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth2 Flow](https://developers.google.com/identity/oauth2/web/guides/how-oauth-2-works)
- Console do navegador (F12) para mensagens de erro

---

**Bom evento! 💕**
