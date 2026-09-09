# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.
> O objetivo deste arquivo é registrar o estado **atual**, não preservar um diário de commits.
>
> Última consolidação: **2026-09-09**
> Branch canônica: **`main`**
> Repositório: **`washingtonmsdj/medatlas`**

---

## 0. Missão — NÃO REINTERPRETAR

MedAtlas é um **SaaS clínico visual B2B/B2B2C** para clínicas e profissionais de saúde transformarem laudos/relatórios em uma explicação anatômica 3D compreensível, **revisada por um profissional** e compartilhável com o paciente.

Fluxo canônico:

```text
laudo / relatório
      ↓
triagem anatômica
      ↓
conceitos reais FMA / BodyParts3D
      ↓
confirmação explícita do profissional
      ↓
Human Atlas 3D de referência
      ↓
explicação em linguagem clara
      ↓
revisão clínica obrigatória
      ↓
link / experiência do paciente
      ↓
visualização observável / auditável
```

O MedAtlas **não é**:

- diagnosticador automático;
- PACS;
- prontuário completo;
- segmentador de DICOM;
- reconstrução 3D específica do corpo do paciente;
- apenas um atlas anatômico.

O wedge vencedor continua sendo:

> **comunicação clínica visual entre profissional e paciente.**

---

## 1. Regras de arquitetura — INVARIANTES

1. Existe **um único engine Human Atlas canônico** para a autoridade anatômica BodyParts3D/FMA.
2. Explorer, clinical e patient são modos do mesmo Human Atlas; não criar um segundo renderer concorrente para confirmar anatomia.
3. É permitido um **viewer suplementar de órgão em detalhe** somente como segunda profundidade explícita (`Corpo → Órgão em detalhe`), depois de uma estrutura Human Atlas/FMA selecionada. Ele nunca muda a anatomia confirmada nem vira fonte de verdade.
4. BodyParts3D/FMA representam **anatomia humana de referência**, nunca reconstrução do paciente.
5. IA nunca pode inventar anatomia que não resolva no atlas fixado.
6. IA nunca publica sozinha.
7. Alterar laudo, anatomia ou explicação invalida as revisões necessárias.
8. Patient share não expõe IDs internos previsíveis.
9. Token bruto de share ou convite não é persistido.
10. Dados clínicos reais **não entram no modo demo**.
11. Bucket clínico de produção nunca é público.
12. Não reutilizar banco/Supabase de Achegue-se, OrdaX ou outro produto.
13. Não criar segunda autoridade de persistência paralela ao `ClinicalRepository`.
14. Não habilitar botão ou fluxo de produção fake para “parecer pronto”.
15. Supabase/auth real permanece bloqueado até ativação deliberada do P2.
16. **Não reintroduzir `OrganizationSwitcher` ou qualquer switcher de organização/workspace no shell atual.** O contexto ativo é informativo no rodapé/perfil; mudança de workspace só volta quando houver fluxo de produto deliberado e validado.
17. **Não reintroduzir `ViewModeSwitcher` nem seletor global Profissional/Paciente.** A prévia do paciente abre pelo menu do profissional e retorna por uma única ação explícita.
18. **Não recolocar “Novo relatório” na sidebar.** A criação é uma ação da busca global/dashboard; a sidebar permanece navegação de módulos.
19. **Exploração anatômica e anatomia confirmada são estados distintos.** Buscar/clicar uma estrutura no Atlas nunca altera silenciosamente o card “Estrutura confirmada” nem o relatório; somente a ação explícita de confirmação faz isso.
20. **O Atlas completo segue o concept de três colunas enquanto houver largura útil:** caso clínico à esquerda, corpo completo no centro e órgão detalhado à direita. Em desktop compacto, preservar as três colunas até o breakpoint canônico antes de empilhar.
21. **Selecionar um órgão mantém `Corpo` como contexto primário.** O órgão detalhado pode estar carregado/visível ao lado, mas o modo “Órgão em detalhe” só fica ativo por ação explícita.
22. **IDs FMA e detalhes de implementação não pertencem à superfície primária.** No Atlas profissional, identificador anatômico fica em Referências; no paciente, não expor FMA.
23. **`concept-shell.css` é a autoridade única do shell escuro.** Não recriar versões claras/paralelas de busca global, popovers, topbar ou perfil em stylesheets de polish.
24. **Não restaurar CSS morto do Dashboard antigo** (`premium-metrics`, fila premium, `premium-flow`, `continue-care-body/copy`, cards de posicionamento etc.) sem reintrodução deliberada e comprovada do respectivo componente.

---

## 2. Estado atual do MVP visual — P0 FECHADO

### Produto / shell SaaS

- [x] Dashboard clínico task-first com Human Atlas 3D como diferencial principal.
- [x] `ClinicalSidebar` canônica: marca MedAtlas, navegação por módulos, Atlas 3D como destino único e contexto ativo no rodapé; **não** contém launcher paralelo nem ação “Novo relatório”.
- [x] “Novo relatório” é ação canônica da busca global/dashboard e inicia um relatório vazio fail-closed.
- [x] desktop completo, tablet colapsado por ícones e mobile como header + navegação horizontal.
- [x] topbar canônica: busca global, central de ações pendentes e menu do profissional; **não** contém switcher de organização/workspace nem seletor Profissional/Paciente.
- [x] **Visão Profissional e Visão Paciente são shells separados**; a prévia do paciente abre pelo menu do profissional e retorna por uma única ação “Voltar ao profissional”.
- [x] organização, unidade/workspace e papel ativos permanecem visíveis como contexto informativo no rodapé/perfil.
- [x] o shell atual mantém um workspace demo fixo; troca de unidade/workspace não é exposta até existir fluxo de produto deliberado.
- [x] Pacientes.
- [x] Relatórios visuais.
- [x] laudo/exame e contexto da consulta pertencem ao fluxo de **Relatórios**; **Consultas e Exames não são módulos independentes no MVP**.
- [x] Atlas 3D.
- [x] Equipe.
- [x] Analytics.
- [x] Configurações.
- [x] portal do paciente.
- [x] empty/loading/error/fail-closed states.

