# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.
> Este arquivo registra estado, decisões e próximo trabalho. Não é diário de commits.

Última consolidação: **2026-09-12**  
Branch canônica: **`main`**  
Repositório: **`washingtonmsdj/medatlas`**

## 0. Missão — não reinterpretar

MedAtlas é um **SaaS clínico visual B2B/B2B2C** para transformar laudos/relatórios em uma explicação anatômica 3D compreensível, revisada por um profissional e compartilhável com o paciente.

Fluxo canônico:

```text
laudo / relatório
      ↓
triagem anatômica
      ↓
conceito real FMA / BodyParts3D
      ↓
confirmação explícita do profissional
      ↓
Human Atlas 3D de referência
      ↓
explicação em linguagem clara
      ↓
revisão clínica obrigatória
      ↓
prévia / publicação
      ↓
link e experiência do paciente
```

O wedge é **comunicação clínica visual entre profissional e paciente**. MedAtlas não é diagnosticador automático, PACS, prontuário completo, segmentador DICOM nem reconstrução 3D específica do paciente.

## 1. Estado atual do MVP

### MVP browser sintético — qualificado para piloto sintético

- [x] shell profissional separado da experiência do paciente;
- [x] dashboard clínico task-first;
- [x] Clinical Report Studio: laudo → anatomia 3D → explicação;
- [x] Human Atlas/BodyParts3D real e vendorizado como engine anatômico canônico;
- [x] Atlas completo, modo clínico focado e modo paciente usando a mesma autoridade FMA;
- [x] órgão detalhado apenas como profundidade suplementar;
- [x] triagem determinística + confirmação humana obrigatória;
- [x] rascunho educacional + edição + aprovação clínica obrigatória;
- [x] preview do paciente antes da publicação;
- [x] preview pendente não se apresenta como revisão concluída;
- [x] portal publicado e links inválidos/revogados permanecem autocontidos;
- [x] share demo opaco, versionado, temporário e revogável;
- [x] Analytics local demo;
- [x] Equipe/permissões sem mutações fake;
- [x] Configurações demo deixam branding/estado não persistente explicitamente read-only;
- [x] ação `Novo relatório` permanece canônica no Dashboard/busca global, sem launcher duplicado;
- [x] navegação mobile prioriza `Visão geral` + `Pacientes` e mantém módulos secundários via `Mais`;
- [x] modo paciente usa contexto anatômico regional coerente sem alterar o FMA confirmado;
- [x] responsividade desktop/mobile e axe/WCAG protegidos por Browser E2E;
- [x] GitHub Pages publicado e verificado em Chromium;
- [x] ingestão local de texto digitado/colado, TXT, MD e **PDF textual**, sem upload;
- [x] TXT/MD e texto do editor limitados a 64 KiB por bytes UTF-8;
- [x] PDF limitado a **8 MiB, 50 páginas e 64 KiB de texto extraído**;
- [x] PDF valida extensão, MIME, assinatura `%PDF-`, tamanho, páginas, criptografia, estrutura e texto extraível fail-closed;
- [x] PDF.js `6.3.289` fica pinado, local e lazy; worker não depende de CDN;
- [x] parser/worker PDF têm budget separado e não aumentam o budget do core inicial;
- [x] licença Apache-2.0 do PDF.js é validada e distribuída em `dist/licenses/pdfjs-LICENSE.txt`;
- [x] ingestão local de **PNG/JPEG com OCR em português**, sem upload;
- [x] imagem limitada a **6 MiB, 4096 px por lado, 4,5 MP e 64 KiB de texto OCR**;
- [x] imagem valida extensão, MIME, assinatura binária e dimensões/pixels antes de carregar Tesseract;
- [x] Tesseract.js `7.0.0`, core `7.0.0` e modelo português `1.0.0` ficam pinados, locais e lazy;
- [x] worker OCR é direto same-origin (`workerBlobURL: false`), sem CDN/default remoto;
- [x] OCR tem progresso/cancelamento e falha/cancelamento preservam o último texto válido;
- [x] assets OCR têm manifesto SHA-256 e budgets separados, sem relaxar o core inicial;
- [x] `src/ingestion/` é a fronteira tipada de arquivo → validação → extração/OCR para TXT/MD/PDF/PNG/JPEG;
- [x] `ReportIntake` não lê bytes de arquivo diretamente;
- [x] falha de ingestão preserva o último texto válido;
- [x] importar arquivo apenas produz texto editável; não executa análise anatômica, não confirma FMA e não publica;
- [x] piloto visual com capturas reais do Browser E2E gerando correções concretas de UX.

