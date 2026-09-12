# MedAtlas — MVP release readiness

Checkpoint: **2026-09-12**  
Canonical branch: `main`  
Runtime OCR/same-origin: **`4a77ad954eed46da3bb215beea3bf96a11d36b2a`**  
HEAD Browser final: **`54636a2542b9accc58989d89411eaa979bbcd0b2`**  
Source Pages OCR: **`8d8111b650bd34b55b8f42d6e172359338e8bbe1`**

## Verdict

### Browser MVP sintético

**QUALIFICADO PARA PILOTO MANUAL SINTÉTICO.**

O fluxo browser atual está publicado e passou pelos gates de CI, Browser E2E e verificação remota do GitHub Pages. Ele pode ser usado para avaliar UX, navegação, compreensão do 3D, ingestão local de TXT/MD/PDF textual, OCR local de PNG/JPEG e o fluxo profissional → paciente usando apenas dados sintéticos.

Preview público canônico:

`https://washingtonmsdj.github.io/medatlas/`

### Produção clínica / dados reais

**NÃO PRONTO.**

O preview continua `synthetic-only`. Não inserir nomes reais, exames reais, identificadores, PHI ou outros dados clínicos reais. Backend de produção, autenticação, isolamento multi-tenant, Storage privado e controles operacionais/compliance permanecem gates separados.

### Imagem / OCR

**PNG/JPEG LOCAL QUALIFICADO; PDF ESCANEADO AINDA BLOQUEADO.**

O candidato aceita PNG/JPEG com OCR local em português, limitado e sem upload. O runtime é lazy; worker, core e modelo são pinados e servidos same-origin pelo próprio MedAtlas, sem CDN/default remoto e sem worker `blob:`. PDF escaneado sem camada textual continua fail-closed até existir pipeline local por página com limites próprios.

## Escopo funcional validado

O candidato atual inclui:

- shell profissional separado da experiência do paciente;
- dashboard task-first e busca global funcional;
- Clinical Report Studio `laudo → anatomia → explicação`;
- Human Atlas/BodyParts3D real e vendorizado como autoridade anatômica FMA;
- Atlas completo, foco clínico e modo paciente derivados do mesmo sistema anatômico;
- órgão em detalhe como profundidade suplementar, sem alterar a confirmação clínica;
- triagem determinística e confirmação anatômica explícita;
- rascunho educacional, edição, revisão humana e publicação fail-closed;
- preview pré-publicação que distingue conteúdo revisado de conteúdo pendente;
- share demo temporário/versionado/revogável;
- portal paciente com anatomia de referência, branding e explicação revisada;
- Analytics demo local;
- Equipe/permissões source-first sem mutações fake;
- responsividade desktop/mobile e axe/WCAG;
- texto digitado/colado e importação local `.txt`/`.md` com limite de **64 KiB por bytes UTF-8**;
- importação local de **PDF textual** com limite de **8 MiB, 50 páginas e 64 KiB extraídos**;
- validação PDF de extensão, MIME, assinatura `%PDF-`, tamanho, páginas, senha, malformação e presença de texto;
- parser/worker PDF.js local e lazy, sem upload e sem fetch remoto do parser;
- importação local de **PNG/JPEG** com OCR português, limite de **6 MiB, 4096 px por lado, 4,5 MP e 64 KiB extraídos**;
- validação binária de imagem por extensão/MIME/assinatura/dimensões/pixels antes do Tesseract;
- Tesseract.js `7.0.0`, core `7.0.0` e modelo português `1.0.0` pinados, locais e lazy;
- OCR cancelável, com progresso explícito e preservação do último texto válido em falha/cancelamento;
- texto importado sempre editável antes da análise anatômica;
- nenhuma importação executa análise anatômica, confirmação, revisão ou publicação automaticamente.

## Ingestão PDF — arquitetura validada

A implementação usa `pdfjs-dist` **6.3.289** fixado no lockfile.

`src/ingestion/local-report-file.ts` faz o roteamento de formato e carrega `src/ingestion/pdf.ts` por `await import('./pdf')`; portanto PDF.js não entra no caminho inicial da aplicação.

O parser:

- usa worker local `pdfjs-dist/build/pdf.worker.min.mjs?url`;
- valida extensão + MIME e limite de 8 MiB antes do parse;
- exige assinatura `%PDF-`;
- limita documento a 50 páginas;
- limita texto extraído a 64 KiB;
- rejeita documento protegido por senha, malformado ou sem texto extraível;
- usa controles suportados pelo PDF.js 6 para desativar recursos desnecessários à extração textual;
- não executa `Encontrar anatomia`, não confirma FMA, não revisa e não publica.

PDF sem camada textual retorna um estado explícito de OCR de PDF indisponível. Isso não conflita com o OCR de PNG/JPEG já qualificado.

## OCR de imagem — arquitetura validada

A implementação usa `tesseract.js` **7.0.0** + `@tesseract.js-data/por` **1.0.0** fixados no lockfile.

A fronteira:

- aceita somente `.png`, `.jpg` e `.jpeg` no gate atual;
- valida extensão + MIME e limite de 6 MiB antes de ler/processar;
- valida assinatura real PNG/JPEG e dimensões estruturais antes de importar Tesseract;
- limita lado a 4096 px e área total a 4,5 MP;
- limita texto OCR aceito a 64 KiB;
- usa `await import('tesseract.js')`, fora do caminho inicial;
- resolve `workerPath`, `corePath` e `langPath` relativamente ao `BASE_URL`;
- usa `workerBlobURL: false`, exigindo worker direto same-origin;
- não possui fallback remoto silencioso para worker/core/modelo;
- oferece progresso e cancelamento por `AbortController`;
- encerra o worker ao final;
- não executa `Encontrar anatomia`, não confirma FMA, não revisa e não publica.

