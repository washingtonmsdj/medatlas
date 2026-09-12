# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.
> Este arquivo registra o estado atual e as próximas decisões; não é diário de commits.

Última consolidação: **2026-09-12**  
Branch canônica: **`main`**  
Repositório: **`washingtonmsdj/medatlas`**  
Source funcional de referência desta consolidação: **`e66eaf0daf8eb8904f56ae80e41fde947097d5b8`**

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

O wedge do produto é **comunicação clínica visual entre profissional e paciente**. MedAtlas não é diagnosticador automático, PACS, prontuário completo, segmentador DICOM nem reconstrução 3D específica do paciente.

## 1. Estado real do MVP em 2026-09-12

### MVP browser sintético — candidato a piloto

- [x] shell profissional separado da experiência do paciente;
- [x] dashboard clínico task-first;
- [x] Clinical Report Studio em três etapas/colunas: laudo → anatomia 3D → explicação;
- [x] Human Atlas/BodyParts3D real e vendorizado como engine anatômico canônico;
- [x] modo Atlas completo, modo clínico focado e modo paciente usando a mesma autoridade FMA;
- [x] órgão em detalhe somente como profundidade suplementar, sem alterar a anatomia confirmada;
- [x] triagem determinística de anatomia com confirmação humana obrigatória;
- [x] rascunho educacional + edição + aprovação clínica obrigatória;
- [x] preview do paciente antes da publicação;
- [x] preview pendente não se apresenta mais como revisado: sem atribuição falsa de revisor, com estado visual de warning e impressão rotulada como prévia;
- [x] share demo opaco, versionado, temporário e revogável;
- [x] Analytics local do fluxo demo;
- [x] Equipe e permissões source-first sem mutações fake;
- [x] responsividade desktop/mobile e axe/WCAG protegidos por Browser E2E;
- [x] GitHub Pages como preview sintético publicado e verificado em Chromium;
- [x] ingestão local do MVP explicitamente limitada a **texto colado/digitado ou arquivo `.txt`/`.md`**;
- [x] limite de **64 KiB** centralizado e aplicado por bytes UTF-8 tanto no arquivo quanto no texto digitado/colado;
- [x] fluxo de análise também valida o limite no controlador, portanto a UI não é a única barreira;
- [x] Browser E2E dedicado protege intake e semântica de revisão pendente do portal do paciente;
- [x] gate de segurança protege as regras centrais;
- [x] CI, Browser E2E e GitHub Pages/Chromium fecharam verdes no mesmo source funcional.

### O que continua deliberadamente fora do MVP browser atual

- [ ] PDF/imagem/OCR;
- [ ] autenticação real;
- [ ] Supabase de produção ativo;
- [ ] armazenamento clínico real;
- [ ] dados reais de pacientes;
- [ ] IA remota em produção;
- [ ] billing;
- [ ] convites/mutações reais de equipe;
- [ ] piloto clínico com PHI.

Esses itens **não devem ser simulados por botões fake, hardcode ou parser improvisado**.

## 2. Invariantes — não reintroduzir legado