### Clinical Report Studio

Hierarquia permanente:

```text
┌──────────────────┬──────────────────────────┬──────────────────────┐
│ LAUDO / EXAME    │ HUMAN ATLAS 3D          │ EXPLICAÇÃO           │
│ texto original   │ anatomia confirmada     │ rascunho assistido   │
│ sugestões        │ contexto / isolate      │ edição               │
│ evidências       │ busca / navegação       │ revisão clínica      │
│ confirmação      │ FMA / BodyParts3D       │ publicar / link      │
└──────────────────┴──────────────────────────┴──────────────────────┘
```

- [x] triagem determinística.
- [x] confiança textual acessível — não representa certeza clínica.
- [x] confirmação anatômica explícita.
- [x] 3D focado usando bounds reais da geometria.
- [x] Isolado / Sistema / Região.
- [x] vistas, rotação, reset e fullscreen.
- [x] rascunho educacional.
- [x] provenance.
- [x] revisão clínica obrigatória.
- [x] preview do paciente antes de publicar.
- [x] publicação fail-closed.

### Portal do paciente

- [x] experiência separada do dashboard clínico.
- [x] branding da clínica/profissional.
- [x] Human Atlas em modo patient.
- [x] explicação revisada.
- [x] selo de revisão.
- [x] perguntas para próxima consulta.
- [x] impressão/PDF.
- [x] aviso explícito de anatomia de referência.
- [x] link demo opaco e temporário.
- [x] link inválido/expirado falha fechado.

### Visual QA / responsividade

**Contrato de prioridade por perfil (invariante):**

- **Paciente:** mobile-first. Smartphone é a superfície primária; branding, leitura, toque e Human Atlas devem ser excelentes em 390 px antes de considerar desktop.
- **Clínica/profissional:** desktop-first. O Clinical Report Studio deve preservar as três colunas de trabalho, 3D dominante e produtividade em 1440/1600 px; mobile continua funcional, mas não dita a densidade do workspace profissional.
- Responsividade não significa apenas reduzir o desktop: cada perfil pode reorganizar densidade, alvos de toque e hierarquia conforme o dispositivo principal.


- [x] Browser E2E desktop/mobile.
- [x] axe/WCAG serious/critical gate.
- [x] gate automático de overflow em **1600 / 1440 / 390 px**.
- [x] dock de câmera do Clinical Studio vira barra horizontal em 390 px e possui teste geométrico contra regressão;
- [x] portal do paciente possui contrato mobile-first em 390 px: branding da clínica e ação PDF permanecem visíveis, palco 3D >= 500 px, controles/tabs/ações com alvos >= 44 px e ausência de overflow;
- [x] Dashboard mobile preserva o 3D do atendimento como superfície principal, com palco >= 400 px protegido por E2E;
- [x] Clinical Report Studio possui contrato desktop-first protegido por E2E em 1440/1600 px: três colunas alinhadas, coluna 3D mais larga e palco >= 560 px; regras responsivas canônicas preservam a terceira coluna em desktop sem depender de breakpoint legado;
- [x] Dashboard usa foco isolado da anatomia confirmada; contexto amplo permanece para superfícies clínicas/paciente onde ajuda orientação;
- [x] CSS do Explorer completo é escopado ao stage canônico e não pode alterar o renderer focado/paciente;
- [x] CI de browser usa um único worker para evitar competição entre cenas WebGL pesadas; Atlas completo ainda precisa chegar a estado pronto.
- [x] Atlas completo em 390 px é 3D-first no concept atual: corpo 3D permanece como palco principal, Sistemas é painel flutuante recolhível, atalhos ficam acessíveis e o painel de órgão detalhado empilha abaixo sem substituir o corpo nem criar overlays legados de Camadas/Inspector.
- [x] Skip-link permanece no accessibility tree e aparece por teclado, mas fica visualmente oculto sem foco para não sobrepor o workbench/capturas.
- [x] capturas desktop/mobile geradas por Playwright.
- [x] capturas revisadas visualmente.
- [x] concept atual consolidado: shell navy profissional, sidebar/topbar canônicas, Atlas em três colunas, corpo completo + órgão detalhado simultâneos, estados de exploração/confirmação explícitos e tipografia clínica legível.
- [x] refinamento MVP V5/V6: copy técnica removida das superfícies de produto, Profissional/Paciente separados, módulos fora do escopo retirados do shell e Atlas convertido em ferramenta task-first.
- [x] sidebar V7 reconstruída como componente dedicado; sem card clicável falso, sem launcher 3D duplicado e com comportamento desktop/tablet/mobile explícito.
- [x] `ClinicalSidebar` desacoplada da classe `.sidebar` legada; switchers antigos removidos. Na consolidação do concept de 2026-09-09, foram removidos também ~**16,9 kB** adicionais de CSS morto/sobreposto do Dashboard e do shell (incluindo versões claras antigas de busca/popovers), reduzindo dependência de cascade/import order.
- [x] axe/WCAG voltou a PASS após correção de contraste específica no seletor de visão e próximo passo; gate não foi desabilitado.
- [x] busca global deixou de ser decorativa: command search local com Ctrl/⌘ K, módulos, paciente demo, ações rápidas e cenários sintéticos, com teclado e E2E.
- [x] topbar task-first: tutorial explicativo removido; permanecem **Ações pendentes** e **Perfil**, com navegação real do MVP; busca global alinhada ao escopo atual (paciente, relatório, anatomia, módulo).
- [x] identificadores técnicos FMA/BodyParts3D foram removidos da copy principal e da visão Paciente; continuam disponíveis no Atlas/inspector profissional quando úteis.
- [x] Human Atlas possui retry real e fail-safe: Promise rejeitada não fica cacheada; Dashboard/Pacientes, portal, Clinical Studio e Atlas completo podem tentar novamente usando o mesmo engine canônico, sem fallback fake.
- [x] câmera de anatomia isolada usa fit por largura/altura/FOV e respeita a vista atual; Explorer completo preserva o próprio enquadramento.
- [x] workflow publica artifact de visual QA também em runs verdes.
- [x] gestão mobile sem scroll horizontal interno: matriz de permissões vira cards responsivos; Analytics/Equipe/Configurações possuem capturas dedicadas em 1600/1440/390 px.
- [x] stylesheet órfão de convites removido do entrypoint e dos validadores; convites continuam fora do MVP sem CSS morto no bundle.
- [x] gate pós-build de bundle impede regressão para renderer pesado dentro do JS inicial.

