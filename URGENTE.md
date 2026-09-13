# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.  
> Registra o estado atual, invariantes, gates e próximo trabalho. Não é diário de commits. Não reabra tarefas concluídas sem evidência de regressão.

Última consolidação: **2026-09-12**  
Branch canônica: **`main`**  
Repositório: **`washingtonmsdj/medatlas`**

## 0. Missão — não reinterpretar

MedAtlas é um **SaaS clínico visual B2B/B2B2C** para transformar laudos/relatórios em uma explicação anatômica 3D compreensível, revisada por um profissional e compartilhável com o paciente.

Fluxo canônico:

```text
laudo / relatório
      ↓
ingestão local segura
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

MedAtlas **não** é diagnosticador automático, PACS, prontuário completo, segmentador DICOM nem reconstrução 3D específica do paciente.

## 1. Estado atual — MVP browser sintético qualificado

### Release funcional canônico

```text
2f797c81ff24aabba51fb7aa06b76f0fcd6011fc
```

Esse commit integrou o PR #8 e qualificou também uma jornada sintética única de ponta a ponta, além dos contratos já existentes.

### Evidência pós-merge no próprio `main`

- **CI `34728485763`: PASS completo**
  - dependency audit;
  - DB/organization/publication/repository/share/patient-share;
  - anatomia/cenários;
  - assets/performance;
  - security/privacy;
  - OCR;
  - `validate:organization-runtime`;
  - `validate:browser-e2e-matrix`;
  - AI/review/workflow;
  - licenças/provenance;
  - reference atlas;
  - MVP UI;
  - TypeScript;
  - production build;
  - bundle budget.
- **Browser E2E `34728485665`: PASS 4/4**
  - `clinical-flow`;
  - `document-ingestion`;
  - `responsive-layout`;
  - `supporting-contracts`.
- **GitHub Pages `34728485730`: PASS completo**
  - build PASS;
  - deploy PASS;
  - shell/assets publicados PASS;
  - fluxo 3D/OCR no site publicado em Chromium PASS.

### Piloto sintético integrado automatizado

`tests/e2e/synthetic-pilot.spec.ts` pertence ao shard `clinical-flow` e prova em uma única jornada:

```text
TXT local sintético
  → texto editável
  → encontrar anatomia
  → sugestão
  → confirmação explícita
  → Human Atlas 3D
  → rascunho educacional
  → prévia paciente
  → aprovação humana
  → share
  → portal paciente revisado
  → alteração da fonte
  → reconfirmação obrigatória
  → link anterior inválido