1. Existe **um único Human Atlas canônico** para autoridade BodyParts3D/FMA.
2. Explorer, Clinical Studio e Patient são modos do mesmo sistema anatômico; não criar renderer concorrente para confirmar anatomia.
3. Viewer de órgão detalhado é suplementar e nunca muda a fonte de verdade clínica.
4. BodyParts3D/FMA é **anatomia humana de referência**, nunca corpo/reconstrução individual do paciente.
5. Explorar/clicar anatomia não equivale a confirmar anatomia. Confirmação exige ação explícita.
6. Nenhuma anatomia sem conceito FMA/renderizável pode virar confirmação clínica.
7. IA não publica e não substitui revisão humana.
8. Alteração de laudo, anatomia ou explicação invalida as revisões correspondentes e shares da versão antiga conforme o workflow.
9. `ClinicalRepository` permanece a autoridade de dados; não criar persistência paralela.
10. Demo permanece **synthetic-only** e sem telemetria clínica externa.
11. Token bruto de share/convite não pode virar identificador previsível ou persistência insegura.
12. Storage clínico de produção nunca pode ser público.
13. Não reutilizar Supabase de outro produto.
14. Não reintroduzir `OrganizationSwitcher`, `ViewModeSwitcher`, launcher duplicado de “Novo relatório” ou módulos Consultas/Exames separados no MVP.
15. Contexto de consulta/exame pertence ao fluxo de **Relatórios visuais**.
16. IDs FMA e detalhes de implementação não pertencem à superfície primária do paciente.
17. O Atlas completo preserva o desenho de três colunas enquanto houver largura útil: caso → corpo → detalhe.
18. `concept-shell.css` continua autoridade do shell; não ressuscitar temas paralelos ou CSS morto para vencer cascade.
19. PDF/imagem só entram com um contrato de ingestão seguro; não anexar parser/OCR casual ao browser atual.
20. Supabase/auth/IA remota só são ativados deliberadamente com seus próprios gates de isolamento e segurança.
21. Prévia do paciente sem aprovação clínica deve comunicar **pendência**, nunca sucesso ou autoria de revisão inexistente.

## 3. Correções MVP consolidadas

### 3.1 Intake de laudo — limite real de 64 KiB

Foi encontrada anteriormente uma inconsistência real de MVP: a interface comunicava limite de **64 KB**, mas o texto colado/digitado não estava protegido pela mesma barreira usada pelo importador de arquivo.

A correção ficou distribuída corretamente por responsabilidade:

- `src/product/constraints.ts` — SSOT do limite, extensões e validação por bytes;
- `src/components/ReportIntake.tsx` — UX do import/textarea, feedback, estado bloqueado e contagem de bytes;
- `src/App.tsx` — defesa em profundidade antes da mutação/análise;
- `scripts/validate-security-contract.mjs` — contrato estático de segurança;
- `tests/e2e/report-intake.spec.ts` — regressão em navegador;
- `.github/workflows/browser-e2e.yml` — teste incorporado ao shard clínico.

Durante essa implementação, um update completo de `App.tsx` carregou mudanças estruturais não relacionadas. A regressão foi detectada pelo próprio `validate:mvp-ui` e o shell canônico foi restaurado antes de reaplicar somente o guard necessário.

### 3.2 Portal do paciente — revisão pendente não pode parecer aprovada

Na auditoria de 2026-09-12 foi encontrado um problema de confiança do MVP: a prévia do paciente podia estar **sem aprovação clínica**, mas a superfície ainda mostrava linguagem e elementos visuais de revisão concluída, incluindo atribuição `Revisado por ...` baseada no membro atual e selo de sucesso.

A correção foi feita sem enfraquecer o fluxo existente:

- `src/components/PatientReportPage.tsx` — `hasClinicalReview` passou a depender da conclusão real da explicação + `reviewApproval`; prévia pendente mostra `REVISÃO PENDENTE`, não inventa revisor, usa `Imprimir prévia` e mantém linguagem de rascunho;
- `src/styles/patient-review-state.css` — estado pendente usa tokens de warning em vez de herdar verde/sucesso;
- `src/main.tsx` — carrega o módulo de estado visual;
- `tests/e2e/report-explanation.spec.ts` — regressão de navegador garante que editar a explicação invalida a aprovação e que a prévia não volta a afirmar `Revisado por` antes de nova aprovação.

A publicação real não estava burlando o gate: o repositório demo já rejeitava publicação sem revisão, anatomia válida, explicação válida e vínculo organizacional consistente. A correção desta rodada foi na **representação confiável do estado clínico na UI**, preservando a arquitetura fail-closed.

## 4. Evidência atual

Source funcional: `e66eaf0daf8eb8904f56ae80e41fde947097d5b8`.