Referências recentes de validação:

> **Checkpoint do concept em validação (2026-09-09):** source atual em `ee87e71ddaf166a0bd971c7079151d211fc6ead4` após consolidação de shell, limpeza de CSS, separação exploração/confirmação, três colunas em desktop compacto e escala tipográfica. Não promover este SHA a baseline final até CI + Browser E2E + Pages do mesmo source fecharem verdes.

- **Último commit funcional validado de produto/frontend:** `3287374057ea3c41baef04256dcfd9ab0265b467`.
- **CI:** run `34303977846` — PASS completo, incluindo `validate:mvp-ui`, `validate:reference-atlas`, TypeScript, build e bundle budget.
- **Browser E2E:** run `34303977863` — PASS completo, incluindo axe/WCAG, 1600/1440/390 px, Clinical Studio, Atlas, Patient view, portal e gestão mobile.
- **GitHub Pages / Chromium remoto:** run `34303978282` — PASS contra `https://washingtonmsdj.github.io/medatlas/`, com build, deploy e verificação 3D remota verdes.
- **Bundle atual:** entry `304.865 bytes`; Human Atlas lazy chunk `503,09 kB` minificado / `128,72 kB gzip`; total JS `807.961 bytes`; CSS principal `177,08 kB` / `33,46 kB gzip`; budget PASS.
- **Runtime:** Node `>=22.13.0 <23`, impedindo upgrade automático de major sem permitir versões 22 abaixo do mínimo.
- **3D canônico:** Explorer completo + superfícies focadas clinical/patient compartilham o mesmo engine derivado diretamente do Human Atlas fixado; não existe renderer simplificado paralelo.
- **Visual QA:** artifact `visual-qa-34303977863` (`10086089169`) — capturas do checkpoint funcional atual, cobrindo Dashboard, Clinical Studio, Atlas Explorer, Pacientes, preview/portal do paciente e módulos de gestão em desktop/mobile.
- **Preview público:** `https://washingtonmsdj.github.io/medatlas/`.
- **Vercel:** deployment API já funciona e não é blocker de arquitetura; GitHub Pages permanece a preview canônica porque executa verificação 3D remota automaticamente.

---

## 3. Human Atlas / anatomia — 3D-FIRST NO MVP

- [x] upstream Human Atlas fixado em `1c38bf35c254a891200d3cedecfd57abebe83d8d`.
- [x] BodyParts3D vendorizado com provenance e SHA-256.
- [x] aproximadamente 2.234 peças no explorer completo.
- [x] picking por peça.
- [x] inspeção temporária de peça no modo focado, sem alterar a anatomia confirmada do relatório.
- [x] destaque visual efêmero da peça inspecionada no mesmo shader/engine, com contraste âmbar pós-iluminação para não se confundir com o foco clínico ciano.
- [x] hover de descoberta nos modos clinical/patient: brilho leve + cursor pointer antes do clique, sem ativar raycast contínuo no Explorer completo;
- [x] linguagem de inspeção adaptada: workflow clínico para profissional; orientação de referência para paciente.
- [x] sistemas anatômicos.
- [x] aliases em português.
- [x] busca FMA.
- [x] isolate/explode.
- [x] modos `explorer`, `clinical` e `patient`.
- [x] chunk loading no modo focado.
- [x] paridade visual adicional com Human Atlas: anéis/plataforma, marcadores de inventário, hover por peça no inventário explodido e câmera com viewport reservado para painéis.
- [x] cache de chunks.
- [x] geometry-aware camera framing.
- [x] Explorer assembled-body framing uses real atlas bounds plus the usable viewport between layers/search/inspector/dock so head and feet do not hide behind overlays at desktop widths.
- [x] licenças/atribuições visíveis e validadas.
- [x] gate permanente `validate-reference-atlas`.
- [x] integração permitida de `thebuggeddev/anatomy` registrada em `docs/UPSTREAM_ANATOMY.md`, fixada no upstream `8c0e6f321a47f895ae58ce098028b92774733ee9`.
- [x] segundo nível anatômico `Corpo → Órgão em detalhe` integrado sem substituir a seleção FMA/BodyParts3D do relatório.
- [x] catálogo detalhado atual: cérebro, olho, coração, intestino, rins, fígado, pulmões, pâncreas e pele.
- [x] 9 GLBs vendorizados em `public/organ-models`; `manifest.json` registra upstream, Git blob, bytes e SHA-256.
- [x] modelos detalhados são lazy-loaded somente ao abrir detalhe; não entram no JS inicial.
- [x] runtime não depende de `raw.githubusercontent.com`; `VITE_ORGAN_DETAIL_ASSET_BASE` é apenas override controlado.
- [x] `scripts/validate-vendored-assets.mjs` verifica também o fechamento SHA-256 dos modelos detalhados.
- [ ] antes de lançamento comercial/público definitivo, arquivar a evidência da permissão e concluir revisão documental de provenance dos GLBs detalhados.