```

Isso fecha a lacuna antiga em que ingestão e publicação eram fortes isoladamente, mas não existia uma única prova browser ligando as duas pontas.

### Identidade demo sem duplicação

`src/demo/identity.ts` é a SSOT para identidade sintética compartilhada por organização e relatório:

- organização demo;
- nome/slug da organização;
- unidade principal;
- workspace padrão;
- profissional atual;
- paciente demo.

`src/organization/demo-organization.ts` e `src/domain/demo.ts` consomem essa SSOT. `validate:organization-runtime` falha se o seed do relatório voltar a duplicar os literais protegidos ou deixar de usar a identidade canônica.

### QA visual

A suíte `responsive-layout` e os artifacts de QA protegem desktop/mobile e superfícies 3D. No último pente-fino visual não apareceu bloqueador P0 de overflow, sobreposição ou perda crítica de contexto.

### Decisão

**MedAtlas está pronto como MVP browser sintético para piloto qualitativo.**

O próximo passo não é continuar adicionando arquitetura sem evidência. É observar pessoas usando o produto com dados fictícios e corrigir somente atritos P0/P1 reproduzíveis.

Isso **não** significa produção clínica com dados reais. O modo atual continua `synthetic-only`.

## 2. Escopo funcional concluído

- [x] shell profissional separado da experiência do paciente;
- [x] dashboard task-first e busca global;
- [x] Clinical Report Studio `laudo → anatomia → explicação`;
- [x] Human Atlas / BodyParts3D real e vendorizado;
- [x] Atlas completo, foco clínico e modo paciente usando a mesma autoridade FMA;
- [x] órgão detalhado como profundidade suplementar, sem segunda fonte de verdade;
- [x] triagem determinística + confirmação anatômica explícita;
- [x] rascunho educacional + edição + revisão humana obrigatória;
- [x] preview paciente antes da publicação;
- [x] share demo opaco, versionado, temporário e revogável;
- [x] portal paciente com a mesma anatomia revisada;
- [x] invalidação de share obsoleto após mudança da fonte;
- [x] Analytics demo local;
- [x] Equipe/permissões sem mutações fake;
- [x] responsividade desktop/mobile;
- [x] axe/WCAG nos contratos Browser;
- [x] TXT/MD local;
- [x] PDF textual local;
- [x] PDF escaneado/image-only com OCR local por página;
- [x] PNG/JPEG com OCR local em português;
- [x] progresso/cancelamento e preservação do último texto válido;
- [x] parser PDF e OCR pinados, lazy e same-origin;
- [x] provenance/SHA-256 para assets anatômicos, órgãos detalhados e OCR;
- [x] budgets separados para core/PDF/OCR;
- [x] Browser E2E com matriz protegida contra specs órfãos/duplicados;
- [x] piloto sintético integrado automatizado;
- [x] identidade demo compartilhada centralizada;
- [x] GitHub Pages verificando o build realmente publicado.

## 3. Fronteiras de ingestão

### TXT/MD

- até **64 KiB UTF-8**;
- decoding fatal UTF-8;
- extensão/MIME e limites em `src/product/constraints.ts`.

### PDF textual

- `pdfjs-dist` **6.3.289** pinado;
- até **8 MiB**;
- até **50 páginas**;
- até **64 KiB** de texto extraído;
- extensão, MIME, assinatura `%PDF-`, senha e malformação fail-closed;
- parser/worker local e lazy.

### PDF escaneado / image-only

Fallback somente quando um PDF válido não possui camada textual utilizável:

- máximo **8 páginas submetidas ao OCR**;
- escala máxima de render **2**;
- máximo **2400 px por lado renderizado**;
- máximo **2,5 MP por página**;
- máximo **16 MP totais** de rasterização;
- máximo **12 MP** de imagem embutida;
- rasterização local via PDF.js;
- mesma fronteira Tesseract usada por PNG/JPEG;
- progresso e cancelamento;
- documento acima do cap falha antes de Tesseract;
- OCR sem texto suficiente falha fechado;
- nenhuma análise anatômica automática.

### PNG/JPEG

- Tesseract.js/core **7.0.0**;
- modelo português **1.0.0**;
- até **6 MiB**;
- até **4096 px por lado**;
- até **4,5 MP**;
- até **64 KiB** de texto OCR;
- assinatura binária, MIME, extensão, bytes e dimensões antes de Tesseract;
- `workerBlobURL: false`;
- worker/core/modelo same-origin;
- sem fallback silencioso para CDN.

## 4. Invariantes — não quebrar

1. Existe **um único Human Atlas canônico** para autoridade BodyParts3D/FMA.
2. Explorer, Studio clínico e Patient são modos do mesmo sistema anatômico.
3. Órgão detalhado é suplementar e nunca muda a fonte de verdade clínica.
4. Anatomia representa referência humana, nunca reconstrução individual do paciente.
5. Explorar/clicar não equivale a confirmar anatomia.
6. Nenhuma anatomia sem FMA/renderabilidade válida vira confirmação clínica.
7. IA não publica e não substitui revisão humana.
8. Alterar laudo/anatomia/explicação invalida revisões e shares dependentes.
9. `ClinicalRepository` permanece autoridade de dados; não criar persistência paralela.
10. Demo permanece `synthetic-only` e sem telemetria clínica externa.
11. Tokens não podem virar IDs previsíveis.
12. Storage clínico de produção nunca pode ser público.
13. Não reutilizar Supabase de outro produto.
14. Não reintroduzir `OrganizationSwitcher`, `ViewModeSwitcher`, launchers duplicados ou Consultas/Exames como módulos paralelos no MVP.
15. IDs FMA não pertencem à superfície primária do paciente.
16. Não ressuscitar CSS morto/tema paralelo para vencer cascade.
17. Preview sem aprovação comunica pendência, nunca revisão concluída.
18. Portal publicado é autocontido; retorno ao profissional existe apenas na prévia interna.
19. Mobile deve manter acesso aos módulos secundários pelo caminho real de navegação.
20. Não remover `IntersectionObserver`/pausa offscreen para satisfazer screenshot.
21. Ausência de modelo 3D suplementar não invalida FMA confirmada.
22. Parser/OCR pertence a `src/ingestion/`, nunca a componentes React.
23. `ReportIntake` não lê bytes diretamente.
24. Limites/extensões/MIME pertencem a `src/product/constraints.ts`; não duplicar hardcode de runtime.
25. Falha/cancelamento de ingestão preserva o último texto válido.
26. Texto extraído é entrada editável, nunca diagnóstico, confirmação, revisão ou publicação.
27. PDF.js/worker permanecem locais e lazy.
28. PDF textual permanece fail-closed por extensão/MIME/bytes/assinatura/páginas/texto/senha/malformação.
29. PDF escaneado entra somente pelo fallback `src/ingestion/scanned-pdf-ocr.ts`.
30. OCR de PDF respeita páginas/escala/dimensões/pixels antes de OCR.
31. OCR permanece pinado, lazy e same-origin.
32. PNG/JPEG validam assinatura/dimensões antes de Tesseract.
33. `workerBlobURL: false` é contrato de distribuição/segurança.
34. OCR nunca executa etapas clínicas automaticamente.
35. Assets OCR mantêm SHA-256 e budget separado.
36. Proveniência/licenças devem permanecer verificadas.
37. Testes OCR podem validar texto probabilístico semanticamente; paths, hashes, limites e transições são exatos.
38. Supabase/auth/IA remota somente entram por gate explícito de produção.
39. Todo `tests/e2e/*.spec.ts` deve pertencer a **exatamente um** shard de `.github/workflows/browser-e2e.yml`; `validate:browser-e2e-matrix` falha diante de spec órfão, duplicado ou referência inexistente.
40. Identidade demo compartilhada pertence a `src/demo/identity.ts`; não duplicar organização/workspace/profissional/paciente entre seeds.
41. `synthetic-pilot.spec.ts` permanece no `clinical-flow` e deve continuar protegendo o caminho arquivo local → paciente → invalidação do share antigo.

## 5. Gates permanentes do MVP sintético

### Gate A — CI

Obrigatório:

- audit de dependências;
- contratos DB/organization/publication/repository/share;
- `validate:organization-runtime`;
- anatomy/demo scenarios;
- assets/performance;
- security/privacy;
- OCR;
- `validate:browser-e2e-matrix`;
- AI/review/workflow;
- licenses/provenance;
- reference atlas;
- MVP UI;
- TypeScript;
- build;
- bundle budget.

### Gate B — Browser E2E 4/4

- `clinical-flow` — inclui `synthetic-pilot.spec.ts`;
- `document-ingestion` — inclui `report-intake.spec.ts` e `scanned-pdf-ocr.spec.ts`;
- `responsive-layout`;
- `supporting-contracts`.

Nenhum spec E2E pode ficar órfão ou aparecer em mais de um shard.

### Gate C — Pages

O deploy publicado deve provar:

- shell/chunks sob `/medatlas/`;
- Human Atlas e modelos detalhados locais;
- manifesto + SHA-256 dos assets OCR;
- PDF textual com worker local;
- PNG OCR same-origin;
- PDF escaneado/image-only com rasterização + OCR same-origin;
- nenhuma análise anatômica automática após importação;
- fluxo 3D profissional/paciente e Atlas mobile.

## 6. Próximo trabalho

### P1 — piloto qualitativo sintético

O desenvolvimento-base do MVP está encerrado e o piloto funcional está automatizado. Agora usar `docs/PILOT.md` com dados totalmente fictícios para observar pessoas reais usando o produto.

Foco:

- clareza do início de relatório;
- percepção de importação local vs upload;
- compreensão de OCR/revisão humana;
- diferença entre sugestão, exploração e confirmação anatômica;
- utilidade do Human Atlas e órgão detalhado;
- clareza da explicação e da revisão;
- transição profissional → paciente;
- entendimento de anatomia de referência;
- reconfirmação após editar a fonte;
- conforto desktop/mobile;
- copy, hierarquia e passos desnecessários.

**Regra:** corrigir apenas atritos P0/P1 reproduzíveis. Não iniciar novo redesign abstrato ou reconstrução arquitetural sem evidência do piloto.

### P2 — produção clínica

**Bloqueada até autorização explícita.** Antes de qualquer PHI/dado real:

1. Supabase dedicado ao MedAtlas;
2. migrations canônicas;
3. autenticação;
4. provas cross-tenant/RLS por papel;
5. Storage privado e testes de negação;
6. `SupabaseClinicalRepository` implementando a autoridade existente, sem persistência paralela;
7. share de produção com expiração/revogação/auditoria;
8. retenção/backup;
9. secrets/environment separation;
10. observabilidade, suporte e resposta a incidentes;
11. revisão jurídica/privacidade;
12. piloto clínico controlado.

### P3 — IA remota

Somente atrás da fronteira backend, com resposta estruturada, validação FMA/renderabilidade, confirmação anatômica e revisão humana. Nunca expor segredo em `VITE_*`.

## 7. Arquivos de continuidade

- `README.md` — visão pública e arquitetura;
- `URGENTE.md` — estado operacional canônico;
- `docs/RELEASE_READINESS.md` — gates e bloqueadores;
- `docs/PILOT.md` — roteiro do piloto qualitativo sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica/3D;
- `src/demo/identity.ts` — SSOT da identidade demo compartilhada;
- `src/product/constraints.ts` — SSOT de limites/extensões/MIME;
- `src/ingestion/contracts.ts` — contrato tipado de ingestão;
- `src/ingestion/local-report-file.ts` — roteamento;
- `src/ingestion/local-text.ts` — TXT/MD;
- `src/ingestion/pdf.ts` — PDF textual + fallback OCR;
- `src/ingestion/scanned-pdf-ocr.ts` — PDF image-only bounded;
- `src/ingestion/image-metadata.ts` — assinatura/dimensões de imagem;
- `src/ingestion/local-image-ocr.ts` — OCR compartilhado;
- `scripts/validate-organization-runtime.mjs` — fronteira de organização + identidade demo;
- `scripts/validate-browser-e2e-matrix.mjs` — cobertura exata da matriz Browser;
- `.github/workflows/browser-e2e.yml` — matriz 4/4;
- `tests/e2e/synthetic-pilot.spec.ts` — piloto integrado arquivo local → paciente;
- `tests/e2e/scanned-pdf-ocr.spec.ts` — OCR de PDF escaneado;
- `tests/deployed/preview.spec.ts` — prova do build publicado;
- `THIRD_PARTY_NOTICES.md` — provenance/licenças.