### Fora do MVP browser atual

- [ ] OCR de **PDF escaneado/image-only** sem camada textual;
- [ ] autenticação real;
- [ ] Supabase de produção ativo;
- [ ] armazenamento clínico real;
- [ ] dados reais de pacientes / PHI;
- [ ] IA remota em produção;
- [ ] billing;
- [ ] convites/mutações reais de equipe;
- [ ] piloto clínico com dados reais.

Esses itens **não podem ser simulados por botões fake, hardcode, parser improvisado ou dependência remota silenciosa**.

## 2. Invariantes

1. Existe **um único Human Atlas canônico** para autoridade BodyParts3D/FMA.
2. Explorer, Studio clínico e Patient são modos do mesmo sistema anatômico.
3. Viewer de órgão detalhado é suplementar e nunca muda a fonte de verdade clínica.
4. BodyParts3D/FMA representa anatomia humana de referência, nunca corpo individual do paciente.
5. Explorar/clicar não equivale a confirmar anatomia.
6. Nenhuma anatomia sem conceito FMA/renderizável vira confirmação clínica.
7. IA não publica e não substitui revisão humana.
8. Mudança de laudo/anatomia/explicação invalida revisões e shares correspondentes conforme workflow.
9. `ClinicalRepository` permanece autoridade de dados; não criar persistência paralela.
10. Demo permanece `synthetic-only` e sem telemetria clínica externa.
11. Token de share/convite não pode virar identificador previsível.
12. Storage clínico de produção nunca pode ser público.
13. Não reutilizar Supabase de outro produto.
14. Não reintroduzir `OrganizationSwitcher`, `ViewModeSwitcher`, launcher duplicado de Novo relatório ou módulos Consultas/Exames separados.
15. IDs FMA e detalhes de implementação não pertencem à superfície primária do paciente.
16. Atlas completo preserva caso → corpo → detalhe enquanto houver largura útil.
17. Não ressuscitar CSS morto/tema paralelo para vencer cascade.
18. PDF/imagem só entram por subsystem seguro de ingestão.
19. Supabase/auth/IA remota só entram com gates próprios.
20. Prévia sem aprovação clínica comunica **pendência**, nunca sucesso ou autoria inexistente.
21. Ação já concluída não deve competir visualmente com o próximo CTA real do fluxo.
22. Portal do paciente publicado é autocontido; retorno explícito ao profissional existe apenas na prévia interna.
23. Em mobile, módulos secundários não podem desaparecer: ficam atrás de `Mais` e os testes devem navegar pelo caminho real.
24. QA visual de WebGL deve observar a superfície como o usuário: renderer pausado fora do viewport não é falha.
25. Não remover `IntersectionObserver`/pausa offscreen para “consertar” screenshots.
26. Ausência de modelo 3D suplementar nunca deve sugerir que a anatomia clínica confirmada está errada.
27. Superfícies do paciente priorizam contexto anatômico espacial/regional sem trocar o conceito FMA confirmado.
28. Ações globais do fluxo não devem reaparecer como launcher local sem semântica própria.
29. Ingestão documental separa arquivo, validação, extração de texto e interpretação clínica; parser/OCR não pertence ao componente React nem publica diretamente.
30. `ReportIntake` não pode ler bytes de arquivo diretamente; decoding/extraction pertence a `src/ingestion/`.
31. Falha de ingestão nunca substitui o último texto válido do laudo.
32. Texto extraído continua sendo **entrada editável**, nunca confirmação anatômica, diagnóstico, revisão ou publicação.
33. PDF.js e seu worker permanecem **locais e lazy**; não introduzir fetch de parser/worker/core por CDN ou serviço remoto.
34. PDF deve falhar fechado por extensão/MIME, limite de 8 MiB, assinatura `%PDF-`, limite de 50 páginas, limite de 64 KiB extraídos, senha, documento malformado ou ausência de texto extraível.
35. Importar PDF não pode executar `Encontrar anatomia`, confirmar FMA, aprovar conteúdo ou publicar; apenas preenche a fonte textual editável.
36. Parser e worker PDF têm budgets opcionais próprios; não afrouxar o budget do core para absorvê-los. A licença Apache-2.0 deve acompanhar o artefato distribuído.
37. OCR de imagem permanece local/vendorizado, lazy e limitado; worker/core/modelos de idioma não podem depender de CDN/default remoto.
38. PNG/JPEG devem validar extensão, MIME, assinatura binária, bytes, dimensão por lado e total de pixels **antes** de carregar Tesseract.
39. Worker/core/modelo OCR são pinados e same-origin; `workerBlobURL: false` é contrato, não otimização opcional.
40. OCR de imagem aceita somente PNG/JPEG no gate atual; PDF sem camada textual continua fail-closed e não herda OCR implicitamente.
41. Cancelamento/falha OCR preserva o último texto válido; sucesso produz apenas fonte textual editável.
42. OCR nunca executa anatomia, confirmação FMA, revisão ou publicação automaticamente.
43. Assets OCR possuem manifesto SHA-256 e budget separado; não afrouxar budgets de entry/core para absorvê-los.
44. Proveniência/licenças de Tesseract.js/core e modelo português devem permanecer verificadas e distribuídas conforme o contrato de terceiros.
45. Testes OCR tratam reconhecimento textual como probabilístico/semântico; paths, same-origin, hashes, limites e transições clínicas permanecem contratos exatos.

