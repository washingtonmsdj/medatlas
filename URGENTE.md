# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.
> Este arquivo registra estado, decisões, bloqueios e próximo trabalho. Não é diário de commits.

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

O wedge é **comunicação clínica visual entre profissional e paciente**. MedAtlas não é diagnosticador automático, PACS, prontuário completo, segmentador DICOM nem reconstrução 3D específica do paciente.

## 1. Estado atual do MVP

### MVP browser sintético — escopo funcional concluído

- [x] shell profissional separado da experiência do paciente;
- [x] dashboard clínico task-first e busca global;
- [x] Clinical Report Studio: laudo → anatomia 3D → explicação;
- [x] Human Atlas/BodyParts3D real e vendorizado como engine anatômico canônico;
- [x] Atlas completo, modo clínico focado e modo paciente usando a mesma autoridade FMA;
- [x] órgão detalhado apenas como profundidade suplementar;
- [x] triagem determinística + confirmação humana obrigatória;
- [x] rascunho educacional + edição + aprovação clínica obrigatória;
- [x] preview do paciente antes da publicação;
- [x] preview pendente não se apresenta como revisão concluída;
- [x] portal publicado e links inválidos/revogados autocontidos;
- [x] share demo opaco, versionado, temporário e revogável;
- [x] Analytics local demo;
- [x] Equipe/permissões sem mutações fake;
- [x] Configurações demo explicitamente não persistentes;
- [x] `Novo relatório` canônico no Dashboard/busca, sem launcher duplicado;
- [x] navegação desktop/mobile e módulos secundários via `Mais`;
- [x] responsividade e axe/WCAG protegidos por Browser E2E;
- [x] ingestão local de texto digitado/colado, TXT e MD;
- [x] ingestão local de PDF textual;
- [x] ingestão local de **PDF escaneado/image-only com OCR por página**;
- [x] ingestão local de PNG/JPEG com OCR em português;
- [x] progresso/cancelamento de OCR e preservação do último texto válido;
- [x] arquivo importado produz apenas texto editável, sem análise/confirmacão/publicação automática;
- [x] parser PDF e runtime OCR locais, pinados, lazy e same-origin;
- [x] assets anatômicos/OCR com provenance/integridade e budgets próprios;
- [x] CI, Browser E2E e deploy possuem gates específicos para o fluxo sintético.

### Fronteiras de ingestão atuais

#### TXT/MD

- limite: **64 KiB UTF-8**;
- decoding fatal UTF-8;
- extensão/MIME centralizados em `src/product/constraints.ts`.

#### PDF textual

- `pdfjs-dist` **6.3.289** pinado;
- até **8 MiB**;
- até **50 páginas**;
- até **64 KiB** de texto extraído;
- extensão/MIME/assinatura `%PDF-`, senha e malformação fail-closed;
- parser/worker local e lazy.

#### PDF escaneado / image-only

Fallback somente quando o PDF válido não possui camada textual utilizável:

- máximo **8 páginas de OCR**;
- escala máxima de render **2**;
- dimensão máxima renderizada **2400 px**;
- **2,5 MP por página**;
- **16 MP totais** de rasterização;
- **12 MP** de imagem embutida;
- rasterização local via fronteira PDF mantida;
- reutilização do mesmo Tesseract local de PNG/JPEG;
- progresso documento/página e cancelamento;
- documento acima do cap falha antes de carregar Tesseract;
- OCR sem texto suficiente falha fechado;
- resultado agregado continua sujeito ao limite de texto do produto.

#### PNG/JPEG

- Tesseract.js/core **7.0.0** e modelo português **1.0.0** pinados;
- até **6 MiB**;
- até **4096 px por lado**;
- até **4,5 MP**;
- até **64 KiB** de texto OCR;
- assinatura binária/dimensões/pixels antes de carregar Tesseract;
- `workerBlobURL: false`;
- worker/core/modelo same-origin;
- sem CDN/default remoto silencioso.

### Fora do MVP browser sintético

- [ ] autenticação real;
- [ ] Supabase de produção ativo;
- [ ] armazenamento clínico real;
- [ ] dados reais de pacientes / PHI;
- [ ] IA remota em produção;
- [ ] billing;
- [ ] convites/mutações reais de equipe;
- [ ] piloto clínico com dados reais.

Esses itens **não podem ser simulados por botão fake, hardcode, persistência paralela ou dependência remota silenciosa**.

## 2. Invariantes — não quebrar