Não voltar ao visual/pedestal original do upstream nas superfícies clinical/patient.
Não transformar `OrganDetailScene` em autoridade clínica paralela ao Human Atlas.

### 3.1 Regra 3D-first — ONDE O MODELO REAL DEVE APARECER

O diferencial do MedAtlas é a anatomia 3D integrada ao workflow, não um Atlas isolado.

| Superfície | Uso do 3D | Contrato |
| --- | --- | --- |
| **Visão geral** | preview real do atendimento atual | `AnatomyFocusPreview → HumanAtlasScene → detalhe opcional` |
| **Pacientes** | anatomia do relatório atual em modo patient | Human Atlas como contexto + detalhe opcional, sem thumbnail fake |
| **Relatórios visuais** | laudo/exame + contexto clínico + Clinical 3D Workbench | texto → sugestão → confirmação → contexto/câmera → revisão → compartilhar |
| **Preview do paciente (pré-publicação)** | Human Atlas real em modo patient | preview local, não publica nem contorna review gate |
| **Atlas 3D** | explorer completo de ~2.234 peças | picking, sistemas, explode, inspector + profundidade de órgão quando disponível |
| **Link do paciente** | 3D real é o elemento visual dominante | modo patient, controles simplificados |
| **Equipe / Analytics / Configurações** | **sem canvas 3D de propósito** | não existe tarefa anatômica; evitar decoração e custo de GPU |

Regras permanentes:

- [x] o placeholder/orbit “3D” do Dashboard foi removido;
- [x] nenhuma superfície anatômica usa imagem estática para fingir 3D;
- [x] o preview do paciente dentro do Report Studio usa o Human Atlas real antes da publicação;
- [x] `AnatomyFocusPreview` reutiliza `HumanAtlasScene` como contexto/autoridade e só lazy-load `OrganDetailScene` após entrada explícita no detalhe;
- [x] o Atlas completo usa o mesmo contrato: seleção no Human Atlas → detalhe opcional → retorno ao corpo sem perder FMA;
- [x] o detalhe mostra breadcrumb `Corpo completo › órgão › modelo detalhado` e, no modo paciente, aviso explícito de referência anatômica;
- [x] sem conceito FMA válido, a UI mostra estado vazio e **não inventa modelo**;
- [x] status mostra quando a geometria real terminou de carregar;
- [x] seleção clínica confirmada e inspeção visual temporária são estados diferentes; clicar numa peça não muda o relatório;
- [x] a peça inspecionada recebe destaque visual distinto e o inspector pode ser fechado sem alterar o foco clínico;
- [x] hover só antecipa interatividade; não muda seleção, inspeção persistida nem estado do relatório;
- [x] toda prévia contextual explicita que o 3D é interativo e orienta arrastar/clicar, sem duplicar lógica por módulo;
- [x] troca de superfície desmonta o renderer anterior;
- [x] cleanup canônico cancela animation frame, listeners/observer e descarta controls, geometrias, materiais, textures e renderer WebGL;
- [x] source gate falha se Dashboard ou Pacientes perderem o preview canônico, se surgir renderer paralelo ou se o Clinical Studio deixar de usar o engine de referência;
- [x] Browser E2E exige canvas real nas superfícies 3D-first;
- [x] Pages executa Playwright contra o site publicado e exige canvas Human Atlas também no portal do paciente.
- [x] asset base do Human Atlas herda `import.meta.env.BASE_URL`; deploys em subpath como `/medatlas/` não quebram `atlas.json` nem chunks.

O 3D continua sendo **anatomia humana de referência**. Não chamar esse modelo de “corpo do paciente”, “reconstrução do exame” ou equivalente.

---

## 4. P1 — organização SaaS source-first

### Equipe e permissões — IMPLEMENTADO EM SOURCE/UI

- [x] módulo Equipe real no frontend.
- [x] papéis canônicos `admin | clinician | staff`.
- [x] matriz de permissões visível.
- [x] membership separado de perfil `professionals`.
- [x] todos membros ativos podem ler conforme RLS.
- [x] `admin` e `clinician` podem escrever dados clínicos conforme contrato.
- [x] somente `admin` administra membership/estrutura organizacional.
- [x] E2E de papéis/permissões.

### Unidades e workspaces — IMPLEMENTADO EM SOURCE; CONTEXTO UI READ-ONLY

- [x] `organization_units`.
- [x] `clinical_workspaces`.
- [x] FK tenant-safe workspace → unit + organization.
- [x] policies admin-write.
- [x] Ortopedia / Cardiologia / Fisioterapia permanecem modeladas no demo.
- [x] workspace/unidade atuais aparecem como contexto no shell e perfil.
- [x] switcher de unidade/workspace foi removido do shell atual; não reintroduzir sem requisito de produto.
- [x] E2E protege o contexto do workspace e a ausência do switcher removido.

### Branding — IMPLEMENTADO EM SOURCE/UI

- [x] `organization_branding`.
- [x] policy admin-write.
- [x] branding demonstrativo da Clínica Horizonte.
- [x] branding chega ao paciente.
- [x] edição continua bloqueada no demo.
- [x] E2E de branding.

### Analytics / visualizações — IMPLEMENTADO EM SOURCE + DEMO LOCAL

