# URGENTE — MedAtlas

> **Documento canônico de continuidade.** Leia antes de alterar o projeto.
> Este arquivo registra o estado atual e as próximas decisões; não é diário de commits.

Última consolidação: **2026-09-10**  
Branch canônica: **`main`**  
Repositório: **`washingtonmsdj/medatlas`**  
Source funcional de referência desta consolidação: **`b5c2ca3d5c332432f7417513b19d1f8d06b290fe`**

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

## 1. Estado real do MVP em 2026-09-10

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
- [x] share demo opaco, versionado, temporário e revogável;
- [x] Analytics local do fluxo demo;
- [x] Equipe e permissões source-first sem mutações fake;
- [x] responsividade desktop/mobile e axe/WCAG protegidos por Browser E2E;
- [x] GitHub Pages como preview sintético publicado e verificado em Chromium;
- [x] ingestão local do MVP explicitamente limitada a **texto colado/digitado ou arquivo `.txt`/`.md`**;
- [x] limite de **64 KiB** centralizado e aplicado por bytes UTF-8 tanto no arquivo quanto no texto digitado/colado;
- [x] fluxo de análise também valida o limite no controlador, portanto a UI não é a única barreira;
- [x] teste Browser E2E dedicado cobre o limite e a comunicação dos formatos aceitos;
- [x] gate de segurança protege a mesma regra na autoridade central.

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

## 3. Correção consolidada nesta rodada

Foi encontrada uma inconsistência real de MVP: a interface comunicava limite de **64 KB**, mas o texto colado/digitado não estava protegido pela mesma barreira usada pelo importador de arquivo.

A correção ficou distribuída corretamente por responsabilidade:

- `src/product/constraints.ts` — SSOT do limite, extensões e validação por bytes;
- `src/components/ReportIntake.tsx` — UX do import/textarea, feedback, estado bloqueado e contagem de bytes;
- `src/App.tsx` — defesa em profundidade antes da mutação/análise;
- `scripts/validate-security-contract.mjs` — contrato estático de segurança;
- `tests/e2e/report-intake.spec.ts` — regressão em navegador;
- `.github/workflows/browser-e2e.yml` — novo teste incorporado ao shard clínico.

Durante a implementação, um update de `App.tsx` carregou mudanças estruturais não relacionadas. A regressão foi detectada pelo próprio `validate:mvp-ui`, comparada ao último HEAD verde `3ad3d98c…` e corrigida **restaurando o shell canônico e reaplicando somente o source guard**. A comparação final contra esse baseline deixou `App.tsx` com 35 adições e 3 remoções, sem a troca acidental do shell.

## 4. Evidência atual

Source funcional: `b5c2ca3d5c332432f7417513b19d1f8d06b290fe`.

- **CI `34481648367` — PASS**: contratos de DB/organização/publicação/repositório/share/anatomia/demo/assets/performance/security/IA/revisão/workflow/licença/Atlas/MVP UI, TypeScript, build e bundle budget.
- **GitHub Pages Preview `34481648389` — PASS nos jobs de build, deploy e verificação Chromium do fluxo 3D publicado.**
- **Browser E2E `34481648442`** — responsive-layout e supporting-contracts PASS; clinical-flow ainda estava executando no instante desta consolidação. Só promover o run inteiro a PASS quando o terceiro shard concluir verde.

Não usar runs intermediários que falharam durante a implementação como baseline final. Eles serviram para revelar contratos desatualizados e a regressão estrutural do `App.tsx`.

## 5. Próxima ordem de trabalho — mirando MVP

### P0 — fechar candidato a piloto sintético

1. confirmar o shard `clinical-flow` do Browser E2E `34481648442`;
2. manter CI + Browser E2E + Pages verdes no mesmo source funcional;
3. executar o **piloto manual sintético** de `docs/PILOT.md` no preview publicado, em desktop e mobile;
4. registrar apenas atritos observáveis de tarefa/navegação/3D e corrigir sem reabrir arquitetura já provada;
5. revisar texto do produto somente onde houver confusão real entre anatomia de referência e anatomia individual.

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

O **MVP browser sintético** pode ser tratado como pronto para piloto quando:

- CI, Browser E2E e Pages estiverem verdes no source funcional;
- fluxo laudo → anatomia → confirmação → 3D → explicação → revisão → paciente funcionar de ponta a ponta;
- manual pilot não revelar bloqueador P0;
- produto continuar synthetic-only e honesto sobre formatos/capacidades;
- nenhum estado sugira diagnóstico automático ou reconstrução individual do paciente.

Isso **não** significa “produção clínica pronta”. Produção exige P2 e os gates de segurança/compliance correspondentes.

## 7. Arquivos de continuidade

- `README.md` — escopo e arquitetura pública atual;
- `URGENTE.md` — estado operacional e ordem de trabalho;
- `docs/RELEASE_READINESS.md` — evidência de release e bloqueadores;
- `docs/PILOT.md` — roteiro do piloto sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica e 3D;
- `src/product/constraints.ts` — limites de produto compartilhados pelo runtime.
