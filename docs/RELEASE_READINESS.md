# MedAtlas — MVP release readiness

Checkpoint: **2026-09-12**  
Canonical branch: `main`  
Runtime/distribuição PDF: **`a95458a8ccb34f99eddbe656f6324088aa88b52a`**  
HEAD final de regressão: **`1b8ae472ba42a83aad59d0ab407c9f3c9ce7342f`**

## Verdict

### Browser MVP sintético

**QUALIFICADO PARA PILOTO MANUAL SINTÉTICO.**

O fluxo browser atual está publicado e passou pelos gates de CI, Browser E2E e verificação remota do GitHub Pages. Ele pode ser usado para avaliar UX, navegação, compreensão do 3D, ingestão local de TXT/MD/PDF textual e o fluxo profissional → paciente usando apenas dados sintéticos.

Preview público canônico:

`https://washingtonmsdj.github.io/medatlas/`

### Produção clínica / dados reais

**NÃO PRONTO.**

O preview continua `synthetic-only`. Não inserir nomes reais, exames reais, identificadores, PHI ou outros dados clínicos reais. Backend de produção, autenticação, isolamento multi-tenant, Storage privado e controles operacionais/compliance permanecem gates separados.

### Imagem / OCR

**AINDA NÃO IMPLEMENTADO.**

PDF textual local faz parte do candidato. PDF escaneado sem camada textual e imagens continuam fail-closed até existir subsystem OCR local, vendorizado, lazy, limitado e testado. Não introduzir CDN/default remoto silencioso para worker, core ou modelos de idioma.

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
- texto importado sempre editável antes da análise anatômica;
- falha de ingestão preservando o último texto válido.

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

PDF sem camada textual retorna um estado explícito de OCR indisponível.

### Bundle e distribuição

Build medido no checkpoint:

- entry principal: ~**347,9 KB**;
- parser PDF lazy: ~**431,9 KB**;
- worker PDF local: ~**1.265,4 KB**.

O budget do core permanece separado dos budgets opcionais do PDF. Não aumentar o teto do core para absorver parser/worker.

PDF.js é Apache-2.0. A licença é validada contra o pacote instalado e copiada para:

`dist/licenses/pdfjs-LICENSE.txt`

`THIRD_PARTY_NOTICES.md` registra versão, upstream e uso.

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

Run **`34714504072` — PASS completo** no HEAD `1b8ae472ba42a83aad59d0ab407c9f3c9ce7342f`.

Inclui:

- dependency audit;
- DB/organization/publication/repository contracts;
- share/revocation/patient-share;
- anatomy + demo scenarios;
- vendored assets + performance;
- security/privacy e fronteira de ingestão TXT/MD/PDF;
- AI contract + clinical review gate;
- report workflow;
- license/provenance;
- reference atlas;
- MVP UI contract;
- TypeScript;
- production build;
- bundle budget segmentado para core/PDF.

### Browser E2E

Run **`34714504043` — PASS completo nos três shards**.

- `clinical-flow` — PASS, incluindo contrato TXT atualizado, PDF real, MIME/signature/malformação/no-text e PDF >8 MiB fail-closed;
- `responsive-layout` — PASS;
- `supporting-contracts` — PASS.

O run intermediário `34709060147` teve 41/42 testes verdes e todos os testes PDF verdes. A única falha foi um locator TXT obsoleto (`Importar laudo de texto sintético`), corrigido em `ff6a9dc0a656759abda1d78b5e88e9f1847d498a`. Não foi regressão do runtime.

### GitHub Pages Preview

Run **`34708932045` — PASS completo** no source `7bb4157db25b74f497fefc855bd88e4b4abd5775`.

Jobs verdes:

- build;
- deploy;
- verificação de shell/assets;
- Chromium do fluxo clínico 3D publicado;
- importação de PDF textual real no deploy;
- prova de que o worker PDF é resolvido no subpath correto, sob `/medatlas/assets/`.

As mudanças posteriores ao source de Pages são de testes/contratos/documentação e não alteram o runtime PDF publicado.

## Correções de robustez consolidadas

### Intake de laudo

A UI, o controlador e `src/product/constraints.ts` compartilham limites reais. TXT/MD usam leitura fatal UTF-8; PDF tem limites próprios e parser isolado. `ReportIntake` não lê bytes diretamente.

Qualquer falha de arquivo preserva o último texto válido e bloqueia a continuação quando a fonte atual não é válida.

### Prévia do paciente e gate de revisão

`PatientReportPage` deriva estado revisado da conclusão real + `reviewApproval`; conteúdo pendente não atribui revisor inexistente e usa estado visual de warning. Editar conteúdo invalida aprovação e links dependentes conforme o workflow.

### QA 3D

Superfícies WebGL continuam viewport-aware. `IntersectionObserver`/pausa offscreen não devem ser removidos para satisfazer screenshots. Os testes trazem a superfície ao viewport antes de exigir frame/canvas observável.

## Gate seguinte do MVP

O piloto manual sintético continua válido e agora deve incluir ao menos um PDF textual local conforme `docs/PILOT.md`.

O próximo salto de ingestão é **imagem/OCR**, não outra reimplementação de PDF. Antes de aparecer na UI, OCR deverá ter:

- formatos e limites explícitos de arquivo, dimensões/pixels e texto de saída;
- engine mantida, versão pinada, licença/proveniência;
- worker/core/modelos de idioma servidos localmente, sem CDN/default remoto;
- carregamento lazy;
- progresso, cancelamento, timeout e erro explícito;
- limite final de 64 KiB de texto editável;
- nenhuma análise/confirmacão/publicação automática;
- security contract, Browser E2E, budget e prova no deploy.

Não adicionar OCR casual no componente React para marcar o item como concluído.

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
- leitura/parsing de arquivo dentro de `ReportIntake`;
- parser/worker PDF remoto ou eager no bundle inicial;
- OCR com CDN/default remoto silencioso;
- remote AI, auth, billing ou dados reais fingidos por frontend;
- Vercel/Supabase como dependência para validar o MVP sintético atual.