- [x] módulo Analytics.
- [x] resumo de uso.
- [x] visualizações por relatório.
- [x] demo deriva eventos realmente observados localmente.
- [x] produção deriva de `report_shares` + `audit_events` — sem tabela paralela de tracking.
- [x] dedupe de retry imediato.
- [x] demo sem `fetch`, `sendBeacon` ou `XMLHttpRequest` para analytics.
- [x] E2E prova `abrir link → visualização > 0`.

### Convites — SOURCE-READY, TRANSPORTE AINDA BLOQUEADO

Contrato canônico:

- [x] `organization_invitations`.
- [x] criação admin-only.
- [x] token aleatório de 32 bytes.
- [x] somente SHA-256 persistido.
- [x] TTL entre 1 hora e 30 dias; default 7 dias.
- [x] revogação.
- [x] aceite autenticado.
- [x] e-mail da sessão deve coincidir com e-mail do convite.
- [x] audit events de criação/aceite/revogação.
- [x] membership inativa pode ser reativada pelo convite.
- [x] membership ativa nunca tem papel sobrescrito pelo aceite.
- [x] race de insert/reativação fechado com `INSERT ... ON CONFLICT ... WHERE active = false`.
- [x] UI explica o contrato.
- [x] Browser E2E da superfície.
- [x] documentação `docs/ORGANIZATION_INVITATIONS.md`.
- [ ] transporte de e-mail/edge/backend — **bloqueado até P2**.
- [ ] botão `Convidar membro` ativo — **bloqueado até P2**.

Não implementar envio fake em browser/localStorage.

### Ainda pendente em P1

- [ ] plano/assinatura — somente depois da infraestrutura de produção.

Billing não é prioridade antes de auth/RLS/backend reais.

---

## 5. Piloto sintético — AUTOMATIZADO / DOCUMENTADO

Documento: `docs/PILOT.md`.

O fluxo automatizado já cobre:

```text
organização/workspace
  → relatório
  → triagem
  → confirmação anatômica
  → Human Atlas 3D
  → rascunho
  → revisão
  → preview
  → share
  → portal do paciente
  → abertura do link
  → Analytics registra visualização
```

Também cobre Equipe, branding, convites source-ready, mobile, acessibilidade e fail-closed states.

- [x] piloto sintético automatizado.
- [x] protocolo manual sintético atualizado.
- [ ] piloto manual final em preview externo.
- [ ] piloto controlado com profissionais externos — bloqueado até produção clínica segura.

Nenhum desses itens autoriza PHI/dados clínicos reais.

---

## 6. P2 — Supabase dedicado / produção clínica — BLOQUEADO DELIBERADAMENTE

**Não ativar por conta própria enquanto a decisão de adiar Supabase permanecer.**

Source-first já existe, mas produção ainda precisa:

- [ ] criar projeto Supabase exclusivo do MedAtlas;
- [ ] aplicar migrations canônicas em ambiente dedicado;
- [ ] autenticação/onboarding;
- [ ] provar isolamento cross-tenant real;
- [ ] provar RLS por papel com usuários reais de teste;
- [ ] implementar `SupabaseClinicalRepository`;
- [ ] Storage privado real;
- [ ] resolver share pelo RPC patient-safe;
- [ ] provar expiração/revogação real;
- [ ] ativar transporte seguro de convites;
- [ ] provar aceite/revogação/reativação de convite;
- [ ] auditoria real;
- [ ] política de retenção;
- [ ] só então permitir dados reais conforme requisitos jurídicos/regulatórios.

---

## 7. P3 — IA real — BLOQUEADA ATÉ BACKEND

Já existe:

- [x] contrato `medatlas.clinical-extraction/1`.
- [x] runtime validator.
- [x] output anatômico precisa resolver para conceito real.
- [x] review clínico obrigatório.
- [x] gerador educacional determinístico.
- [x] provenance.
- [x] provedor remoto desativado no browser.

Depois do backend:

- [ ] provider/model atrás de servidor seguro.
- [ ] structured extraction real.
- [ ] patient-language draft por modelo.
- [ ] `provider/model/promptVersion/generatedAt`.
- [ ] avaliação de qualidade em cenários sintéticos.
- [ ] nenhuma chave de modelo no Vite bundle.
- [ ] nenhum output de IA publica diretamente.

---

## 8. P4 — preview / validação / lançamento

Prioridade depois do P1 source-first:

1. [x] publicar/confirmar preview externo atual — GitHub Pages ativo em `https://washingtonmsdj.github.io/medatlas/`;
2. [x] validar Browser E2E completo contra deploy — baseline atual: CI `34244871050` PASS, Browser E2E `34244870944` PASS e Pages/Playwright remoto `34244012419` PASS;
3. [x] concluir pré-piloto automatizado + revisão visual do artifact verde — `visual-qa-34230327626` (`10057704634`), 15 capturas revisadas;
4. [ ] executar piloto manual sintético no preview com navegação humana real;
5. [ ] corrigir UX adicional encontrada no piloto manual;
5. [ ] preparar Supabase dedicado (P2) quando autorizado;
6. [ ] preparar termos, privacidade e compliance do mercado-alvo;
7. [ ] somente então desenhar piloto clínico controlado com dados permitidos.

Se GitHub Pages continuar dependendo de configuração administrativa, não criar workaround inseguro. Se Vercel tiver quota/bloqueio, não alterar arquitetura para contornar quota.

---

## 9. Próxima ação recomendada

Se continuar **sem Supabase ativo**:

1. preservar o baseline funcional `bfbf6325…` — CI `34244871050` PASS, Browser E2E `34244870944` PASS, GitHub Pages Preview `34244012419` PASS sobre o mesmo código de produto;
2. manter CI, Browser E2E, axe/WCAG e Playwright 3D do GitHub Pages verdes; artifact visual atual: `visual-qa-34244870944` (`10063785481`) — 24 capturas revisadas em desktop/mobile.
3. executar **piloto manual sintético completo** no preview externo;
4. registrar somente bugs/UX observados por navegação humana e corrigi-los;
5. não iniciar billing, IA remota ou Supabase sem autorização.

