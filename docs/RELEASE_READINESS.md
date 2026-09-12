# MedAtlas — MVP release readiness

Checkpoint editorial: **2026-09-12**  
Canonical branch: `main`

## Verdict

### Browser MVP sintético

**QUALIFICADO PARA PILOTO MANUAL SINTÉTICO quando CI, Browser E2E e GitHub Pages estiverem verdes para o mesmo source candidato.**

O escopo do MVP é uma experiência browser 3D-first para demonstrar, com dados exclusivamente sintéticos, o fluxo profissional → paciente:

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
- preview pré-publicação que distingue conteúdo revisado de conteúdo pendente;
- share demo temporário, versionado e revogável;
- portal paciente com anatomia de referência, branding e explicação revisada;
- Analytics demo local;
- Equipe/permissões source-first sem mutações fake;
- responsividade desktop/mobile e axe/WCAG;
- ingestão local de TXT/MD, PDF textual, PDF escaneado/image-only e PNG/JPEG;
- nenhuma importação executando análise anatômica, confirmação, revisão ou publicação automaticamente.

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
- reutilização do mesmo OCR local de imagem, sem segunda stack Tesseract;
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

## Distribuição e budgets

PDF.js e Tesseract permanecem fora do caminho inicial e são carregados sob demanda. O CI mantém budgets separados para core, PDF e OCR; não aumentar o budget principal para absorver capacidades opcionais.

Assets de OCR são preparados a partir das dependências pinadas e possuem manifesto de integridade SHA-256. Assets Human Atlas e modelos de órgão detalhado também permanecem vendorizados, versionados e verificados.

Licenças/proveniência relevantes:

- Human Atlas: MIT;
- BodyParts3D 4.0: CC BY 4.0;
- PDF.js: Apache-2.0;
- Tesseract.js/core: Apache-2.0;
- modelo português: MIT;
- integração/modelos detalhados de `thebuggeddev/anatomy`: conforme permissão/proveniência registrada em `docs/UPSTREAM_ANATOMY.md`.

## Arquitetura 3D canônica

Existe uma única autoridade Human Atlas para BodyParts3D/FMA:

1. **Atlas completo** — exploração do corpo e sistemas;
2. **modo clínico focado** — recorte semântico para a estrutura/contexto confirmado;
3. **modo paciente** — mesma anatomia com linguagem/controles apropriados;
4. **órgão em detalhe** — profundidade suplementar após seleção válida, nunca segunda fonte de verdade.

Exploração e confirmação clínica são estados diferentes. Picking, busca ou destaque temporário nunca podem alterar silenciosamente a anatomia aprovada.

## Gates obrigatórios de release

Não declarar um source pronto com evidência de outro commit. O mesmo candidato deve passar:

### 1. CI

- `npm ci`;
- auditoria de dependências de produção;
- contratos DB/organization/publication/repository/share/patient-share;
- anatomia + cenários demo;
- integridade de assets e performance;
- security/privacy;
- OCR;
- cobertura completa da matriz Browser E2E;
- AI/review/workflow;
- licenças/proveniência;
- reference atlas;
- MVP UI;
- TypeScript;
- production build;
- bundle budget.

`validate:browser-e2e-matrix` enumera todos os `tests/e2e/*.spec.ts` e falha se algum spec não pertencer a exatamente um shard, se houver referência para arquivo inexistente ou se um spec for executado em duplicidade.

### 2. Browser E2E

Os quatro shards devem ficar verdes:

- `clinical-flow` — workflow profissional → paciente, revisão e share;
- `document-ingestion` — TXT/MD, PDF textual, PDF escaneado/image-only e OCR PNG/JPEG;
- `responsive-layout` — desktop/mobile e visibilidade 3D;
- `supporting-contracts` — acessibilidade, anatomia em profundidade, permissões e localização do paciente.

A cobertura inclui ingestão TXT/MD/PDF/imagem, OCR real em português, PDF image-only, limites fail-closed, 3D, workflow profissional → paciente, acessibilidade e responsividade. `tests/e2e/scanned-pdf-ocr.spec.ts` é obrigatório no shard `document-ingestion`; não pode existir teste E2E órfão fora da matriz.

### 3. GitHub Pages

O deploy publicado deve provar:

- shell e chunks JS/CSS carregando sob `/medatlas/`;
- Human Atlas e modelos de órgão locais;
- manifesto e SHA-256 dos assets OCR publicados;
- PDF textual usando worker local sob o base path;
- PNG OCR usando apenas assets same-origin;
- **PDF escaneado/image-only usando rasterização + OCR local same-origin no build publicado**;
- nenhuma análise anatômica automática após importação;
- fluxo 3D clínico/paciente e Atlas mobile.

## Correções de robustez que não podem regredir

### Intake de laudo

`ReportIntake` é UI. Leitura/decoding/parsing/OCR pertencem a `src/ingestion/`. Limites pertencem a `src/product/constraints.ts`. Não duplicar parser, limites ou Tesseract em React.

Qualquer falha/cancelamento preserva o último texto válido. Arquivo importado produz somente fonte textual editável.

### Prévia do paciente e gate de revisão

Conteúdo só aparece como revisado quando existe conclusão real + aprovação. Alterar laudo, anatomia ou explicação invalida etapas dependentes e shares conforme a máquina de estado.

### QA 3D

Superfícies WebGL são viewport-aware. Não remover `IntersectionObserver` ou pausa offscreen para satisfazer screenshots. O teste deve observar a superfície como o usuário.

## Bloqueadores de produção clínica

Antes de qualquer dado real:

1. projeto Supabase dedicado ao MedAtlas;
2. migrations canônicas aplicadas;
3. autenticação;
4. provas cross-tenant e RLS por papel;
5. Storage privado com testes de negação;
6. `SupabaseClinicalRepository` como implementação da autoridade existente, sem persistência paralela;
7. share de produção com expiração, revogação e auditoria;
8. políticas de retenção/backup;
9. secrets/environment separation;
10. observabilidade, suporte e resposta a incidentes;
11. revisão jurídica/privacidade para jurisdição/uso pretendidos;
12. protocolo de piloto clínico controlado.

## Não reintroduzir

- renderer 3D simplificado concorrente;
- `OrganizationSwitcher` ou troca fake de workspace no shell;
- `ViewModeSwitcher` global Profissional/Paciente;
- “Novo relatório” duplicado na sidebar/configurações;
- Consultas/Exames como módulos independentes no MVP;
- CSS morto/tema paralelo para contornar cascade;
- estado pendente visualmente apresentado como revisão aprovada;
- IDs FMA na superfície primária do paciente;
- leitura/parsing/OCR de arquivo dentro de `ReportIntake`;
- parser/worker PDF remoto ou eager no bundle inicial;
- OCR com CDN/default remoto silencioso ou worker `blob:`;
- OCR de PDF escaneado sem limites por página/documento;
- spec E2E novo sem inclusão exatamente uma vez na matriz Browser E2E;
- remote AI, auth, billing ou dados reais fingidos por frontend;
- Vercel/Supabase como dependência para validar o MVP sintético atual.
