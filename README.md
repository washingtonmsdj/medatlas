# MedAtlas

**SaaS de comunicação clínica visual 3D para clínicas, profissionais de saúde e pacientes.**

O MedAtlas transforma um trecho de laudo ou explicação clínica em uma experiência visual revisada pelo profissional:

```text
laudo / relatório
      ↓
triagem anatômica
      ↓
conceitos reais FMA / BodyParts3D
      ↓
confirmação explícita do profissional
      ↓
anatomia 3D interativa
      ↓
explicação em linguagem simples
      ↓
revisão clínica
      ↓
link do paciente
```

O produto não foi desenhado para emitir diagnóstico automático. A automação ajuda a localizar anatomia, preparar conteúdo e reduzir atrito; a autoridade de publicação continua sendo humana.

## 3D-first

O Human Atlas não é uma página isolada do MedAtlas: ele é a camada visual que acompanha o workflow anatômico.

Hoje a geometria real BodyParts3D aparece em:

- **Visão geral** — atendimento atual;
- **Pacientes** — contexto visual do relatório;
- **Relatórios visuais** — laudo/exame, contexto da consulta e Clinical 3D Workbench;
- **Atlas 3D** — explorer completo;
  - mantém camadas, picking, explode, marcadores, hover, vistas e enquadramento respeitando os painéis;
  - estruturas compatíveis podem aprofundar para **Órgão em detalhe** sem perder o FMA/BodyParts3D selecionado;
- **preview pré-publicação** — o profissional vê o mesmo Human Atlas antes de compartilhar;
- **link do paciente** — experiência simplificada com o mesmo engine.

`Equipe`, `Analytics` e `Configurações` não recebem canvas 3D por decoração: nessas telas não existe uma tarefa anatômica.

Consultas e exames não são módulos independentes no MVP; esse contexto pertence ao fluxo de **Relatórios visuais**.

O preview público do MVP está em:

`https://washingtonmsdj.github.io/medatlas/`

O workflow de Pages valida a publicação, os assets anatômicos, o fluxo 3D, a ingestão PDF publicada e o OCR local publicado com integridade dos assets.

## Estado atual

O MVP já possui:

- fluxo clínico em português;
- edição/colagem de texto de laudo;
- importação local sintética `.txt`/`.md` com até **64 KiB por bytes UTF-8**, sem upload;
- importação local de **PDF textual** com até **8 MiB**, **50 páginas** e **64 KiB de texto extraído**, sem upload;
- importação local de **PNG/JPEG com OCR em português**, até **6 MiB**, **4096 px por lado**, **4,5 MP** e **64 KiB de texto extraído**, sem upload;
- PDF.js `6.3.289` pinado, carregado de forma lazy, com worker local;
- Tesseract.js `7.0.0` + modelo português pinados, locais e lazy, com worker direto same-origin (`workerBlobURL: false`);
- validação PDF de extensão, MIME, assinatura `%PDF-`, tamanho, páginas, senha, malformação e presença de texto;
- validação de imagem por extensão, MIME, assinatura binária, tamanho e dimensões/pixels antes de carregar OCR;
- PDF escaneado sem camada textual continua rejeitado explicitamente; OCR de PDF é uma etapa separada;
- texto extraído sempre editável antes da análise anatômica;
- falha/cancelamento de ingestão preservando o último texto válido;
- Relatórios visuais concentrando ingestão local de laudo/exame e contexto da consulta;
- módulo Pacientes funcional no modo sintético, derivado do relatório atual e sem persistência paralela;
- triagem determinística de referências anatômicas;
- sugestões limitadas a conceitos realmente existentes no atlas;
- busca manual por conceitos FMA;
- Human Atlas / BodyParts3D real em Three.js;
- explorador Atlas 3D completo: 2.234 peças, sistemas, picking por estrutura, vistas, rotação, isolamento e explode;
- Dashboard, Pacientes, Relatórios e paciente reutilizando o mesmo Human Atlas canônico em modo focado;
- navegação `Corpo → Órgão em detalhe`, com detalhe suplementar para estruturas compatíveis;
- 9 GLBs detalhados locais, verificados por SHA-256 e carregados sob demanda;
- suporte a conceitos compostos e várias meshes;
- modos **Isolado**, **Sistema** e **Região**;
- cache de chunks anatômicos;
- assets Human Atlas e modelos detalhados vendorizados no próprio MedAtlas, com payload inicial controlado por lazy loading;
- provenance + SHA-256 verificados no CI para Human Atlas, modelos detalhados e assets OCR;
- atribuição BodyParts3D CC BY 4.0 + Human Atlas MIT nas superfícies exigidas;
- Browser E2E com Chromium cobrindo desktop, mobile, ingestão e handoff ao paciente;
- gate axe/WCAG para violações serious/critical;
- piloto sintético guiado;
- modo demo synthetic-only com shares locais expirando em 30 minutos;
- CSP e headers de segurança no deploy Vercel;
- explicação editável para o paciente;
- re-review obrigatório quando anatomia/texto muda;
- página separada do paciente usando o mesmo conceito 3D aprovado;
- tokens demo criptograficamente aleatórios;
- abstração assíncrona `ClinicalRepository`;
- máquina de estado fail-closed para o ciclo completo do relatório;
- contrato Supabase multi-tenant com RLS fail-closed em source;
- bucket clínico privado e modelo de auditoria projetados;
- tokens de compartilhamento de produção definidos por hash, expiração e revogação;
- CI com `npm ci`, auditoria, contratos, typecheck, build e budgets.