Se o usuário autorizar **ativar produção/Supabase**:

1. criar Supabase dedicado MedAtlas;
2. aplicar migrations na ordem;
3. rodar testes cross-tenant e RLS antes da UI de auth;
4. implementar `SupabaseClinicalRepository`;
5. ativar auth e convites somente após os testes passarem;
6. continuar proibindo dados reais até segurança/compliance estar validada.

---

## 10. DO NOT REPEAT

- não recriar renderer 3D paralelo;
- não substituir Human Atlas por modelo fake/simplificado;
- não transformar inspeção de peça em nova seleção clínica automaticamente; inspeção é efêmera, confirmação é explícita;
- não usar linguagem que sugira que o BodyParts3D é o “modelo/corpo do paciente”; sempre deixar claro que é anatomia de referência;
- não recolocar thumbnail, órbita, ilustração ou badge “3D” como substituto de geometria real em qualquer superfície anatômica;
- não adicionar canvas 3D decorativo em Equipe, Analytics ou Configurações: 3D deve existir onde há tarefa anatômica real;
- não reabrir layout antigo do Clinical Report Studio;
- não tratar confiança textual como certeza clínica;
- não fazer IA diagnosticar/publicar automaticamente;
- não criar analytics/telemetria paralela;
- não persistir token bruto;
- não tornar bucket clínico público;
- não ativar convite fake/local;
- não reutilizar Supabase de outro projeto;
- não dizer que Supabase/auth/convites de produção estão ativos enquanto não estiverem;
- não permitir PHI no demo.

- [x] contraste do texto auxiliar da zona de publicação corrigido para WCAG AA (de ~3,3:1 para >5:1 em fundo claro); gate Axe permanece bloqueante.


---

## Checkpoint MVP — fundação visual canônica (2026-09-09)

Estado de source revisado diretamente no `main` antes desta rodada: `88c7022bca493816ec0d31fa8cf9749fdb9a1cf8`.

### Feito nesta rodada
- [x] criada uma autoridade semântica única para fonte, paleta, superfícies, bordas, estados e escala tipográfica do shell em `src/styles/design-tokens.css`;
- [x] `main.tsx` passa a carregar os tokens antes das folhas base/legadas;
- [x] shell, topbar, sidebar e `WorkspacePageHeader` passaram a consumir tokens em vez de duplicar a fundação visual;
- [x] logo da sidebar deixou de carregar cores hex dentro do JSX; a aparência agora vem do tema;
- [x] tipografia primária da sidebar, topbar e cabeçalhos foi elevada para uma escala de produto mais legível, preservando responsividade;
- [x] `validate:mvp-ui` ganhou contrato para impedir regressão da fonte canônica, ausência dos tokens e retorno de hex hardcoded no componente da sidebar.

### Próxima frente P0
1. continuar a migração das superfícies de conteúdo em `module-workspaces.css`, `concept-modules.css` e stylesheets de módulos para os mesmos tokens;
2. remover CSS morto somente após provar ausência de uso no source e manter paridade visual/E2E;
3. manter Human Atlas e órgão detalhado como renderers canônicos, sem criar fallback visual paralelo;
4. validar CI + Browser E2E + Pages no mesmo source antes de declarar novo baseline visual.


### Continuação do checkpoint visual — páginas e legado (2026-09-09)
- [x] shell/topbar, sidebar, cabeçalho canônico, `concept-modules.css` e `module-workspaces.css` não definem mais literais de cor; toda cor ativa passa pela fundação semântica;
- [x] `module-workspaces.css` foi reconstruído como camada de layout responsivo + estados ativos, eliminando a mistura antiga de tema claro com overrides escuros;
- [x] removidos seletores comprovadamente mortos por busca no source: `workspace-hero-v3`, `module-hero-copy`, `workspace-context-grid`, `status-facts-v3`, `module-boundary-v3`, `settings-governance-v3` e `mvp-page-hero`;
- [x] mantidos e migrados os seletores com consumidores reais: anatomia do paciente, composer/publicação de relatório, métricas de Analytics, cards de Configurações e dashboard 3D;
- [x] o contrato `validate:mvp-ui` agora falha se cores hardcoded voltarem às camadas canônicas ou se os seletores mortos forem reintroduzidos.

### Próxima frente P0 após este checkpoint
1. validar CI, Browser E2E e Pages no HEAD exato;
2. auditar `supporting-modules.css` e `organization-analytics.css` por consumidor antes de migrar/remover o restante do tema claro histórico;
3. não mexer no renderer Human Atlas/órgão detalhado enquanto a limpeza visual não exigir mudança funcional.


### Continuação do checkpoint visual — supporting, analytics e experiência (2026-09-09)
- [x] `supporting-modules.css` reconstruído somente com seletores consumidos pelo MVP; removidos `module-hero-copy`, `module-hero-status`, `patient-workspace-grid-v2`, `patient-profile-card-v2`, `patient-profile-meta`, `settings-status-strip`, `settings-governance` e `patient-production-boundary-v2`;
- [x] `organization-analytics.css` reconstruído para Equipe, branding e Analytics ativos; removidos `organization-structure-*`, `settings-branding-preview` e `analytics-boundary`;
- [x] classes antigas sem responsabilidade visual foram retiradas do JSX de Pacientes, Configurações, Equipe e Analytics; classes ainda funcionais foram preservadas;
- [x] `mvp-mode.css`, `interaction-polish.css` e `experience-surfaces.css` migrados para tokens e limpos de `mvp-page-hero`, `mvp-compact-grid`, `module-hero-copy` e `module-heading`;
- [x] estados de rota do paciente, retry/erro do Atlas, loading 3D, permissões, analytics e configuração permanecem funcionais e agora compartilham a mesma fundação visual;
- [x] todas essas camadas canônicas passam a falhar no `validate:mvp-ui` se voltarem a definir `#hex`/`rgb(a)` ou reintroduzirem seletores mortos.

