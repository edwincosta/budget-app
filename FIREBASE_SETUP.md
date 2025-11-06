# 🔥 CONFIGURAÇÃO DO FIREBASE HOSTING

## 📋 **PRÉ-REQUISITOS**

### **1. Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

### **2. Verificar instalação**
```bash
firebase --version
```

## 🚀 **CONFIGURAÇÃO PASSO A PASSO**

### **1. Login no Firebase**
```bash
firebase login
```
- Abrirá o navegador para login
- Use sua conta Google
- Autorize o Firebase CLI

### **2. Criar projeto no Firebase Console**
1. Acesse: https://console.firebase.google.com
2. Clique em "Criar projeto"
3. Nome: `budget-app` (ou outro nome)
4. Desabilite Google Analytics (opcional)
5. Crie o projeto

### **3. Inicializar projeto local**
```bash
firebase init hosting
```

Respostas recomendadas:
- **Projeto**: Selecione o projeto criado
- **Public directory**: `client/dist`
- **Single-page app**: `Yes` 
- **Automatic builds**: `No`
- **Overwrite index.html**: `No`

### **4. Configurar variáveis do cliente**

Edite `client/.env.production`:
```bash
VITE_API_URL=https://seu-backend-url.railway.app
```

### **5. Build e Deploy**
```bash
# Build do cliente
cd client
npm run build
cd ..

# Deploy para Firebase
firebase deploy --only hosting
```

## 🔧 **CONFIGURAÇÃO AVANÇADA**

### **Firebase.json otimizado**
```json
{
  "hosting": {
    "public": "client/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          {
            "key": "Cache-Control", 
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### **Script automatizado**
Use o script `deploy-firebase.ps1`:
```bash
./deploy-firebase.ps1
```

## 📊 **COMANDOS ÚTEIS**

```bash
# Preview local
firebase serve --only hosting

# Status do projeto
firebase projects:list

# Ver hosting ativo
firebase hosting:sites:list

# Logs de deploy
firebase deploy --only hosting --debug

# Rollback (voltar versão)
firebase hosting:rollback
```

## 🎯 **FLUXO COMPLETO DE DEPLOY**

### **Primeira vez**
1. ✅ Instalar Firebase CLI
2. ✅ Login no Firebase
3. ✅ Criar projeto no console
4. ✅ Inicializar projeto local
5. ✅ Configurar .env.production
6. ✅ Build e deploy

### **Deploys subsequentes**
1. ✅ Fazer alterações no código
2. ✅ Atualizar .env se necessário
3. ✅ Build do cliente
4. ✅ Deploy para Firebase

## ⚠️ **IMPORTANTES**

### **Custos**
- ✅ **Hosting gratuito**: 10GB storage + 1GB transfer/mês
- ✅ **Domínio gratuito**: `.web.app` e `.firebaseapp.com`
- ✅ **SSL automático**: Certificado HTTPS incluído

### **Limites do tier gratuito**
- 10GB de armazenamento
- 1GB de transferência por mês
- 1 domínio customizado gratuito

### **Para 2 usuários**
Você usará menos de 1% dos limites gratuitos!

## 🌐 **PRÓXIMOS PASSOS**

Após o deploy do Firebase:
1. ✅ Configure o backend (Railway/Render)
2. ✅ Atualize VITE_API_URL com URL real do backend
3. ✅ Re-deploy do Firebase com nova configuração
4. ✅ Teste a aplicação completa