- **CI `34691114750` — PASS**: audit, contratos de DB/organização/publicação/repositório/share/anatomia/demo/assets/performance/security/IA/revisão/workflow/licença/Atlas/MVP UI, TypeScript, build e bundle budget.
- **Browser E2E `34691114745` — PASS completo**: `clinical-flow`, `responsive-layout` e `supporting-contracts` verdes; o shard clínico inclui o novo contrato que impede a prévia pendente de se apresentar como revisada.
- **GitHub Pages Preview `34691114736` — PASS**: build, deploy, shell/assets publicados e verificação remota em Chromium do fluxo clínico 3D.

Não usar commits/runs intermediários da implementação como baseline final. O source funcional acima é o checkpoint desta consolidação.

## 5. Próxima ordem de trabalho — mirando MVP

### P0 — piloto sintético humano

1. executar o **piloto manual sintético** de `docs/PILOT.md` no preview publicado, em desktop e mobile;
2. observar principalmente: início/continuação do relatório, diferença entre exploração e confirmação anatômica, utilidade do 3D, revisão humana, transição profissional → paciente e estados pendentes;
3. registrar apenas atritos observáveis de tarefa/navegação/3D;
4. corrigir bloqueadores reais sem reabrir arquitetura já provada;
5. manter CI + Browser E2E + Pages verdes;
6. revisar texto do produto somente onde houver confusão real entre anatomia de referência e anatomia individual.

### P1 — ingestão de documentos, sem gambiarra

PDF/imagem/OCR é o próximo salto funcional útil, mas deve entrar como **subsystem de ingestão**, não como `FileReader` + biblioteca aleatória no frontend.

Antes de ativar, definir e testar:

- tipos MIME/extensões aceitos;
- limites de tamanho/página;
- extração de texto e OCR;
- tratamento de arquivo malformado;
- fronteira de armazenamento privado;
- retenção/expiração;
- sanitização e proteção contra payloads hostis;
- estado de processamento/erro/retry;
- separação explícita entre texto extraído e interpretação clínica.

Até isso existir, a UI continua honesta: **TXT/MD/texto local apenas**.

### P2 — produção clínica

Só após autorização explícita:

1. projeto Supabase dedicado ao MedAtlas;
2. migrations canônicas;
3. auth;
4. provas cross-tenant/RLS antes de liberar UI de conta/equipe;
5. Storage privado e testes de negação;
6. implementação `SupabaseClinicalRepository` sem segunda autoridade paralela;
7. share de produção com expiração/revogação/auditoria;
8. política de retenção, backup, incidentes e observabilidade;
9. validação jurídica/privacidade para a jurisdição e uso pretendidos;
10. piloto clínico controlado antes de PHI em produção.

### P3 — IA remota

Somente depois da fronteira backend existir. A IA deve retornar estrutura validável, resolver para FMA/renderabilidade e continuar sujeita aos gates de confirmação anatômica e revisão humana. Nunca expor segredo de provedor em `VITE_*`.

## 6. Critério de MVP desta fase

O **MVP browser sintético** permanece tecnicamente qualificado para **piloto manual sintético**. A auditoria de 2026-09-12 removeu uma ambiguidade clínica real da prévia do paciente e o novo source voltou a fechar verde em CI, Browser E2E e Pages.

O próximo gate não é outro refactor abstrato: é navegação humana real pelo roteiro de `docs/PILOT.md` e correção dos bloqueadores observados.

Isso **não** significa “produção clínica pronta”. Produção exige P2 e os gates de segurança/compliance correspondentes.

## 7. Arquivos de continuidade

- `README.md` — escopo e arquitetura pública atual;
- `URGENTE.md` — estado operacional e ordem de trabalho;
- `docs/RELEASE_READINESS.md` — evidência de release e bloqueadores;
- `docs/PILOT.md` — roteiro do piloto sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica e 3D;
- `src/product/constraints.ts` — limites de produto compartilhados pelo runtime.