## 3. Correções MVP consolidadas

### 3.1 Intake — limite real de 64 KiB

A UI e o controlador compartilham a mesma autoridade de limite por bytes UTF-8 para texto digitado/colado e TXT/MD. Browser E2E protege a barreira.

### 3.2 Portal do paciente — revisão e isolamento corretos

`PatientReportPage` só apresenta conteúdo como revisado quando existe conclusão real + `reviewApproval`. Prévia pendente mostra `REVISÃO PENDENTE`, não inventa revisor e usa semântica de warning.

A prévia interna mantém uma única ação `Voltar ao profissional`. O portal publicado, links inválidos e shares revogados não oferecem retorno artificial ao shell clínico.

### 3.3 Piloto visual — decisões preservadas

- `src/styles/action-state.css` é a autoridade explícita dos CTAs primários/desabilitados.
- `src/styles/reference-atlas-contrast.css` protege contraste dos painéis do Atlas sem tocar no renderer.
- Após confirmação, `Encontrar anatomia` vira `Reanalisar laudo` secundário; volta a primário quando a reconfirmação é necessária.
- Mobile mantém `Visão geral` + `Pacientes` como primários e módulos secundários via `Mais`.
- QA de WebGL é viewport-aware; `IntersectionObserver`/pausa offscreen são intencionais.
- Studio mantém uma única prévia contextual por superfície.
- Detalhe 3D suplementar nunca substitui a anatomia FMA confirmada.
- Pacientes/portal usam `contextMode="region"` para contexto espacial sem trocar FMA.
- Configurações não duplica `Novo relatório`; Dashboard/busca global são as autoridades.
- Analytics e Equipe não devem ser redesenhados sem novo atrito reproduzível.

### 3.4 Fundação da ingestão documental — TXT/MD

- `src/ingestion/contracts.ts` define resultado tipado e códigos de falha;
- `src/ingestion/local-text.ts` é a autoridade para ler TXT/MD;
- `src/product/constraints.ts` centraliza extensões, MIME e limites;
- leitura usa `arrayBuffer()` + `TextDecoder('utf-8', { fatal: true })`;
- extensão, MIME, tamanho, UTF-8 e conteúdo mínimo falham fechado;
- `ReportIntake` somente chama a fronteira e apresenta o resultado;
- falha preserva o último texto válido;
- security contract proíbe leitura direta de bytes em `ReportIntake`;
- Browser E2E cobre MIME incompatível, UTF-8 inválido e limite de 64 KiB.