1. Existe **um único Human Atlas canônico** para autoridade BodyParts3D/FMA.
2. Explorer, Studio clínico e Patient são modos do mesmo sistema anatômico.
3. Viewer de órgão detalhado é suplementar e nunca muda a fonte de verdade clínica.
4. BodyParts3D/FMA representa anatomia humana de referência, nunca corpo individual do paciente.
5. Explorar/clicar não equivale a confirmar anatomia.
6. Nenhuma anatomia sem conceito FMA/renderizável vira confirmação clínica.
7. IA não publica e não substitui revisão humana.
8. Mudança de laudo/anatomia/explicação invalida revisões e shares dependentes conforme workflow.
9. `ClinicalRepository` permanece autoridade de dados; não criar persistência paralela.
10. Demo permanece `synthetic-only` e sem telemetria clínica externa.
11. Token de share/convite não pode virar identificador previsível.
12. Storage clínico de produção nunca pode ser público.
13. Não reutilizar Supabase de outro produto.
14. Não reintroduzir `OrganizationSwitcher`, `ViewModeSwitcher`, launcher duplicado de Novo relatório ou Consultas/Exames como módulos separados no MVP.
15. IDs FMA e detalhes de implementação não pertencem à superfície primária do paciente.
16. Não ressuscitar CSS morto/tema paralelo para vencer cascade.
17. Prévia sem aprovação clínica comunica **pendência**, nunca sucesso ou autoria inexistente.
18. Portal do paciente publicado é autocontido; retorno explícito ao profissional existe apenas na prévia interna.
19. Em mobile, módulos secundários permanecem acessíveis pelo caminho real de navegação.
20. Não remover `IntersectionObserver`/pausa offscreen para “consertar” screenshots.
21. Ausência de modelo 3D suplementar não invalida a anatomia FMA confirmada.
22. Parser/OCR pertence a `src/ingestion/`, nunca a componentes React.
23. `ReportIntake` não lê bytes de arquivo diretamente.
24. Limites/extensões/MIME pertencem a `src/product/constraints.ts`; não duplicar hardcodes de runtime.
25. Falha/cancelamento de ingestão nunca substitui o último texto válido.
26. Texto extraído é **entrada editável**, nunca diagnóstico, confirmação anatômica, revisão ou publicação.
27. PDF.js/worker permanecem locais e lazy; sem CDN/fetch remoto.
28. PDF textual deve falhar fechado por extensão/MIME, bytes, assinatura, páginas, texto, senha e malformação.
29. PDF escaneado só pode entrar pelo fallback limitado de `src/ingestion/scanned-pdf-ocr.ts`.
30. PDF escaneado deve respeitar limites de páginas/escala/dimensões/pixels antes de OCR e reutilizar a fronteira Tesseract existente.
31. OCR permanece local, lazy, pinado e same-origin; worker/core/modelo não dependem de CDN/default remoto.
32. PNG/JPEG validam extensão, MIME, assinatura binária, bytes, dimensões e pixels antes de Tesseract.
33. `workerBlobURL: false` é contrato de segurança/distribuição.
34. OCR nunca executa anatomia, confirmação FMA, revisão ou publicação automaticamente.
35. Assets OCR possuem manifesto SHA-256 e budget separado; não afrouxar budgets do core para absorvê-los.
36. Proveniência/licenças de PDF.js, Tesseract, BodyParts3D/Human Atlas e modelos detalhados permanecem verificadas.
37. Testes OCR podem validar texto probabilístico semanticamente; paths, hashes, limites, same-origin e transições clínicas são contratos exatos.
38. Supabase/auth/IA remota somente entram por gate explícito de produção; nunca por presença casual de variável de ambiente.

## 3. Arquitetura consolidada

### 3.1 Ingestão documental

```text
arquivo local
   ↓
src/ingestion/local-report-file.ts
   ↓
validação por formato
   ├─ TXT/MD → local-text.ts
   ├─ PDF → pdf.ts
   │          ├─ camada textual → texto editável
   │          └─ sem texto → scanned-pdf-ocr.ts
   │                         ↓
   │                    local-image-ocr.ts
   └─ PNG/JPEG → local-image-ocr.ts
   ↓
texto editável
   ↓
Encontrar anatomia (ação humana separada)
```

Não criar segunda stack de PDF, OCR ou estado clínico.

### 3.2 3D-first

- Human Atlas/BodyParts3D é a autoridade anatômica.
- Atlas completo, foco clínico e paciente usam o mesmo conceito FMA confirmado.
- Detalhes de órgão são suplementares e carregados sob demanda.
- O 3D só aparece onde existe tarefa anatômica; não decorar Analytics/Equipe/Configurações com canvas.

### 3.3 Workflow clínico

```text
fonte válida
  → sugestão anatômica
  → confirmação explícita
  → rascunho educacional
  → edição
  → aprovação humana
  → prévia
  → publicação/share
```

Alterar fonte/anatomia/explicação invalida as etapas dependentes. Nenhuma IA ou importação pode pular esses gates.

## 4. Gate de release do MVP sintético

Não usar run/hash antigo como prova de um source novo. **O mesmo commit candidato** deve passar:

### Gate A — CI completo

- dependency audit;
- DB/organization/publication/repository/share contracts;
- anatomy/demo scenarios;
- assets/performance;
- security/privacy;
- OCR;
- AI/review/workflow;
- licenses/provenance;
- reference atlas;
- MVP UI;
- TypeScript;
- production build;
- bundle budget.

### Gate B — Browser E2E 3/3

- `clinical-flow`;
- `responsive-layout`;
- `supporting-contracts`.

Deve cobrir TXT/MD/PDF/PNG/JPEG, OCR real, PDF image-only, limites fail-closed, 3D, paciente, acessibilidade e responsividade.

### Gate C — GitHub Pages do mesmo source

O deploy deve provar:

- shell/chunks sob `/medatlas/`;
- Human Atlas/modelos de órgão locais;
- manifesto + SHA-256 dos assets OCR;
- PDF textual com worker local;
- PNG OCR same-origin;
- **PDF escaneado/image-only com OCR same-origin no build publicado**;
- nenhum `blob:`/CDN para OCR;
- nenhuma análise anatômica automática após importação;
- fluxo 3D e Atlas mobile.

## 5. Próxima ordem de trabalho

### P0 — concluir release do MVP sintético

1. manter branch de release sincronizada com `main` sem sobrescrever trabalho concorrente;
2. executar CI completo;
3. executar Browser E2E 3/3;
4. integrar somente com gates verdes;
5. executar GitHub Pages no `main` integrado;
6. corrigir qualquer falha pela causa raiz;
7. somente então declarar o source final **MVP sintético pronto para piloto**.

### P1 — piloto manual sintético

Usar `docs/PILOT.md` e validar em desktop profissional + smartphone paciente:

- TXT/MD;
- PDF textual;
- PDF escaneado com OCR;
- PNG/JPEG com OCR;
- confirmação anatômica;
- Human Atlas + órgão detalhado;
- revisão;
- prévia;
- share e portal paciente;
- reconfirmação após editar fonte;
- Analytics/Equipe sem mutações fake.

Registrar apenas dados fictícios. Nenhum PHI.

### P2 — produção clínica

**Somente após autorização explícita.**

1. Supabase dedicado ao MedAtlas;
2. migrations canônicas;
3. autenticação;
4. provas cross-tenant/RLS;
5. Storage privado e testes de negação;
6. `SupabaseClinicalRepository` como implementação da autoridade existente;
7. share de produção com expiração/revogação/auditoria;
8. retenção, backup, incidentes e observabilidade;
9. revisão jurídica/privacidade;
10. piloto clínico controlado antes de PHI.

### P3 — IA remota

Somente depois da fronteira backend existir. Resposta deve ser estruturada, validada contra FMA/renderabilidade e continuar sujeita à confirmação anatômica e revisão humana. Nunca expor segredo de provedor em `VITE_*`.

## 6. Critério de conclusão desta fase

A fase está concluída quando o `main` contendo o OCR de PDF escaneado e os gates reconciliados tiver:

- CI verde;
- Browser E2E 3/3 verde;
- Pages verde com prova publicada de PDF textual + PDF escaneado + PNG OCR;
- documentação sem afirmar capacidade inexistente nem negar capacidade já implementada;
- nenhuma regressão na fronteira `synthetic-only`.

Nesse ponto o MedAtlas está **pronto como MVP sintético/piloto**, não como produção clínica com dados reais.

## 7. Arquivos de continuidade

- `README.md` — escopo e arquitetura pública;
- `URGENTE.md` — estado operacional e ordem de trabalho;
- `docs/RELEASE_READINESS.md` — gates e bloqueadores de release;
- `docs/PILOT.md` — roteiro do piloto sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica e 3D;
- `src/product/constraints.ts` — SSOT de limites/extensões/MIME;
- `src/ingestion/contracts.ts` — contrato tipado de ingestão;
- `src/ingestion/local-report-file.ts` — roteamento de formatos;
- `src/ingestion/local-text.ts` — TXT/MD;
- `src/ingestion/pdf.ts` — PDF textual + fallback OCR;
- `src/ingestion/scanned-pdf-ocr.ts` — rasterização/OCR limitado de PDF image-only;
- `src/ingestion/image-metadata.ts` — assinatura/dimensões PNG/JPEG;
- `src/ingestion/local-image-ocr.ts` — OCR local compartilhado;
- `scripts/prepare-ocr-assets.mjs` — assets OCR locais;
- `scripts/validate-ocr-ingestion-contract.mjs` — gate estrutural OCR;
- `tests/e2e/scanned-pdf-ocr.spec.ts` — OCR PDF local/bounded;
- `tests/deployed/preview.spec.ts` — prova do build publicado;
- `THIRD_PARTY_NOTICES.md` — provenance/licenças.
