# MedAtlas — MVP release readiness

Checkpoint editorial: **2026-09-13**  
Canonical branch: `main`

## Verdict

### Browser MVP sintético

**QUALIFICADO COMO MVP BROWSER SINTÉTICO PARA PILOTO.**

Release funcional qualificado atual:

```text
516b53efa58790df133d254581d80fa909a8ce21
```

Esse source passou no próprio `main`, após integração do PR #10:

- CI `34744950754`: **PASS**;
- Browser E2E `34744950764`: **PASS 4/4**;
- GitHub Pages `34744950748`: **PASS** em build, deploy, shell/assets e fluxo 3D publicado em Chromium.

O release preserva a jornada sintética integrada qualificada anteriormente e fecha o primeiro atrito P1 reproduzível encontrado no pente-fino visual: a busca global mobile era comprimida porque o botão de perfil mantinha `min-width: 220px` herdado mesmo depois de esconder seu texto em 390 px.

A correção permanece no shell clínico com `min-width: 0`, e `tests/e2e/responsive-layout.spec.ts` protege a geometria exigindo busca ≥200 px e perfil ≤48 px. O artifact `visual-qa-34744950764-responsive-layout`, gerado pelo mesmo SHA integrado, confirmou visualmente a correção sem nova regressão P0/P1 em Dashboard, Clinical Studio, Pacientes, Atlas, Equipe, Analytics ou Configurações.

O Browser E2E também inclui `tests/e2e/synthetic-pilot.spec.ts`, que prova uma jornada única de ponta a ponta:

```text
TXT local sintético
  → editor
  → encontrar anatomia
  → confirmação explícita
  → Human Atlas 3D
  → rascunho educacional
  → prévia do paciente
  → aprovação humana
  → share
  → portal paciente revisado
  → alteração da fonte
  → reconfirmação obrigatória
  → link anterior inválido
```

A etapa manual restante é **qualitativa**: clareza de uso, compreensão, conforto visual e atritos reais observados por pessoas usando dados fictícios. Ela não compensa ausência de cobertura funcional automatizada.

O escopo continua sendo uma experiência browser 3D-first, com dados exclusivamente sintéticos:

```text
laudo / relatório
  → ingestão local
  → triagem anatômica
  → confirmação profissional
  → Human Atlas 3D
  → explicação ao paciente
  → revisão humana
  → prévia
  → share temporário
  → experiência do paciente
```

Preview público canônico:

`https://washingtonmsdj.github.io/medatlas/`

### Produção clínica / dados reais

**NÃO PRONTO e fora deste gate.**

O preview continua `synthetic-only`. Não inserir nomes reais, exames reais, identificadores, PHI ou outros dados clínicos reais. Backend de produção, autenticação, isolamento multi-tenant, Storage privado e controles operacionais/compliance permanecem gates separados.

## Escopo funcional do MVP

O candidato inclui:

- shell profissional separado da experiência do paciente;
- dashboard task-first e busca global funcional;
- Clinical Report Studio `laudo → anatomia → explicação`;
- Human Atlas/BodyParts3D real e vendorizado como autoridade anatômica FMA;
- Atlas completo, foco clínico e modo paciente derivados do mesmo sistema anatômico;
- órgão em detalhe como profundidade suplementar, sem alterar a confirmação clínica;
- triagem determinística e confirmação anatômica explícita;
- rascunho educacional, edição, revisão humana e publicação fail-closed;
- preview pré-publicação distinguindo conteúdo revisado de pendente;
- share demo temporário, versionado e revogável;
- portal paciente com anatomia de referência, branding e explicação revisada;
- Analytics demo local;
- Equipe/permissões source-first sem mutações fake;
- responsividade desktop/mobile, axe/WCAG e geometria mobile do topbar protegida;
- ingestão local de TXT/MD, PDF textual, PDF escaneado/image-only e PNG/JPEG;
- nenhuma importação executando análise anatômica, confirmação, revisão ou publicação automaticamente;
- jornada integrada local-intake → paciente protegida por Browser E2E;
- identidade demo centralizada em `src/demo/identity.ts`.

## Ingestão local — arquitetura qualificada

### TXT/MD

- até **64 KiB UTF-8**;
- decoding fatal UTF-8;
- validação centralizada em `src/product/constraints.ts`;
- falha preserva o último texto válido.

### PDF textual

A implementação usa `pdfjs-dist` **6.3.289** pinado.

- arquivo até **8 MiB**;
- até **50 páginas**;
- até **64 KiB** de texto extraído;
- extensão, MIME e assinatura `%PDF-` validados;
- senha e documento malformado falham fechado;
- parser e worker locais/lazy;
- nenhum fetch remoto de parser/worker;
- texto extraído entra no editor, não no workflow clínico automaticamente.

### PDF escaneado / image-only

Quando um PDF válido não possui camada textual utilizável, `src/ingestion/pdf.ts` faz lazy fallback para `src/ingestion/scanned-pdf-ocr.ts`.

A fronteira é local e limitada:

- máximo de **8 páginas submetidas ao OCR**;
- escala máxima de render **2**;
- dimensão máxima renderizada de **2400 px**;
- máximo de **2,5 MP por página**;
- máximo de **16 MP no documento rasterizado**;
- máximo de **12 MP para imagem embutida**;
- reutilização do mesmo OCR local de imagem;
- progresso por documento/página e cancelamento;
- falha/cancelamento preservam o último texto válido;
- OCR sem texto suficiente continua fail-closed;
- nenhuma análise anatômica automática.

### PNG/JPEG

A implementação usa `tesseract.js` **7.0.0** + `@tesseract.js-data/por` **1.0.0** pinados.

- até **6 MiB**;
- máximo de **4096 px por lado**;
- máximo de **4,5 MP**;
- até **64 KiB** de texto OCR;
- extensão/MIME + assinatura binária + dimensões/pixels antes de carregar Tesseract;
- worker, core e modelo português same-origin;
- `workerBlobURL: false`;
- nenhum fallback silencioso para CDN;
- progresso/cancelamento;
- resultado sempre editável antes da interpretação clínica.

## Distribuição, budgets e provenance

PDF.js e Tesseract permanecem fora do caminho inicial e são carregados sob demanda. O CI mantém budgets separados para core, PDF e OCR; não aumentar o budget principal para absorver capacidades opcionais.

Assets OCR possuem manifesto de integridade SHA-256. Human Atlas e modelos detalhados também permanecem vendorizados, versionados e verificados.

Licenças/proveniência relevantes:

- Human Atlas: MIT;
- BodyParts3D 4.0: CC BY 4.0;
- PDF.js: Apache-2.0;
- Tesseract.js/core: Apache-2.0;
- modelo português: MIT;
- integração/modelos detalhados de `thebuggeddev/anatomy`: conforme `docs/UPSTREAM_ANATOMY.md`.

## Arquitetura 3D canônica

Existe uma única autoridade Human Atlas para BodyParts3D/FMA:

1. **Atlas completo** — exploração do corpo e sistemas;
2. **modo clínico focado** — recorte semântico para a estrutura/contexto confirmado;
3. **modo paciente** — mesma anatomia com linguagem/controles apropriados;
4. **órgão em detalhe** — profundidade suplementar após seleção válida, nunca segunda fonte de verdade.

Exploração e confirmação clínica são estados diferentes. Picking, busca ou destaque temporário nunca podem alterar silenciosamente a anatomia aprovada.

## Identidade demo canônica

Dados sintéticos compartilhados entre organização e relatório pertencem a `src/demo/identity.ts`: organização demo, workspace padrão, profissional atual e paciente demo.

`src/organization/demo-organization.ts` e `src/domain/demo.ts` consomem essa SSOT. `validate:organization-runtime` falha se o seed voltar a duplicar os literais protegidos.

## Gates obrigatórios de release

Não declarar um source pronto com evidência de outro commit. O mesmo candidato deve passar:

### 1. CI

- `npm ci` e auditoria de dependências;
- contratos DB/organization/publication/repository/share/patient-share;
- anatomy + cenários demo;
- integridade de assets e performance;
- security/privacy;
- OCR;
- `validate:browser-e2e-matrix`;
- AI/review/workflow;
- licenças/proveniência;
- reference atlas;
- MVP UI;
- TypeScript;
- production build;
- bundle budget.

### 2. Browser E2E

Os quatro shards devem ficar verdes:

- `clinical-flow` — workflow profissional → paciente, revisão, share e `synthetic-pilot.spec.ts`;
- `document-ingestion` — TXT/MD, PDF textual, PDF escaneado/image-only e OCR PNG/JPEG;
- `responsive-layout` — desktop/mobile, visibilidade 3D e geometria do topbar em 390 px;
- `supporting-contracts` — acessibilidade, anatomia em profundidade, permissões e localização do paciente.

Nenhum `tests/e2e/*.spec.ts` pode ficar fora da matriz ou aparecer em duplicidade.

### 3. GitHub Pages

O deploy publicado deve provar:

- shell e chunks JS/CSS carregando sob `/medatlas/`;
- Human Atlas e modelos de órgão locais;
- manifesto e SHA-256 dos assets OCR publicados;
- PDF textual usando worker local;
- PNG OCR usando apenas assets same-origin;
- PDF escaneado/image-only usando rasterização + OCR local same-origin;
- nenhuma análise anatômica automática após importação;
- fluxo 3D clínico/paciente e Atlas mobile.

## Evidência atual

```text
source:  516b53efa58790df133d254581d80fa909a8ce21
CI:      34744950754 PASS
Browser: 34744950764 PASS 4/4
Pages:   34744950748 PASS
```

Artifact responsivo do mesmo source:

```text
visual-qa-34744950764-responsive-layout
sha256:335427f243b498a07c4952530a52cbfe0fae14bce06f1aca89ad0570c0439dff
```

## Próximo gate

O próximo trabalho é **piloto qualitativo sintético**, não nova arquitetura. Corrigir apenas atritos P0/P1 reproduzíveis. Produção clínica, PHI, Supabase real e IA remota permanecem bloqueados até autorização explícita e implementação dos gates de produção.