### 3.5 PDF textual local — concluído

Implementação canônica:

- `src/ingestion/local-report-file.ts` roteia por formato e carrega `./pdf` apenas via `await import(...)`;
- `src/ingestion/pdf.ts` usa `pdfjs-dist` **6.3.289** e worker local `pdf.worker.min.mjs?url`;
- não existe URL remota/fetch no parser de ingestão;
- parser usa somente controles suportados pela API 6 e desliga recursos não necessários à extração textual (`useWasm`, XFA, fontes/canvas/image decoder e worker fetch);
- valida extensão + MIME + tamanho antes do parse e assinatura `%PDF-` antes de entregar bytes ao PDF.js;
- rejeita >8 MiB, >50 páginas, >64 KiB de texto extraído, senha, malformação e PDF sem texto;
- PDF sem camada textual comunica explicitamente que **OCR de PDF escaneado ainda não é suportado**;
- texto extraído entra no mesmo editor e continua separado de `Encontrar anatomia`;
- parser (~431,9 KB) e worker (~1.265,4 KB) são opcionais/lazy;
- `scripts/validate-bundle-budget.mjs` mantém budget do core separado dos budgets PDF;
- `THIRD_PARTY_NOTICES.md`, gate de licença e build protegem Apache-2.0 e `dist/licenses/pdfjs-LICENSE.txt`;
- Pages publicado testa um PDF real e exige worker resolvido em `/medatlas/assets/`.

### 3.6 OCR local de PNG/JPEG — concluído

Implementação canônica:

- `src/ingestion/image-metadata.ts` valida assinatura e metadados estruturais PNG/JPEG;
- `src/ingestion/local-image-ocr.ts` aplica tamanho/dimensões/pixels antes do runtime e importa `tesseract.js` somente via `await import(...)`;
- formatos aceitos: `.png`, `.jpg`, `.jpeg`; MIME: `image/png` e `image/jpeg`;
- limites: **6 MiB**, **4096 px por lado**, **4,5 MP**, **64 KiB de texto OCR**;
- Tesseract.js/core **7.0.0** e `@tesseract.js-data/por` **1.0.0** ficam fixados no lockfile;
- worker, core e modelo `por` são preparados localmente em build/dev por `scripts/prepare-ocr-assets.mjs`;
- runtime usa `BASE_URL`, paths locais e `workerBlobURL: false`; sem CDN/default remoto;
- somente os fallbacks LSTM necessários são distribuídos: **8 arquivos / 21.780.497 bytes**;
- uma execução carrega somente um fallback de core; pior conjunto observado ~**8,27 MB**;
- progresso é acessível e cancelamento usa `AbortController`; o worker é encerrado ao final;
- falha/cancelamento não substituem o texto válido anterior;
- sucesso preenche apenas o editor, sem executar `Encontrar anatomia`;
- `validate:ocr-contract`, security/license gates e bundle budget protegem a fronteira;
- Browser E2E roda OCR português real e testa invalidez/oversize/dimensões;
- Pages verifica manifesto, bytes e SHA-256 dos 8 assets e executa OCR real sob `/medatlas/ocr-assets/`;
- testes de OCR não exigem transcrição byte-a-byte; exigem reconhecimento semântico estável, enquanto garantias de infraestrutura permanecem exatas.

## 4. Checkpoints e validação

### Baseline verde do contexto anatômico regional

Runtime: **`0f4fbb379719c05675787457370d9d6b01d8a11f`**.  
Contrato: **`5a2c0a39f1f20839c55651b381470a439077c16e`**.

- CI **`34699149431` — PASS**;
- Browser **`34699096707` — PASS 3/3**;
- Pages **`34699096669` — PASS**;
- artefato **`10299557362`** confirmou contexto lombar/pélvico coerente.

### Baseline verde — piloto visual fechado

Runtime: **`eaa541b69040b86c84194ddfaa3cfcbe8af54692`**.  
HEAD de testes: **`83c42ab56eb8cecdaf2916571650ac9124b98374`**.