Todos os pacientes, profissionais, clínicas e laudos exibidos atualmente são **dados sintéticos de demonstração**.

## Ingestão documental local

A ingestão não pertence ao componente React. `ReportIntake` apresenta a UI, mas leitura/decoding/parsing/OCR ficam em `src/ingestion/`.

Fluxo atual:

```text
arquivo local
   ↓
validação de formato/limites
   ↓
extração de texto / OCR local
   ↓
texto editável no relatório
   ↓
Encontrar anatomia (ação separada)
```

Arquivos suportados:

| Formato | Limites principais | Observação |
| --- | --- | --- |
| TXT/MD | 64 KiB UTF-8 | decoding fatal UTF-8 |
| PDF textual | 8 MiB · 50 páginas · 64 KiB extraídos | PDF.js local/lazy |
| PNG/JPEG | 6 MiB · 4096 px/lado · 4,5 MP · 64 KiB extraídos | Tesseract.js local/lazy em português |

PDF rejeita fail-closed MIME/extensão incompatível, assinatura inválida, arquivo grande demais, excesso de páginas/texto, senha, malformação e ausência de texto extraível.

PNG/JPEG rejeitam fail-closed MIME/extensão incompatível, assinatura binária inválida, arquivo >6 MiB e dimensões/pixels acima dos limites antes de carregar o runtime OCR. Worker, core e `por.traineddata.gz` são servidos pelo próprio MedAtlas; não existe fallback silencioso para CDN. O OCR pode ser cancelado e falha/cancelamento preserva o último texto válido.

**PDF escaneado ainda não recebe OCR.** PDF sem camada textual continua bloqueado explicitamente até existir um pipeline local por página com limites próprios.

Importar arquivo nunca equivale a interpretar clinicamente: não executa automaticamente `Encontrar anatomia`, não confirma FMA, não aprova explicação e não publica.

## Rodar localmente

Requer Node.js 22.13+.

```bash
npm ci
npm run dev
```

Abra:

```text
http://localhost:3016
```

Validação completa:

```bash
npm run validate:db-contract
npm run validate:organization-runtime
npm run validate:publication-identity
npm run validate:repository-boundary
npm run validate:share-revocation
npm run validate:patient-share
npm run validate:anatomy-contract
npm run validate:demo-scenarios
npm run validate:vendored-assets
npm run validate:performance-budget
npm run validate:security-contract
npm run validate:ocr-contract
npm run validate:ai-contract
npm run validate:review-gate
npm run validate:report-workflow
npm run validate:license-attribution
npm run validate:reference-atlas
npm run validate:mvp-ui
npm run check
npm run build
npm run validate:bundle-budget
npm audit --omit=dev --audit-level=high
```

## Anatomia 3D

O MedAtlas fixa sua integração inicial ao Human Atlas no commit:

```text
1c38bf35c254a891200d3cedecfd57abebe83d8d
```

O renderer não usa iframe. O catálogo e as geometrias BodyParts3D são resolvidos semanticamente e renderizados dentro da aplicação.

Os arquivos necessários ao runtime estão em `public/atlas-assets/`. O runtime resolve esse diretório relativamente ao `BASE_URL` do Vite, permitindo deploy tanto na raiz quanto em subpaths como `/medatlas/`. Eles possuem `SHA256SUMS` + `PROVENANCE.json`. O navegador não precisa buscar geometrias no repositório upstream durante o uso normal.

Nos cenários sintéticos, o renderer carrega somente os chunks necessários ao conceito selecionado, preservando o budget inicial apesar da closure anatômica local ser maior.

Exemplo:

```text
“L4-L5”
   ↓
FMA16036
   ↓
Intervertebral disk of fourth lumbar vertebra
   ↓
BodyParts3D element FJ3216
   ↓
Three.js
```

A anatomia é **referência educacional**, não reconstrução do corpo individual do paciente.

### Profundidade de órgão

Quando a estrutura selecionada possui modelo detalhado compatível:

```text
Corpo completo / Human Atlas
        ↓
estrutura FMA confirmada
        ↓
Órgão em detalhe
        ↓
voltar ao corpo preservando a seleção
```

O detalhe é complementar. Ele não confirma FMA, não altera o relatório e não substitui BodyParts3D como fonte de verdade clínica. Os arquivos ficam em `public/organ-models/` e são carregados sob demanda.

## Triagem do laudo

O primeiro resolvedor de texto é deliberadamente determinístico.

Ele:

1. normaliza o texto;
2. procura aliases anatômicos conhecidos em português;
3. cruza com IDs existentes no atlas fixado;
4. também pode detectar nomes originais do catálogo;
5. retorna sugestões;
6. exige confirmação explícita antes de alterar o relatório.