### Próxima frente P0
1. fechar CI + Browser E2E + Pages do último commit funcional desta rodada;
2. atacar `clinical-shell.css`, `styles.css`, `anatomy-responsive.css` e `reference-atlas.css` por domínio, sem reescrever o renderer 3D;
3. separar CSS estrutural do Clinical Studio/Atlas de paleta histórica, migrando primeiro superfícies compartilhadas e só removendo seletores com consumidor comprovado;
4. reduzir gradualmente o número de folhas importadas quando a autoridade de cada camada estiver comprovadamente absorvida, sem criar um mega-CSS.


### Continuação do checkpoint visual — base e Clinical Studio (2026-09-09)
- [x] removidos de `styles.css` os pacotes históricos completos do dashboard anterior, Pacientes anterior e Configurações anterior; as classes atuais seguem com ownership em `module-workspaces.css`, `supporting-modules.css` e `concept-modules.css`;
- [x] removidos do base os controles Atlas substituídos por `clinical-atlas-*`: `atlas-search-panel`, `atlas-search-copy`, `atlas-search-box`, `atlas-search-results`, `quick-concepts`, `structure-label`, `real-label`, `atlas-toolbar`, `integration-note` e layouts antigos `content-grid`/`left-stack`;
- [x] removidos estados sem consumidor `invalid-share` e `context-mode-group`;
- [x] `clinical-shell.css` deixou de declarar a paleta paralela `--saas-*`; o shell do Clinical Studio usa os tokens canônicos;
- [x] removidos `module-heading`, `synthetic-badge` e `overview-actions-premium` do Clinical Studio, preservando `studio-panel-label`, `care-status`, `care-progress` e o layout clínico ativo;
- [x] aliases de classe sem regra ativa foram removidos do JSX de Overview, Pacientes e Configurações;
- [x] `validate:mvp-ui` impede reintrodução desses seletores/aliases e da paleta `--saas-*`.

### Próxima frente P0
1. validar o último commit funcional com CI + Browser E2E + Pages;
2. continuar `clinical-shell.css` pelo Clinical Studio ativo, convertendo blocos ainda claros em tokens sem substituir a estrutura 3D;
3. auditar `anatomy-responsive.css` e `reference-atlas.css` por ownership real do Atlas/órgão detalhado;
4. somente depois revisar os imports do `main.tsx` e fundir/remover folhas cujo ownership tenha sido totalmente absorvido.

### Continuação do checkpoint visual — consolidação de cascata e fluxo MVP (2026-09-09)
- [x] páginas principais foram revisadas para linguagem task-first; Visão geral, Pacientes, Equipe, Analytics e Configurações mantêm o mesmo shell canônico;
- [x] **Relatórios visuais** agora usa `WorkspacePageHeader` como as demais páginas principais, sem criar etapa intermediária antes do Clinical Report Studio;
- [x] fluxo central permanece explícito: **laudo → anatomia 3D → confirmação → explicação → revisão → compartilhamento**;
- [x] identificador anatômico interno foi retirado da superfície principal de sugestões; continua disponível apenas onde tem função profissional/técnica;
- [x] seletor órfão `patient-clarity-strip` removido; o gate continuou bloqueante e não foi afrouxado;
- [x] `experience-surfaces.css` foi totalmente absorvido por `concept-modules.css` e apagado;
- [x] `mvp-mode.css` foi totalmente absorvido por `concept-modules.css` e apagado;
- [x] `interaction-polish.css` foi absorvido por `module-workspaces.css` preservando a ordem efetiva da cascata e apagado;
- [x] `main.tsx` não carrega mais nenhuma dessas três folhas-patch;
- [x] `validate:reference-atlas` e `validate:mvp-ui` seguem o novo ownership e bloqueiam a reintrodução das folhas absorvidas;
- [x] baseline funcional consolidado: **`224315d0f478e703a27adece531cc57a9b5e7bab`**;
- [x] CI do baseline `224315d0…`: run **`34381042235` PASS completo**, incluindo contratos clínicos, Human Atlas, MVP UI, TypeScript, build e bundle budget;
- [ ] Browser E2E do baseline `224315d0…`: run **`34381042190`** aguardando executor no momento deste checkpoint;
- [ ] GitHub Pages do baseline `224315d0…`: run **`34381042166`** em deploy/verificação no momento deste checkpoint.

### Próxima frente P0 após a consolidação
1. fechar Browser E2E + Pages do baseline funcional `224315d0…`;
2. auditar `anatomy-responsive.css` por consumidor e breakpoint real; remover apenas regras sem uso comprovado;
3. auditar `reference-atlas.css` por ownership do Explorer completo, sem tocar no engine 3D nem criar renderer alternativo;
4. revisar aliases de versão ainda ativos (`v2/v3/premium`) somente quando houver substituto semântico e migração completa de JSX + CSS + gates;
5. manter o 3D real como diferencial do MVP nas superfícies anatômicas e evitar qualquer regressão para placeholder, thumbnail ou fallback fake.