- CI **`34701927508` — PASS**;
- Browser **`34701927501` — PASS**;
- Pages **`34701462500` — PASS**;
- artefato **`10300078764`** confirmou Configurações sem launcher duplicado e sem quebra responsiva.

### Baseline verde — fundação TXT/MD

Runtime: **`795416df188e0b8f60dbec27a314845d0187fa84`**.  
E2E: **`fbf5566770e9f96dcb24a997a8613bd1e32d9790`**.  
Security: **`11a3ac4810e409097d6f76642a3080f5c91c2acd`**.

- CI **`34704644495` — PASS**;
- Browser **`34704614163` — PASS 3/3**;
- Pages **`34702511026` — PASS**.

### Baseline verde — PDF textual local

Runtime/parser: **`75fbc18ac73d97f376e20e8c343d996ba443dfd4`**.  
UI/roteamento: **`8a7c4c8eab243681290f79ff2fedfd8f74898f6a`**.  
Controles PDF.js 6: **`667357f582b338d1888170f5514cdcb29d7cb435`**.  
Distribuição/licença: **`a95458a8ccb34f99eddbe656f6324088aa88b52a`**.  
HEAD final de regressão: **`1b8ae472ba42a83aad59d0ab407c9f3c9ce7342f`**.

- CI **`34714504072` — PASS completo**;
- Browser E2E **`34714504043` — PASS completo nos três shards**, incluindo TXT corrigido, PDF real e PDF >8 MiB fail-closed;
- GitHub Pages **`34708932045` — PASS completo**, incluindo PDF textual real no deploy e worker carregado corretamente sob `/medatlas/assets/`;
- build observado: entry ~347,9 KB; parser PDF lazy ~431,9 KB; worker local ~1.265,4 KB.

O Browser intermediário **`34709060147`** teve 41/42 testes verdes e todos os casos PDF verdes. A única falha era um contrato TXT antigo procurando o label removido `Importar laudo de texto sintético`; foi corrigido em **`ff6a9dc0a656759abda1d78b5e88e9f1847d498a`**. Não foi regressão de runtime/PDF.

### Baseline verde atual — OCR local PNG/JPEG

Runtime OCR/same-origin: **`4a77ad954eed46da3bb215beea3bf96a11d36b2a`**.  
HEAD Browser final: **`54636a2542b9accc58989d89411eaa979bbcd0b2`**.  
Source Pages OCR: **`8d8111b650bd34b55b8f42d6e172359338e8bbe1`**.

- CI **`34723473730` — PASS completo**;
- Browser E2E **`34723473763` — PASS completo 3/3**, incluindo OCR português real no `clinical-flow`;
- GitHub Pages **`34723466362` — PASS completo**, com build/deploy, integridade dos **8 assets OCR / 21.780.497 bytes**, OCR PNG real same-origin, PDF e Atlas mobile;
- entry observado ~350,8 KB e core JS sem PDF ~961,1 KB; OCR permanece lazy e com budget separado;
- worker OCR é direto `/ocr-assets/worker.min.js`, sem `blob:` e sem CDN.

O Browser anterior **`34722819374`** falhou somente porque o teste exigia transcrição OCR byte-a-byte (`LAUDO ... CORACAO`). O Tesseract havia reconhecido semanticamente o conteúdo, mas com ruído de glifos. O contrato foi corrigido para reconhecer conteúdo semanticamente e manter infraestrutura/same-origin como assertivas exatas; não foi regressão de runtime.

## 5. Próxima ordem de trabalho — foco MVP

### P0 — baseline do piloto sintético

O pente-fino visual atual está fechado. Não iniciar outro redesenho abstrato.

Regressão obrigatória:

1. CI completo;
2. Browser E2E nos três shards;
3. Pages quando houver alteração de runtime;
4. QA viewport-aware nas superfícies WebGL;
5. correção somente de atrito reproduzível ou requisito explícito.

### P1 — ingestão documental, sem gambiarra — **TXT/MD/PDF TEXTUAL + PNG/JPEG OCR CONCLUÍDOS**

Concluído:

- [x] fronteira tipada em `src/ingestion/`;
- [x] TXT/MD local fail-closed;
- [x] PDF textual local com limites próprios;
- [x] parser PDF mantido, pinado, local e lazy;
- [x] extensão/MIME/assinatura/tamanho/páginas/texto/senha/malformação PDF fail-closed;
- [x] PNG/JPEG local com assinatura/dimensões/pixels/bytes validados antes do OCR;
- [x] Tesseract/core/modelo português pinados, locais, lazy e same-origin;
- [x] progresso/cancelamento e preservação do último texto válido;
- [x] importação separada da análise anatômica;
- [x] security contract + licença + Browser E2E + Pages publicado;
- [x] budgets PDF/OCR separados sem afrouxar o core.

Próximo gate — **OCR de PDF escaneado/image-only, ainda não implementado**:

1. rasterizar páginas localmente pela fronteira PDF já mantida, sem segunda stack de PDF;
2. definir limite pequeno e explícito de páginas submetidas ao OCR, total de pixels e orçamento de memória/CPU;
3. reutilizar a fronteira OCR atual por página, sem duplicar Tesseract em React;
4. preservar worker/core/modelo locais, pinados, lazy e same-origin;
5. expor progresso de documento + página atual e cancelamento único;
6. definir semântica fail-closed para página sem texto, erro parcial e documento excedente;
7. manter resultado agregado limitado a 64 KiB e editável antes de qualquer análise anatômica;
8. PDF escaneado não pode auto-confirmar anatomia, revisar nem publicar;
9. adicionar security contract, Browser E2E, budget e prova no deploy antes de expor a capacidade na UI.

Storage privado, retenção de dados reais e PHI continuam fora até o gate de produção clínica.

### P2 — produção clínica

Somente após autorização explícita:

1. Supabase dedicado ao MedAtlas;
2. migrations canônicas;
3. auth;
4. provas cross-tenant/RLS;
5. Storage privado e testes de negação;
6. `SupabaseClinicalRepository` como implementação da autoridade existente;
7. share de produção com expiração/revogação/auditoria;
8. retenção, backup, incidentes e observabilidade;
9. validação jurídica/privacidade;
10. piloto clínico controlado antes de PHI.

### P3 — IA remota

Somente depois da fronteira backend existir. Deve retornar estrutura validável, resolver para FMA/renderabilidade e continuar sujeita a confirmação anatômica e revisão humana. Nunca expor segredo de provedor em `VITE_*`.

## 6. Critério desta fase

O MVP browser sintético está **tecnicamente qualificado e visualmente estabilizado para piloto sintético**. TXT/MD, PDF textual e PNG/JPEG com OCR local estão separados, limitados e protegidos. O próximo salto de P1 é **OCR local de PDF escaneado por página**, reutilizando as fronteiras já validadas e sem alterar a autoridade clínica nem liberar dados reais.

Produção clínica continua fora deste gate.

## 7. Arquivos de continuidade

- `README.md` — escopo/arquitetura pública;
- `URGENTE.md` — estado operacional e ordem de trabalho;
- `docs/RELEASE_READINESS.md` — evidência de release e bloqueadores;
- `docs/PILOT.md` — roteiro do piloto sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica e 3D;
- `src/ingestion/contracts.ts` — contrato tipado de ingestão;
- `src/ingestion/local-text.ts` — fronteira TXT/MD local fail-closed;
- `src/ingestion/local-report-file.ts` — roteamento de formatos e lazy boundary;
- `src/ingestion/pdf.ts` — extração PDF textual local fail-closed;
- `src/ingestion/image-metadata.ts` — assinatura/dimensões PNG/JPEG;
- `src/ingestion/local-image-ocr.ts` — OCR local fail-closed, lazy e cancelável;
- `src/product/constraints.ts` — limites/extensões/MIME compartilhados do produto;
- `scripts/prepare-ocr-assets.mjs` — preparação determinística dos assets OCR locais;
- `scripts/validate-ocr-ingestion-contract.mjs` — gate estrutural OCR;
- `THIRD_PARTY_NOTICES.md` — provenance/licenças, incluindo PDF.js e OCR.
