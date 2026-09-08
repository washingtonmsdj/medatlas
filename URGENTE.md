# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.
> O objetivo deste arquivo é registrar o estado **atual**, não preservar um diário de commits.
>
> Última consolidação: **2026-09-07**
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

1. Existe **um único engine Human Atlas canônico**.
2. Explorer, clinical e patient são modos do mesmo engine, não renderers paralelos.
3. BodyParts3D/FMA representam **anatomia humana de referência**, nunca reconstrução do paciente.
4. IA nunca pode inventar anatomia que não resolva no atlas fixado.
5. IA nunca publica sozinha.
6. Alterar laudo, anatomia ou explicação invalida as revisões necessárias.
7. Patient share não expõe IDs internos previsíveis.
8. Token bruto de share ou convite não é persistido.
9. Dados clínicos reais **não entram no modo demo**.
10. Bucket clínico de produção nunca é público.
11. Não reutilizar banco/Supabase de Achegue-se, OrdaX ou outro produto.
12. Não criar segunda autoridade de persistência paralela ao `ClinicalRepository`.
13. Não habilitar botão ou fluxo de produção fake para “parecer pronto”.
14. Supabase/auth real permanece bloqueado até ativação deliberada do P2.

---

## 2. Estado atual do MVP visual — P0 FECHADO

### Produto / shell SaaS

- [x] Dashboard clínico premium.
- [x] Sidebar/topbar SaaS.
- [x] organização e workspace ativos visíveis.
- [x] troca local sintética de workspace/especialidade.
- [x] Pacientes.
- [x] Consultas.
- [x] Exames/documentos sintéticos.
- [x] Relatórios visuais.
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
- [x] Clinical Report Studio possui contrato desktop-first protegido por E2E em 1440/1600 px: três colunas alinhadas, coluna 3D mais larga e palco >= 560 px; override explícito do breakpoint legado <=1450 mantém a explicação na terceira coluna em desktop;
- [x] Dashboard usa foco isolado da anatomia confirmada; contexto amplo permanece para superfícies clínicas/paciente onde ajuda orientação;
- [x] CSS do Explorer completo é escopado ao stage canônico e não pode alterar o renderer focado/paciente;
- [x] CI de browser usa um único worker para evitar competição entre cenas WebGL pesadas; Atlas completo ainda precisa chegar a estado pronto.
- [x] capturas desktop/mobile geradas por Playwright.
- [x] capturas revisadas visualmente.
- [x] workflow publica artifact de visual QA também em runs verdes.
- [x] gate pós-build de bundle impede regressão para renderer pesado dentro do JS inicial.

Referências recentes de validação:

- **Baseline funcional 3D-first atual:** código de produção em `770d4f6fc2700f660bd4e1547a867cfb2ffd5752`; HEAD de prova `419d8e7c9bf8f80fc8ba1f216c20d44690633412` altera somente o locator E2E final.
- **CI:** run `34117852517` — PASS.
- **Browser E2E:** run `34117852477` — **27/27 PASS em 2,7 min**, um worker WebGL no CI.
- **GitHub Pages / Chromium remoto:** run `34117434772` — PASS contra `https://washingtonmsdj.github.io/medatlas/`.
- **Atlas completo responsivo:** desktop → 1440 → 390 px, geometria real + estado `Atlas pronto`, PASS em **28,3 s** no runner headless.
- **Bundle:** JS inicial ~**324,35 kB**; renderer canônico lazy ~**496,01 kB**; gate de bundle ativo.
- **Artifact visual verde:** `visual-qa-34117852477` — **19 capturas** revisadas: Explorer completo, Clinical Studio, Dashboard, Pacientes, Consultas, Exames, picking focado, preview e portal do paciente em desktop/mobile.
- **Correções fechadas nesta rodada:** asset base em subpath, fake 3D removido, preview pré-publicação com Human Atlas real, stale state fail-closed, picking sem mutar relatório, destaque de inspeção de alto contraste, dock clínico mobile, portal patient 390 px e isolamento do CSS do Explorer completo.

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

Não voltar ao visual/pedestal original do upstream nas superfícies clinical/patient.

### 3.1 Regra 3D-first — ONDE O MODELO REAL DEVE APARECER