### Checkpoint MVP — task-first, cascata consolidada e aliases semânticos (2026-09-09)
- [x] fluxo visual principal alinhado à copy task-first: **Atendimento em andamento → Adicionar laudo → Encontrar anatomia → Usar estrutura → Gerar rascunho → Aprovar explicação → Compartilhar**;
- [x] testes Browser/Pages deixaram de localizar cards de sugestão por FMA interno; IDs continuam validados em dados/Referências profissionais e continuam proibidos na superfície do paciente;
- [x] teste de revisão humana continua bloqueante e agora acompanha a ação real `Aprovar explicação`;
- [x] falso negativo do preview foi corrigido por escopo semântico `.patient-preview-control`, sem usar `.first()` arbitrário;
- [x] `interaction-polish.css`, `experience-surfaces.css` e `mvp-mode.css` permanecem absorvidos e ausentes do entrypoint;
- [x] aliases do portal do paciente removidos: `patient-hero-premium`, `patient-hero-v3`, `patient-grid-v3`, `patient-next-step-v3`;
- [x] aliases de Pacientes/Analytics/Configurações removidos e protegidos pelo gate: `patient-current-report-v2`, `anatomy-showcase-v3`, `anatomy-showcase-copy-v3`, `analytics-error-v3`, `analytics-metrics-v3`, `analytics-report-card-v3`, `settings-grid-v2`, `settings-grid-v3`, `settings-actions-v2`, `module-action-bar-v3`;
- [x] aliases de Intake/Composer removidos: `intake-card-v2`, `intake-heading-v2`, `intake-actions-v2`, `suggestion-list-v2`, `report-card-v2`, `report-composer-v3`, `explanation-heading-v2`, `review-gate-v2`, `review-approved-v2`, `share-box-v2`, `publish-zone-v3`;
- [x] o Composer usa agora o escopo semântico único `report-composer`;
- [x] `anatomy-responsive.css` e `reference-atlas.css` foram auditados por consumidor: nenhum seletor anatômico ativo foi removido só por parecer legado;
- [x] workflows Browser E2E e Pages foram endurecidos contra o repositório APT externo do Google Chrome que estava falhando com `Hash Sum mismatch`; Playwright continua usando `--with-deps chromium`, sem redução de cobertura;
- [x] CI do HEAD funcional/gates **`29497ff1013ea7749234efcd009a33b595dfb443`**: run **`34385743604` PASS completo**;
- [x] GitHub Pages do runtime equivalente **`9818355d2094ca1d89ae7246d46ca3606a972a3b`**: run **`34385736338` PASS**, incluindo verificação remota 3D;
- [ ] Browser E2E do mesmo runtime **`9818355d…`**: run **`34385736328`** ainda em execução no momento deste checkpoint.

### Próxima frente P0 após este checkpoint
1. fechar o Browser E2E `34385736328` e registrar o resultado exato;
2. avaliar `module-v3` para migração semântica para um wrapper estável de página, somente após o baseline E2E verde;
3. tratar `medatlas-v2-*` como migração de shell/tema, não como replace mecânico;
4. tratar `atlas-v3-*` separadamente dentro do domínio do Reference Atlas; não misturar essa renomeação com mudanças no renderer;
5. continuar removendo legado somente com consumidor/ownership comprovados e sempre preservar Human Atlas + órgão detalhado como engines reais.

### Checkpoint — wrapper semântico e recuperação do Browser E2E (2026-09-09)
- [x] `module-v3` foi totalmente migrado para o wrapper semântico `workspace-page` em App, Overview, Pacientes, Equipe, Analytics e Configurações; CSS e gate foram alinhados sem mudança funcional do renderer.
- [x] runtime funcional da migração: **`021be7174798f9883d32df7c0ccaea1431e4add0`**; gate final da migração: **`2ddd74b482de017ee06aa80ae8bd6fa65dc5db54`**.
- [x] CI do gate `2ddd74b…`: run **`34388830346` PASS**; CI do runtime `021be717…`: run **`34388718567` PASS**; Pages do mesmo runtime: run **`34388718571` PASS**, incluindo o fluxo 3D publicado.
- [x] o Browser `34388718603` não falhou por instalação: completou setup/build e executou 39 testes, mas acumulou falhas de contrato de UI antigo e atingiu o timeout do job antes do resumo final.
- [x] drift comprovado corrigido nos E2E sem alterar frontend: `Reconfirmação anatômica necessária` → `RECONFIRMAÇÃO NECESSÁRIA`; headings de Pacientes/Configurações alinhados aos títulos atuais; copy de branding alinhada; ação de Pacientes `Abrir relatório` → `Continuar relatório`.
- [x] commits de recuperação E2E: **`7265d5d…`**, **`be6e2d1…`**, **`c44c0f9…`** e **`d0c0b62…`**. CI de `c44c0f9…`: run **`34391280485` PASS**; novo Browser após o último ajuste: run **`34391665765`** em validação.
- [x] auditoria direta dos **22 arquivos TSX atuais** não encontrou consumidor de `anatomy-context-meta-v3` nem `document-step-rail-v3`; ambos permanecem somente em `module-workspaces.css` e são candidatos de remoção segura após o checkpoint Browser.
- [x] `medatlas-v2-shell`, `medatlas-v2-workspace`, `medatlas-v2-topbar` e `medatlas-v2-demo-boundary` continuam com ownership real do shell/tema atual; não remover nem renomear por busca mecânica. A futura migração deve consolidar ownership em nomes semânticos e atualizar testes/gates no mesmo lote.

### Próxima frente P0 a partir deste checkpoint
1. fechar o Browser E2E **`34391665765`** e corrigir somente falhas reais remanescentes;
2. remover `anatomy-context-meta-v3` e `document-step-rail-v3` de `module-workspaces.css` e adicioná-los ao gate de seletores mortos;
3. revalidar CI + Browser + Pages no runtime resultante antes de declarar novo baseline;
4. só então executar a migração semântica isolada do shell `medatlas-v2-*`, sem misturar com `atlas-v3-*` nem com mudanças no Human Atlas/órgão detalhado.
