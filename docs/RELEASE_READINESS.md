# MedAtlas — MVP release readiness

Checkpoint: **2026-09-10**  
Canonical branch: `main`  
Functional product source: **`b5c2ca3d5c332432f7417513b19d1f8d06b290fe`**

## Verdict

### Browser MVP sintético

**QUALIFICADO PARA PILOTO MANUAL SINTÉTICO.**

O fluxo browser atual está publicado e passou, no mesmo source funcional, pelos gates de CI, Browser E2E e verificação remota do GitHub Pages. Ele pode ser usado para avaliar UX, navegação, compreensão do 3D e o fluxo profissional → paciente usando apenas dados sintéticos.

Preview público canônico:

`https://washingtonmsdj.github.io/medatlas/`

### Produção clínica / dados reais

**NÃO PRONTO.**

O preview continua `synthetic-only`. Não inserir nomes reais, exames reais, identificadores, PHI ou outros dados clínicos reais. Backend de produção, autenticação, isolamento multi-tenant, Storage privado e controles operacionais/compliance permanecem gates separados.

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
- preview pré-publicação e share demo temporário/versionado/revogável;
- portal paciente com anatomia de referência, branding e explicação revisada;
- Analytics demo local;
- Equipe/permissões source-first sem mutações fake;
- responsividade desktop/mobile e axe/WCAG;
- importação local de texto `.txt`/`.md` e entrada digitada/colada;
- limite de **64 KiB por bytes UTF-8** aplicado no arquivo, editor e controlador antes da análise.

PDF, imagem e OCR **não fazem parte deste candidato**. A interface não deve prometer essas capacidades até existir um subsystem de ingestão seguro.

## Arquitetura 3D canônica

Existe uma única autoridade Human Atlas para BodyParts3D/FMA:

1. **Atlas completo** — exploração do corpo e sistemas;
2. **modo clínico focado** — recorte semântico para a estrutura/contexto confirmado;
3. **modo paciente** — mesma anatomia com linguagem/controles apropriados;
4. **órgão em detalhe** — profundidade suplementar após seleção válida, nunca segunda fonte de verdade.

Exploração e confirmação clínica são estados diferentes. Picking, busca ou destaque temporário nunca podem alterar silenciosamente a anatomia aprovada.

Human Atlas upstream permanece fixado ao source/proveniência registrada pelo projeto, com assets BodyParts3D locais e gates de integridade/licença.

## Evidência do source funcional

### CI

Run **`34481648367` — PASS**.

Inclui:

- dependency audit;
- DB/organization/publication/repository contracts;
- share/revocation/patient-share;
- anatomy + demo scenarios;
- vendored assets + performance;
- security/privacy;
- AI contract + clinical review gate;
- report workflow;
- license/provenance;
- reference atlas;
- MVP UI contract;
- TypeScript;
- production build;
- bundle budget.

### Browser E2E

Run **`34481648442` — PASS completo**.

Shards verdes:

- `clinical-flow` — inclui o fluxo de relatório e o novo contrato de intake/64 KiB;
- `responsive-layout`;
- `supporting-contracts` — acessibilidade e contratos auxiliares.

### GitHub Pages Preview

Run **`34481648389` — PASS**.

Jobs verdes:

- build;
- deploy;
- verificação do shell/assets publicados;
- verificação remota em Chromium do fluxo clínico 3D.

## Correção de robustez desta consolidação

A rodada de 2026-09-10 fechou uma inconsistência do intake: a UI comunicava limite de 64 KB, mas o texto digitado/colado podia contornar o limite que existia no arquivo.

A correção criou uma autoridade central em `src/product/constraints.ts`, fez o `ReportIntake` rejeitar payload acima do limite sem substituir o último texto válido, adicionou defesa no controlador de `App.tsx`, atualizou o gate de segurança e introduziu Browser E2E específico.

Durante essa implementação, um update de arquivo completo carregou acidentalmente trechos antigos do shell em `App.tsx`. O gate `validate:mvp-ui` detectou a regressão. O arquivo foi restaurado a partir do último baseline verde e os guards foram reaplicados isoladamente. O source final `b5c2ca3…` passou todos os gates; não usar os commits intermediários como baseline.

## Gate seguinte do MVP

O próximo gate de produto é **piloto manual sintético**, não outro redesenho abstrato.

Executar `docs/PILOT.md` em desktop e mobile, observando:

- clareza para iniciar/continuar relatório;
- compreensão da diferença entre sugestão, exploração e confirmação anatômica;
- utilidade real do 3D;
- clareza da revisão humana;
- transição para a experiência paciente;
- entendimento de “anatomia de referência”;
- responsividade/controles;
- atritos, passos desnecessários ou estados ambíguos.

Corrigir apenas problemas concretos encontrados, preservando as invariantes já provadas.

## Próximo salto funcional: ingestão documental

Depois do piloto sintético, PDF/imagem/OCR é um candidato P1 de alto valor, mas deve ser implementado como subsystem próprio com:

- MIME/extensão e limites explícitos;
- parser/OCR controlado;
- arquivos malformados tratados fail-closed;
- sanitização;
- storage privado e retenção definidos antes de dados reais;
- estados de processamento/retry/erro;
- separação entre texto extraído e interpretação clínica;
- testes de segurança e regressão.

Não adicionar parser casual no frontend para marcar o item como concluído.

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
- “Novo relatório” duplicado na sidebar;
- Consultas/Exames como módulos independentes no MVP;
- CSS morto/tema paralelo para contornar cascade;
- IDs FMA na superfície primária do paciente;
- remote AI, auth, billing ou dados reais fingidos por frontend;
- Vercel/Supabase como dependência para validar o MVP sintético atual.
