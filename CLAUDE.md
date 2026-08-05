# CLAUDE.md — Contexto do Projeto para Claude Code

Este arquivo serve como contexto principal para o desenvolvimento, manutenção e evolução deste projeto no ambiente Claude Code.

---

## 📌 1. Visão Geral do Projeto

O **Portfolio uMorgan** é o site pessoal e profissional de **João Morgan** (Programador Full Stack na **Trads Corretora** e Engenheiro de Software/Dados em João Pessoa, PB). 
O projeto destaca habilidades em desenvolvimento full-stack, pipelines de ingestão de dados, modelagem de banco de dados, dashboards sobre sistemas fechados e ambientes de aprendizado por reforço (Reinforcement Learning).

### Destaques de Design e UX:
- **Animação de Abertura (FLIP)**: Animação SVG com montagem das peças do logo e transição fluida para o cabeçalho.
- **Hero 3D Interativo**: Pilha 3D CSS de camadas de arquitetura com efeito parallax ligado ao cursor e física no scroll.
- **Carrossel Interativo de Stack**: Vitrine interativa de 10 tecnologias com filtros por categoria (Backend, Banco, DevOps, IA, Frontend), ícones SVG glow, navegação responsiva, drag/touch e rotação automática com pausa no hover.
- **Linha do Tempo (Spine)**: Eixo vertical progressivo na seção de trajetória que se acende ao longo do scroll.
- **Cenas Interativas dos Projetos**: Animações SVG em 4 atos baseadas no progresso da rolagem para 4 projetos (Pipeline CDC, BI/SQL, Discador VoIP e Ambientes Gym RL).
- **Cursor Customizado**: Anel amortecido e ponto central ativado em dispositivos de ponteiro preciso (`pointer: fine`).
- **Suporte a Acessibilidade**: Animações adaptadas e suavizadas quando `prefers-reduced-motion` é ativado no sistema operacional.

---

## 🛠️ 2. Stack Tecnológica

| Camada | Tecnologia | Detalhes / Bibliotecas |
| :--- | :--- | :--- |
| **Linguagem Base** | HTML5 / JavaScript / CSS3 | Vanilla Web Standards (sem TypeScript, sem React/Vue) |
| **CSS Framework** | Tailwind CSS v4 | Carregado via CDN (`@tailwindcss/browser@4`) para classes utilitárias |
| **Estilização Customizada** | CSS3 Vanilla | Tokens HSL/Hex em `:root`, CSS `@property`, Flexbox, Grid e 3D Transforms |
| **Tipografia** | Google Fonts | `Barlow Condensed` (Headings), `Chivo` (Body), `IBM Plex Mono` (Technical) |
| **Gráficos & Animações** | SVG + CSS3 + JS | Animações vetoriais, medição dinâmica via `.getTotalLength()`, interpolação via mola física |
| **Servidor de Dev** | Python 3 / PowerShell | `servir.py` (Python) ou `servir.ps1` (PowerShell) com controle de cache desativado |

---

## 📁 3. Estrutura de Arquivos

```
portfolio-umorgan/
├── assets/
│   ├── avatar.jpg       # Foto de perfil de João Morgan
│   ├── favicon.svg      # Favicon vetorial do site
│   └── logo.svg         # Logo SVG do uMorgan
├── index.html           # Página principal com todas as seções e marcações semânticas
├── main.js              # Lógica JS principal (abertura, motor de rolagem, molas, observers, cursor)
├── styles.css           # Estilos globais, tokens, animações de intro, hero 3D e cursor
├── scenes.css           # Animações e físicas SVG dos projetos (Pipeline, BI, Discador, Gym)
├── scroll-teste.html    # Ferramenta de diagnóstico manual de eventos de mouse e rolagem
├── servir.py            # Servidor local HTTP em Python (porta 8899) com anti-cache
├── servir.ps1           # Servidor local HTTP em PowerShell (porta 8899) com anti-cache
├── AGY.md               # Contexto principal do projeto (Antigravity)
└── CLAUDE.md            # Contexto principal do projeto (Claude Code)
```

### Detalhamento dos Principais Arquivos:

- **[`index.html`](file:///C:/Users/jogop/OneDrive/%C3%81rea%20de%20Trabalho/portfolio-umorgan/index.html)**: 
  Contém o HTML semântico com seções `#scene` (Hero 3D), `#sobre`, `#trajetoria`, `#projetos` (Pipeline, BI, Discador VoIP, Gym RL), `#tcc` e `#contato`.
- **[`main.js`](file:///C:/Users/jogop/OneDrive/%C3%81rea%20de%20Trabalho/portfolio-umorgan/main.js)**: 
  Gerencia a animação FLIP de abertura, o motor de rolagem suave com amortecimento para mouses no Windows, o loop de molas físicas (`requestAnimationFrame`), o efeito Parallax 3D do Hero e os `IntersectionObserver`s dos elementos `.rise` e `.node`.
- **[`styles.css`](file:///C:/Users/jogop/OneDrive/%C3%81rea%20de%20Trabalho/portfolio-umorgan/styles.css)**: 
  Define as variáveis globais (`--ink`, `--amber`, `--cyan`, etc.), `@property` para variáveis numéricas CSS, o plano 3D (`perspective: 1400px`, `transform-style: preserve-3d`), estilos do cursor e marca d'água.
- **[`scenes.css`](file:///C:/Users/jogop/OneDrive/%C3%81rea%20de%20Trabalho/portfolio-umorgan/scenes.css)**: 
  Contém os cálculos de atos CSS (`--a1` até `--a4` e `--e1` até `--e4`) para animar cada cena SVG conforme a variável de progresso `--q` enviada pelo JS.
- **[`servir.py`](file:///C:/Users/jogop/OneDrive/%C3%81rea%20de%20Trabalho/portfolio-umorgan/servir.py)**: 
  Script Python para rodar um servidor HTTP local sem cache (`Cache-Control: no-store`) na porta 8899.
- **[`servir.ps1`](file:///C:/Users/jogop/OneDrive/%C3%81rea%20de%20Trabalho/portfolio-umorgan/servir.ps1)**: 
  Script PowerShell nativo do Windows para rodar o servidor HTTP local na porta 8899 caso Python não esteja instalado no sistema.

---

## 🚀 4. Execução e Servidor Local

### Servidor em Python:
```bash
python servir.py
```

### Servidor em PowerShell (Nativo no Windows):
```powershell
powershell -ExecutionPolicy Bypass -File servir.ps1
```

O servidor iniciará em **`http://localhost:8899`** com controle de cache desativado (`Cache-Control: no-store`).

---

## 📐 5. Convenções de Código

1. **JavaScript Vanilla**: Encapsulamento em IIFE `(function () { 'use strict'; ... })();`.
2. **CSS `@property`**: Variáveis numéricas interpoladas pelo navegador para molas físicas.
3. **SVG & Atos de Animação**: Medição dinâmica por `.getTotalLength()` e divisão em 4 atos (`--a1` a `--a4`).
4. **Idioma**: Português do Brasil (pt-BR).