A próxima camada de IA possui contrato técnico estrito em `src/clinical/structured-extraction.schema.json` e `src/clinical/structured-extraction.ts`. Um modelo poderá sugerir candidatos, mas a resposta só é aceita se passar pelo schema/runtime validator, exigir revisão clínica e cada FMA existir como conceito renderizável no atlas fixado.

O provedor remoto permanece desativado enquanto o MVP não possui backend. Chaves de modelo não devem entrar no bundle Vite. Veja `docs/AI.md`.

## Dados e Supabase

O projeto ainda opera em modo demo no navegador.

O contrato de produção está em:

- `supabase/migrations/202609070001_medatlas_core.sql`
- `docs/SECURITY.md`
- `docs/ARCHITECTURE.md`
- `docs/RELEASE_READINESS.md`

Ele define organizações/tenants, membros/papéis, profissionais, pacientes, consultas, relatórios visuais, documentos clínicos, compartilhamentos, auditoria, RLS, Storage privado e token de paciente armazenado somente como SHA-256.

O backend Supabase **não é ativado silenciosamente** só porque variáveis de ambiente existem. A troca do adaptador demo pelo adaptador Supabase ocorrerá somente depois de migration + testes de isolamento.

Enquanto isso, o modo atual é explicitamente **synthetic-only**. Não deve receber dados reais de pacientes.

## Segurança

Alguns invariantes permanentes:

- nenhuma publicação com revisão pendente;
- nenhum token previsível;
- nenhum ID de paciente em URL de compartilhamento;
- nenhum grant amplo para `anon`;
- nenhuma tabela clínica sem RLS;
- nenhum documento clínico em bucket público;
- nenhuma IA pode publicar diretamente;
- dados demo não devem compartilhar projeto/storage com dados clínicos reais;
- `ReportIntake` não lê bytes diretamente;
- parser PDF/worker não dependem de fetch remoto;
- OCR valida bytes/dimensões antes de carregar Tesseract;
- worker/core/modelo OCR são pinados, lazy e same-origin; worker direto não usa `blob:`;
- falha de ingestão não apaga o último texto válido;
- texto importado não vira confirmação clínica automática.

Veja `docs/SECURITY.md`, `docs/PILOT.md` e `URGENTE.md`.

## Deploy

### Vercel

`vercel.json` usa `npm ci`. O workflow manual `.github/workflows/preview-artifact.yml` gera pacote estático de preview sem duplicar binários anatômicos.

### GitHub Pages

Preview público:

```text
https://washingtonmsdj.github.io/medatlas/
```

`.github/workflows/pages.yml` publica a aplicação e executa Playwright contra o deploy real. O gate importa PDF textual e PNG sintéticos, verifica o worker PDF sob `/medatlas/assets/`, executa OCR real sob `/medatlas/ocr-assets/` e valida manifesto, tamanho e SHA-256 dos 8 assets OCR publicados.

## Bundles PDF/OCR

PDF.js e Tesseract não degradam o caminho inicial: ambos são carregados apenas quando o formato correspondente é selecionado.

Build observado no checkpoint OCR:

- entry principal ~350,8 KB;
- core JavaScript sem PDF ~961,1 KB;
- parser PDF lazy ~431,9 KB;
- worker PDF local ~1.265,4 KB;
- conjunto distribuído de assets OCR: **21.780.497 bytes**;
- pior conjunto necessário por uma execução OCR: ~**8,27 MB**, porque somente um fallback de core é escolhido.

`scripts/validate-bundle-budget.mjs` mantém budgets separados para core, PDF e OCR. Não aumentar o budget do core para absorver capacidades opcionais.

## Licenças e provenance

- Human Atlas: MIT.
- BodyParts3D 4.0: CC BY 4.0.
- PDF.js `6.3.289`: Apache License 2.0; licença do pacote é validada e distribuída em `dist/licenses/pdfjs-LICENSE.txt`.
- Tesseract.js `7.0.0` e `tesseract.js-core` `7.0.0`: Apache License 2.0.
- `@tesseract.js-data/por` `1.0.0`: MIT.
- `thebuggeddev/anatomy`: integração e modelos detalhados sob permissão específica registrada em `docs/UPSTREAM_ANATOMY.md`; não é tratada como licença open-source geral.

Veja:

- `THIRD_PARTY_NOTICES.md`
- `third_party/human-atlas/LICENSE`
- `third_party/human-atlas/PROVENANCE.md`

## Roadmap

O plano executável e continuamente atualizado está em `URGENTE.md`.

Próximas frentes:

1. continuar o piloto sintético/manual, agora incluindo TXT/MD/PDF textual e PNG/JPEG com OCR local;
2. próximo gate P1: **PDF escaneado/image-only → rasterização local limitada → OCR por página**, sem CDN ou upload;
3. preparar critérios do piloto clínico controlado;
4. somente depois, projeto Supabase exclusivo do MedAtlas;
5. provas de isolamento multi-tenant + autenticação;
6. adapter Supabase do `ClinicalRepository`;
7. ativar provedor de IA somente atrás do backend e dos gates já definidos.