O build prepara somente 8 assets OCR LSTM necessários e gera manifesto com SHA-256. O Pages verifica cada arquivo publicado contra esse manifesto.

### Bundle e distribuição

Build observado no checkpoint OCR:

- entry principal: ~**350,8 KB**;
- core JavaScript sem PDF: ~**961,1 KB**;
- parser PDF lazy: ~**431,9 KB**;
- worker PDF local: ~**1.265,4 KB**;
- assets OCR distribuídos: **21.780.497 bytes** em 8 arquivos;
- pior conjunto utilizado por uma execução OCR: ~**8,27 MB**, pois somente um fallback de core é escolhido.

Os budgets do core permanecem separados dos budgets opcionais de PDF e OCR. Não aumentar o teto do core para absorver parser/worker/modelos.

PDF.js é Apache-2.0. Tesseract.js/core são Apache-2.0. O modelo português é MIT. Licenças/proveniência são validadas no CI e registradas em `THIRD_PARTY_NOTICES.md`.

## Arquitetura 3D canônica

Existe uma única autoridade Human Atlas para BodyParts3D/FMA:

1. **Atlas completo** — exploração do corpo e sistemas;
2. **modo clínico focado** — recorte semântico para a estrutura/contexto confirmado;
3. **modo paciente** — mesma anatomia com linguagem/controles apropriados;
4. **órgão em detalhe** — profundidade suplementar após seleção válida, nunca segunda fonte de verdade.

Exploração e confirmação clínica são estados diferentes. Picking, busca ou destaque temporário nunca podem alterar silenciosamente a anatomia aprovada.

Human Atlas upstream permanece fixado ao source/proveniência registrada pelo projeto, com assets BodyParts3D locais e gates de integridade/licença.

## Evidência atual

### CI

Run **`34723473730` — PASS completo** no HEAD `54636a2542b9accc58989d89411eaa979bbcd0b2`.

Inclui:

- dependency audit;
- DB/organization/publication/repository contracts;
- share/revocation/patient-share;
- anatomy + demo scenarios;
- vendored assets + performance;
- security/privacy e fronteira de ingestão TXT/MD/PDF/PNG/JPEG;
- OCR contract com worker/core/modelo local, lazy, pinado e same-origin;
- AI contract + clinical review gate;
- report workflow;
- license/provenance;
- reference atlas;
- MVP UI contract;
- TypeScript;
- production build;
- bundle budget segmentado para core/PDF/OCR.

### Browser E2E

Run **`34723473763` — PASS completo nos três shards**.

- `clinical-flow` — PASS, incluindo TXT, PDF real, PDF >8 MiB, imagem inválida/oversize e OCR português real same-origin;
- `responsive-layout` — PASS;
- `supporting-contracts` — PASS.

O contrato de teste OCR avalia o texto reconhecido semanticamente, porque OCR é probabilístico, mas mantém exatas as garantias de infraestrutura: worker/core/modelo local, ausência de CDN, worker não-`blob:` e nenhuma transição clínica automática.

### GitHub Pages Preview

Run **`34723466362` — PASS completo** no source `8d8111b650bd34b55b8f42d6e172359338e8bbe1`.

Jobs verdes:

- build;
- deploy;
- verificação de shell/assets;
- Chromium do fluxo clínico 3D publicado;
- importação de PDF textual real no deploy;
- OCR PNG real em português no deploy;
- worker OCR direto sob `/medatlas/ocr-assets/`, sem `blob:`/CDN;
- manifesto com **8 assets / 21.780.497 bytes** e SHA-256 de cada arquivo verificado no conteúdo publicado;
- Atlas mobile publicado.

## Correções de robustez consolidadas

### Intake de laudo

A UI, o controlador e `src/product/constraints.ts` compartilham limites reais. TXT/MD usam leitura fatal UTF-8; PDF tem limites próprios; PNG/JPEG passam por validação binária/dimensional antes do OCR. `ReportIntake` não lê bytes diretamente.

Qualquer falha/cancelamento de arquivo preserva o último texto válido e bloqueia a continuação quando a fonte atual não é válida.

### Prévia do paciente e gate de revisão

`PatientReportPage` deriva estado revisado da conclusão real + `reviewApproval`; conteúdo pendente não atribui revisor inexistente e usa estado visual de warning. Editar conteúdo invalida aprovação e links dependentes conforme o workflow.

### QA 3D

Superfícies WebGL continuam viewport-aware. `IntersectionObserver`/pausa offscreen não devem ser removidos para satisfazer screenshots. Os testes trazem a superfície ao viewport antes de exigir frame/canvas observável.

## Gate seguinte do MVP

O piloto manual sintético continua válido e agora deve incluir ao menos um PDF textual e uma imagem PNG/JPEG sintética com OCR local conforme `docs/PILOT.md`.

O próximo salto de ingestão é **PDF escaneado/image-only**, não outra reimplementação do OCR de imagem. Antes de aparecer na UI, essa capacidade deverá ter:

- rasterização local por página usando uma fronteira mantida/pinada;
- limite explícito de páginas submetidas ao OCR e orçamento total de pixels/memória/CPU;
- reutilização da fronteira OCR já validada, sem duplicar Tesseract no componente React;
- progresso/cancelamento cobrindo documento e página atual;
- falha parcial/total definida de forma fail-closed;
- limite final de 64 KiB de texto editável;
- nenhuma análise/confirmação/publicação automática;
- security contract, Browser E2E, budget e prova no deploy antes de expor a capacidade.

Não adicionar OCR casual de PDF no componente React para marcar o item como concluído.

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
- remote AI, auth, billing ou dados reais fingidos por frontend;
- Vercel/Supabase como dependência para validar o MVP sintético atual.