O diferencial do MedAtlas é a anatomia 3D integrada ao workflow, não um Atlas isolado.

| Superfície | Uso do 3D | Contrato |
| --- | --- | --- |
| **Visão geral** | preview real do atendimento atual | `AnatomyFocusPreview → HumanAtlasScene` |
| **Pacientes** | anatomia do relatório atual em modo patient | mesmo engine, sem thumbnail fake |
| **Consultas** | foco anatômico permanece visível durante a sessão | mesmo engine clinical |
| **Exames** | conceito FMA ligado ao texto aparece em geometria real | documento → conceito → 3D |
| **Relatórios visuais** | Clinical 3D Workbench completo | busca, confirmação, contexto, câmera |
| **Preview do paciente (pré-publicação)** | Human Atlas real em modo patient | preview local, não publica nem contorna review gate |
| **Atlas 3D** | explorer completo de ~2.234 peças | picking, sistemas, explode, inspector |
| **Link do paciente** | 3D real é o elemento visual dominante | modo patient, controles simplificados |
| **Equipe / Analytics / Configurações** | **sem canvas 3D de propósito** | não existe tarefa anatômica; evitar decoração e custo de GPU |

Regras permanentes:

- [x] o placeholder/orbit “3D” do Dashboard foi removido;
- [x] nenhuma superfície anatômica usa imagem estática para fingir 3D;
- [x] o preview do paciente dentro do Report Studio usa o Human Atlas real antes da publicação;
- [x] `AnatomyFocusPreview` reutiliza `HumanAtlasScene`; não é renderer novo;
- [x] sem conceito FMA válido, a UI mostra estado vazio e **não inventa modelo**;
- [x] status mostra quando a geometria real terminou de carregar;
- [x] seleção clínica confirmada e inspeção visual temporária são estados diferentes; clicar numa peça não muda o relatório;
- [x] a peça inspecionada recebe destaque visual distinto e o inspector pode ser fechado sem alterar o foco clínico;
- [x] hover só antecipa interatividade; não muda seleção, inspeção persistida nem estado do relatório;
- [x] toda prévia contextual explicita que o 3D é interativo e orienta arrastar/clicar, sem duplicar lógica por módulo;
- [x] troca de superfície desmonta o renderer anterior;
- [x] cleanup canônico cancela animation frame, listeners/observer e descarta controls, geometrias, materiais, textures e renderer WebGL;
- [x] source gate falha se Dashboard voltar ao placeholder fake ou se Pacientes/Consultas/Exames perderem o preview canônico;
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

### Unidades e workspaces — IMPLEMENTADO EM SOURCE/UI

- [x] `organization_units`.
- [x] `clinical_workspaces`.
- [x] FK tenant-safe workspace → unit + organization.
- [x] policies admin-write.
- [x] switcher local de unidade/workspace.
- [x] Ortopedia / Cardiologia / Fisioterapia no demo.
- [x] E2E do switcher.

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
2. [x] validar Browser E2E completo contra deploy — baseline atual: CI `34117852517` PASS, Browser E2E `34117852477` 27/27 PASS e Pages/Playwright remoto `34117434772` PASS;
3. [x] concluir pré-piloto automatizado + revisão visual do artifact verde — `visual-qa-34117852477`, 19 capturas;
4. [ ] executar piloto manual sintético no preview com navegação humana real;
5. [ ] corrigir UX adicional encontrada no piloto manual;
5. [ ] preparar Supabase dedicado (P2) quando autorizado;
6. [ ] preparar termos, privacidade e compliance do mercado-alvo;
7. [ ] somente então desenhar piloto clínico controlado com dados permitidos.

Se GitHub Pages continuar dependendo de configuração administrativa, não criar workaround inseguro. Se Vercel tiver quota/bloqueio, não alterar arquitetura para contornar quota.

---

## 9. Próxima ação recomendada

Se continuar **sem Supabase ativo**:

1. preservar o baseline funcional `947f1e8…` — CI `34155102125` PASS, Browser E2E `34155102100` PASS, GitHub Pages Preview `34155102051` PASS;
2. manter CI, Browser E2E e Playwright 3D do GitHub Pages verdes; artifact visual atual: `visual-qa-34155102100` (`10030771560`);
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
