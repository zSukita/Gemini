# 🎲 ArcanaSheet • Virtual Tabletop (VTT) & Ficha D&D 5e

O **ArcanaSheet** é uma plataforma completa e moderna para RPG de mesa baseada no sistema D&D 5ª Edição (SRD 5.1). Combina ficha de personagem inteligente e reativa, gerenciador de combates por turnos, mapa de batalha tático em grade com névoa de guerra, Mestre de IA (Oráculo de Narrativa) com suporte a múltiplos provedores, multijogador em tempo real (PeerJS e Firestore) e ambiência sonora de fantasia.

Disponível como **Web App (PWA)** e aplicativo **Desktop nativo (Electron)**.

---

## ⚡ Principais Funcionalidades

1. **Ficha de Personagem D&D 5e Reativa & Segura**
   - Cálculo automático de bônus de proficiência, modificadores de atributos, Classe de Armadura, Percepção Passiva e CD de magias.
   - Gerenciamento de Vida (PV atual, máximo, temporário), Salvaguardas contra a Morte, Dados de Vida, Descanso Curto e Longo.
   - Inventário com cálculo de carga e moedas, Grimório com slots de magia por círculo, Rastreador de Recursos e Ações de Classe.
   - Sanitizador central rigoroso contra dados corrompidos, injeção de script ou números infinitos/NaN em qualquer entrada (arquivos JSON, nuvem ou P2P).

2. **Mesa Virtual (VTT) & Mapa de Batalha Tático**
   - Grid interativo personalizável (quadrados, cores de linha, opacidade e zoom).
   - Movimentação de tokens de jogadores e monstros sincronizados em tempo real.
   - Névoa de guerra (Fog of War) dinâmica com ferramentas de revelação e ocultamento para o Mestre.
   - Biblioteca de mapas pré-definidos (Masmorra, Taverna, Floresta, Ruínas) e suporte a upload de mapas locais.

3. **Rastreador de Encontros & Combate**
   - Rolagem automática e ordenação de iniciativa para monstros e personagens.
   - Aplicação de dano/cura com suporte a acertos críticos e histórico de desfazer (Undo).
   - Economia de ação (Ação, Ação Bônus, Reação) e gerenciamento de condições de status (Amedrontado, Caído, Envenenado, etc.).
   - Bestiário completo com mais de 300 monstros oficiais do SRD 5.1 com blocos de estatísticas detalhados.

4. **Mestre Supremo de IA (Oráculo de Narrativa)**
   - Integração com a API Google Gemini (usando o SDK oficial `@google/genai`) e suporte opcional a Groq, OpenAI ou modelos locais.
   - Leitura inteligente do contexto de combate atual, ficha de quem falou e histórico recente.
   - Capacidade de gerar propostas mecânicas (surgimento de monstros, movimentação no mapa, cartas e pergaminhos narrativos / *Handouts*).

5. **Multijogador & Campanhas na Nuvem**
   - Sincronização direta P2P com baixa latência via WebRTC (PeerJS) para rolagem de dados e mapa.
   - Campanhas na nuvem com autenticação Firebase, códigos de mesa (`ARC-XXXXXX`), controle estrito de ingresso por convite e pistas (*Handouts*) transmitidas pelo Mestre.

---

## 🔒 Arquitetura de Isolamento & Integridade de Dados

- **Isolamento por Conta**: Todos os dados pessoais (fichas, encontros, mapa de batalha, histórico do Mestre IA e campanhas locais) utilizam chaves com escopo do UID do usuário (`_${userId}`).
- **Prevenção de Corrupção em Trocas de Conta**: Operações assíncronas pendentes, requisições de nuvem e temporizadores de debounce de salvamento são cancelados imediatamente no logout ou na troca de usuário.
- **Tratamento de Quota**: Em caso de limite de armazenamento local do navegador atingido (`QuotaExceededError`), caches dispensáveis são limpos automaticamente e o usuário é notificado via evento do sistema.
- **Exclusão Segura de Campanhas**: Subcoleções de *Handouts* e convites são excluídos antes do documento pai da campanha, em lotes atômicos de até 400 operações (respeitando o limite de 500 do Firestore) e preservando a integridade local caso haja falhas intermediárias na rede.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Build & Ferramental**: Vite 8, Rolldown / Vite bundler, Oxlint (linter ultra-rápido), Vitest.
- **Backend & Cloud**: Firebase (Authentication, Cloud Firestore, Firebase Hosting, Emuladores locais).
- **IA**: Google Gemini API (`@google/genai`), Groq SDK.
- **Networking**: PeerJS (WebRTC P2P DataChannels).
- **Desktop & Mobile**: Electron (Windows/Linux/Mac), Progressive Web App (PWA com Service Worker offline-first e CSP estrito).

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
- **Node.js**: versão 20 ou superior.
- **Java**: versão 21 ou superior (necessário apenas para executar os emuladores locais do Firebase).

### 1. Clonar o repositório e instalar dependências
```bash
git clone <url-do-repositorio>
cd arcanasheet
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as chaves do Firebase e do Google Gemini:
```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id

# Chave de API do Google Gemini (para o Mestre IA)
VITE_GEMINI_API_KEY=sua-gemini-api-key
```

### 3. Executar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:5173`.

---

## 🧪 Testes Automatizados & Verificação de Regras

O projeto conta com mais de 40 suítes de testes unitários e de integração cobrindo cálculo de regras, sanitização de dados, hooks de estado e regras de segurança do Firestore:

```bash
# Executa todos os testes unitários com Vitest
npm test

# Executa os testes de regras de segurança contra o Emulador local do Firestore
npm run test:rules

# Executa lint de código com Oxlint
npm run lint

# Verificação completa de tipos com TypeScript
npx tsc -b

# Pipeline completo de CI (Lint + Typecheck + Unit Tests + Rules Emulator + Build)
npm run ci
```

---

## 🚢 Deploy & Publicação

A publicação é separada em alvos explícitos para evitar que regras de segurança permaneçam desatualizadas na nuvem:

```bash
# 1. Compilar e publicar apenas o Web Hosting
npm run deploy:hosting

# 2. Publicar regras de segurança do Firestore (firestore.rules)
npm run deploy:rules

# 3. Compilar e publicar ambos (Hosting + Regras)
npm run deploy:all
```

---

## 🖥️ Execução & Empacotamento Desktop (Electron)

```bash
# Iniciar em modo de desenvolvimento com hot-reload
npm run electron:dev

# Testar o bundle de produção no Electron
npm run electron:preview

# Gerar instalador executável para Windows (.exe / NSIS e Portable)
npm run electron:dist
```

---

## 📋 Licença e Atribuição de Terceiros

Este projeto utiliza regras e monstros sob a licença **Open Game License (OGL 1.0a)** e **System Reference Document 5.1 (SRD 5.1)** disponibilizado pela *Wizards of the Coast*. Conteúdos específicos e artes adicionais pertencem aos seus respectivos criadores.
