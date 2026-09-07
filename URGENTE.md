# URGENTE — MedAtlas

> Documento canônico de continuidade. Leia este arquivo antes de alterar o projeto.
> Atualize este checkpoint sempre que uma etapa relevante for concluída.
>
> Última revisão: **2026-09-07**
> Código 3D/AAA consolidado até: **`f9f4a964282b596c9e31ba0ba1472a5d4e25d2da`** · Browser E2E da superfície em **`2fdc38aaa1af84085edfeefb6bd1f6f64952b2a5`**

## 0. Missão do produto

Construir um SaaS clínico visual premium em que clínicas e profissionais de saúde transformam informação de laudos/relatórios em uma experiência anatômica 3D compreensível, **revisada pelo profissional** e compartilhável com o paciente.

Fluxo canônico:

```text
laudo / relatório
      ↓
triagem anatômica
      ↓
conceitos reais FMA / BodyParts3D
      ↓
confirmação explícita do profissional
      ↓
Human Atlas 3D
      ↓
explicação em linguagem clara
      ↓
revisão clínica obrigatória
      ↓
link / experiência do paciente
```

O MedAtlas **não é** um diagnosticador automático, um PACS, um prontuário completo ou apenas um visualizador anatômico.

O wedge vencedor é:

> **comunicação clínica visual entre profissional e paciente.**

A anatomia 3D é o motor visual; o produto é o fluxo clínico revisado ao redor dela.

---

## 1. Modelo SaaS decidido

O MedAtlas é **um único SaaS multi-tenant**, não vários produtos separados.

### 1.1 Organização / clínica

Uma organização pode representar uma clínica, consultório, centro médico ou rede.

Responsabilidades:

- membros e papéis;
- profissionais;
- pacientes;
- consultas;
- exames/documentos;
- relatórios visuais;
- compartilhamentos;
- auditoria;
- branding e configurações;
- futuramente unidades/workspaces por especialidade.

### 1.2 Workspace do profissional

Experiência focada no trabalho clínico:

- meu dia;
- pacientes;
- consultas;
- exames;
- relatórios visuais;
- Atlas 3D;
- fila de revisão;
- compartilhamentos.

O profissional individual ("Solo") usa o mesmo produto e a mesma arquitetura, apenas sem a complexidade administrativa de uma clínica grande.

### 1.3 Equipe / recepção

Experiência operacional com permissões menores:

- pacientes;
- agenda/consultas;
- recebimento de documentos;
- preparação do atendimento;
- sem autoridade para aprovar conteúdo clínico quando o papel não permitir.

### 1.4 Paciente

O paciente **não recebe o dashboard clínico**.

Ele abre uma experiência simplificada e patient-safe contendo somente o que foi explicitamente publicado:

- anatomia 3D aprovada;
- trecho clínico selecionado;
- explicação revisada;
- observações do profissional;
- perguntas para a próxima consulta;
- identidade da clínica/profissional;
- impressão/PDF;
- futuramente revogação/expiração real via backend.

---

## 2. Direção visual — AAA SaaS

Referência aprovada em 2026-09-07:

- sidebar clínica escura e premium;
- canvas principal claro;
- organização/especialidade sempre visíveis;
- busca global no topo;
- dashboard com métricas, fila e continuidade do atendimento;
- Human Atlas como centro visual do produto;
- microinterações discretas;
- sem aparência de template genérico;
- sem aparência de prontuário hospitalar legado;
- desktop-first profissional, com adaptação mobile;
- dados sintéticos claramente identificados no MVP.

### 2.1 Tela-chave: Clinical Report Studio

A tela de relatório deve seguir permanentemente esta hierarquia:

```text
┌──────────────────┬──────────────────────────┬──────────────────────┐
│ LAUDO / EXAME    │ HUMAN ATLAS 3D          │ EXPLICAÇÃO           │
│ texto original   │ anatomia confirmada     │ rascunho assistido   │
│ sugestões        │ contexto / isolate      │ edição               │
│ evidências       │ busca / navegação       │ revisão clínica      │
│ confirmação      │ FMA / BodyParts3D       │ publicar / link      │
└──────────────────┴──────────────────────────┴──────────────────────┘
```

Não voltar ao layout antigo em que laudo + anatomia ficavam empilhados numa única coluna.

---

## 3. Checkpoint atual

### Concluído — núcleo clínico/anatômico

- [x] Repositório canônico `washingtonmsdj/medatlas`.
- [x] Frontend React/Vite/TypeScript.
- [x] Human Atlas fixado no upstream commit `1c38bf35c254a891200d3cedecfd57abebe83d8d`.
- [x] BodyParts3D vendorizado sob origem controlada pelo MedAtlas.
- [x] SHA-256 + provenance dos assets anatômicos.
- [x] Human Atlas completo com aproximadamente 2.234 peças.
- [x] Picking por estrutura.
- [x] sistemas anatômicos.
- [x] vistas.
- [x] rotação.
- [x] isolate.
- [x] explode.
- [x] busca anatômica.
- [x] aliases em português.
- [x] conceitos FMA reais.
- [x] modo clínico focado usando o **mesmo engine canônico**.
- [x] página do paciente usando o mesmo engine.
- [x] payload anatômico focado por chunks.
- [x] cache de chunks.
- [x] licença/atribuição Human Atlas + BodyParts3D preservadas e validadas.

### Concluído — segurança do fluxo

- [x] triagem anatômica determinística como baseline;
- [x] sugestão não altera anatomia sem confirmação;
- [x] edição do laudo reabre confirmação anatômica;
- [x] edição da explicação reabre revisão clínica;
- [x] publicação bloqueada enquanto houver revisão pendente;
- [x] reducer fail-closed para lifecycle do relatório;
- [x] tokens demo opacos e aleatórios;
- [x] expiração de share demo em 30 minutos;
- [x] dados atuais explicitamente synthetic-only;
- [x] CSP/headers de segurança;
- [x] gates de licença, segurança, IA e review no CI;
- [x] E2E desktop/mobile já criado;
- [x] axe/WCAG serious/critical gate.

### Concluído — contrato SaaS source-first

- [x] organizations;
- [x] organization_members;
- [x] professionals;
- [x] patients;
- [x] consultations;
- [x] visual_reports;
- [x] clinical_documents;
- [x] report_shares;
- [x] audit_events;
- [x] RLS fail-closed em source;
- [x] Storage clínico privado em source;
- [x] shares de produção definidos com hash, expiração e revogação;
- [x] `ClinicalRepository` abstraindo persistência;
- [x] seletor fail-closed que não ativa Supabase apenas por env vars.

### Concluído — redesign SaaS AAA, lote 1

- [x] Dashboard clínico redesenhado como produto SaaS.
- [x] Métricas sintéticas do dia.
- [x] card "Continuar atendimento".
- [x] fila clínica/itens que precisam de atenção.
- [x] fluxo visual "Laudo → 3D → Explicação → Revisão → Paciente".
- [x] bloco de posicionamento "uma plataforma / diferentes papéis".
- [x] nova topbar com organização/especialidade ativa.
- [x] busca global visual.
- [x] perfil profissional e ações rápidas.
- [x] sidebar premium.
- [x] módulo renomeado para **Relatórios visuais**.
- [x] Clinical Report Studio reorganizado em 3 colunas.
- [x] sistema visual responsivo inicial para desktop/tablet/mobile.

### Concluído — Clinical Studio + portal + módulos AAA, lote 3

- [x] Reduzir o painel de laudo para o fluxo **texto → triagem → confirmação humana**.
- [x] Transformar sugestões anatômicas em cards compactos, mantendo `.suggestion-item` e confirmação explícita.
- [x] Exibir **Alta confiança / Confiança moderada** como semântica textual acessível; confiança representa correspondência com o atlas, não certeza clínica.
- [x] Adicionar estado do intake, contagem de caracteres, importação local e boundary sintético sem aumentar permissões.
- [x] Transformar o composer em fluxo visível **Anatomia → Explicação → Revisão**.
- [x] Tornar provenance/origem do rascunho explícita.
- [x] Manter review gate humano fail-closed e reforçar visualmente a revisão obrigatória.
- [x] Adicionar **preview do paciente antes da publicação** sem gerar share nem contornar review gate.
- [x] Melhorar CTA final e estado de compartilhamento.
- [x] Adicionar feedback visual seguro para anatomia confirmada/reconfirmação, respeitando reduced-motion.
- [x] Redesenhar o portal do paciente como jornada **Ver anatomia → Entender explicação → Preparar perguntas**.
- [x] Aplicar portal claro/premium com resumo da região, FMA, status revisado e identidade da clínica/profissional.
- [x] Preservar 3D interativo, impressão/PDF, perguntas e aviso de anatomia de referência.
- [x] Corrigir contraste WCAG introduzido pelo portal e pelo Clinical Studio.
- [x] Redesenhar **Pacientes** sem fingir prontuário: contexto atual, progresso e fronteira de produção.
- [x] Redesenhar **Consultas** como workflow visual sem simular agenda/prontuário persistente.
- [x] Redesenhar **Exames** com pipeline local e PDF/imagem explicitamente bloqueados.
- [x] Redesenhar **Configurações** com estados reais do ambiente demo, governança e recursos bloqueados.
- [x] Unificar esses quatro módulos sob o mesmo design system SaaS do restante do MedAtlas.
- [x] CI completo PASS no HEAD `b6c24babc64afa342a4789f8d2969241733cef22`.
- [x] Browser E2E principal PASS no mesmo HEAD; nenhum artifact de falha foi gerado.

### Concluído — redesign 3D AAA, lote 2

- [x] Preservar **um único engine Human Atlas canônico** para todas as superfícies.
- [x] Adicionar modos de apresentação `clinical`, `explorer` e `patient` sem criar renderer paralelo.
- [x] Remover aparência cinza/pedestal do Human Atlas original nos modos clínico e paciente.
- [x] Criar apresentação clínica escura com iluminação fria, HUD e identidade MedAtlas.
- [x] Manter apresentação do paciente clara, calma e menos técnica.
- [x] Transformar o 3D focado do relatório em **Clinical 3D Workbench**.
- [x] Adicionar busca anatômica e atalhos com nomes acessíveis.
- [x] Adicionar vistas 3/4, frontal, lateral e posterior.
- [x] Adicionar rotação automática, reset e tela cheia no workspace clínico.
- [x] Integrar **Isolado / Sistema / Região** diretamente ao palco 3D.
- [x] Adicionar HUD com estrutura, peças selecionadas, peças de contexto e modo ativo.
- [x] Redesenhar o Atlas completo como **MedAtlas Atlas Lab / Workbench**, sem aparência de upstream.
- [x] Adicionar command palette, camadas anatômicas, inspetor permanente, dock de câmera, explode e HUD de seleção.
- [x] Manter picking por peça e ação **Usar no relatório visual**.
- [x] Adicionar controles simples de câmera na experiência do paciente.
- [x] Corrigir enquadramento de estruturas focadas usando os **bounds reais da geometria**; estruturas como coração/rim não reutilizam mais a distância de câmera do corpo completo.
- [x] Ocultar piso/pedestal nas superfícies focadas clinical/patient.
- [x] Corrigir contraste e heranças visuais do cabeçalho/card anatômico do paciente.
- [x] Endurecer `validate-reference-atlas` para impedir regressão dos três modos e do geometry-aware camera fit.
- [x] Expandir Browser E2E para cobrir o workbench clínico, Atlas completo e controles 3D do paciente.
- [x] CI completo PASS no contrato 3D até `f9f4a964282b596c9e31ba0ba1472a5d4e25d2da`.
- [x] Browser E2E **16/16 PASS** em `2fdc38aaa1af84085edfeefb6bd1f6f64952b2a5`.

---

## 4. P0 — agora: fechar o redesign AAA

Esta é a prioridade imediata. Não iniciar features grandes de backend antes de fechar esta superfície.

### P0.1 Validar o lote atual

- [x] Rodar CI/build/typecheck no novo HEAD — PASS completo em `b6c24babc64afa342a4789f8d2969241733cef22`.
- [x] Rodar Browser E2E do fluxo clínico — PASS no HEAD `b6c24babc64afa342a4789f8d2969241733cef22`, incluindo axe/WCAG, portal, Clinical Studio e superfícies 3D.
- [ ] Fazer captura visual desktop 1440/1600px.
- [ ] Fazer captura mobile.
- [x] Corrigir regressões de acessibilidade introduzidas pelo redesign: ARIA do progresso + contraste do dashboard + contraste do Clinical Report Studio.
- [x] Gate responsivo automatizado sem overflow horizontal em 1600/1440/390px (`0d4ef6c5dc7d75f020bd23ad73722f6b55fd1e0a`).
- [x] Confirmar que o Human Atlas e o fluxo clínico continuam funcionais após o redesign via Browser E2E.
- [x] Confirmar que review gate, publicação e handoff ao paciente continuam funcionais via Browser E2E.

### P0.2 Uniformizar todos os módulos

Aplicar o mesmo design system premium, sem criar telas fake:

- [x] Pacientes — contexto sintético premium, progresso e production boundary.
- [x] Consultas — workflow visual premium, sem agenda/prontuário fake.
- [x] Exames — pipeline local, formatos ativos e bloqueios explícitos.
- [x] Atlas 3D — MedAtlas Atlas Lab/Workbench aplicado e validado.
- [x] Configurações — estado real do demo, governança e controles locais.
- [x] experiência do paciente — jornada guiada clara/premium com 3D.
- [x] empty states — relatório novo + anatomia sem seleção com estado explícito.
- [x] loading states — link do paciente e anatomia focada com status acessível e reduced-motion.
- [x] errors/fail-closed states — link inválido/expirado, Atlas e publicação preservam bloqueio seguro.

Regra: módulo que ainda não tiver backend real pode operar em modo sintético, mas precisa ser funcional e declarar isso claramente.

### P0.3 Melhorar o Clinical Report Studio

- [x] Reduzir ruído textual no painel de laudo.
- [x] Transformar sugestões anatômicas em seleção visual mais compacta.
- [x] Adicionar status/confiança com semântica acessível e aviso de que confiança é textual, não clínica.
- [x] Melhorar toolbar do 3D focado — vistas, rotação, reset e tela cheia.
- [x] Mostrar modos Isolado / Sistema / Região com UI consistente dentro do palco 3D.
- [x] Enquadrar automaticamente anatomia focada pelos bounds reais da geometria.
- [x] Diferenciar visualmente as superfícies clinical / explorer / patient sem duplicar o engine.
- [x] Criar transição visual ao confirmar anatomia, com reduced-motion seguro.
- [x] Melhorar editor de explicação com estado, contagem e provenance.
- [x] Destacar claramente "rascunho assistido" versus "conteúdo aprovado".
- [x] Melhorar CTA final de aprovação/compartilhamento.
- [x] Criar preview rápido da experiência do paciente antes da publicação.
- [x] Manter todas as regras fail-closed — review, anatomia, share, provider e estados inválidos continuam cobertos por contratos/E2E.

### P0.4 Portal do paciente AAA

- [x] Hero mais humano e menos técnico.
- [x] 3D central e responsivo, com controles simplificados para o paciente e geometry-aware framing.
- [x] narrativa guiada: "ver anatomia / entender explicação / preparar perguntas".
- [x] identidade/branding demonstrativo da clínica e profissional.
- [x] selo claro de conteúdo revisado.
- [x] perguntas para próxima conversa.
- [x] impressão/PDF preservados.
- [x] acessibilidade mobile + axe/WCAG no portal.
- [x] nunca representar o BodyParts3D como reconstrução do paciente.

---

## 5. P1 — produto para clínicas

Depois do fechamento visual do MVP:

### Administração da organização

- [ ] módulo Equipe real no frontend;
- [ ] papéis e permissões visíveis;
- [ ] convites;
- [ ] unidades/locais;
- [ ] especialidades/workspaces;
- [ ] branding da clínica;
- [ ] analytics de uso;
- [ ] relatório de visualizações;
- [ ] plano/assinatura — somente depois da infraestrutura de produção.

### Navegação por contexto

Alvo futuro:

```text
Clínica Horizonte
├── Unidade principal
│   ├── Ortopedia
│   ├── Cardiologia
│   └── Fisioterapia
├── profissionais
├── equipe
├── pacientes
└── relatórios visuais
```

Não obrigar clínica pequena/usuário Solo a enxergar essa complexidade.

---

## 6. P2 — Supabase dedicado / produção clínica

**Deliberadamente adiado até o MVP visual estar fechado.**

- [ ] criar projeto Supabase exclusivo do MedAtlas;
- [ ] aplicar migrations canônicas;
- [ ] executar testes reais de cross-tenant isolation;
- [ ] provar RLS por papel;
- [ ] autenticação/onboarding;
- [ ] implementar `SupabaseClinicalRepository`;
- [ ] Storage privado;
- [ ] resolver share público pela RPC patient-safe;
- [ ] auditar criação/uso/revogação;
- [ ] provar expiração/revogação;
- [ ] só então permitir dados reais conforme requisitos jurídicos/regulatórios aplicáveis.

Não reutilizar Supabase do Achegue-se, OrdaX ou qualquer outro produto.

---

## 7. P3 — IA

### Já existe

- [x] contrato `medatlas.clinical-extraction/1`;
- [x] runtime validator;
- [x] anatomia da IA precisa resolver para conceito real;
- [x] review clínico obrigatório;
- [x] provenance planejada;
- [x] gerador educacional determinístico;
- [x] provedor remoto desativado sem backend.

### Próximo

- [ ] structured AI extraction atrás do backend;
- [ ] AI patient-language draft;
- [ ] provider/model/promptVersion/generatedAt;
- [ ] avaliação de qualidade em cenários sintéticos;
- [ ] nenhum output de IA publica diretamente;
- [ ] nenhuma chave de modelo no bundle Vite.

---

## 8. P4 — validação e lançamento

- [ ] habilitar GitHub Pages Source = GitHub Actions, se ainda necessário;
- [ ] publicar preview externo após disponibilidade de deploy;
- [ ] validar o browser real contra deploy;
- [ ] piloto sintético completo;
- [ ] piloto controlado com profissionais externos;
- [ ] medir tempo para criar relatório;
- [ ] medir taxa de conclusão/revisão;
- [ ] medir compreensão/satisfação qualitativa;
- [ ] corrigir UX antes de produção com PHI;
- [ ] preparar termos, privacidade e compliance para o mercado-alvo.

---

## 9. Invariantes — NÃO QUEBRAR

1. Existe **um único engine Human Atlas canônico**.
2. Modo completo e modo focado são entradas/estados diferentes do mesmo engine.
3. IA nunca pode inventar uma anatomia que não resolve no atlas fixado.
4. IA nunca publica sozinha.
5. Alterar laudo/anatomia/explicação invalida aprovações necessárias.
6. Patient share não deve expor IDs internos previsíveis.
7. Dados clínicos reais não entram no modo demo.
8. Bucket clínico de produção nunca é público.
9. Não usar banco de outro produto.
10. Não representar anatomia de referência como corpo/reconstrução individual do paciente.
11. Não criar um segundo mecanismo de relatório paralelo ao `report-workflow`.
12. Não criar uma segunda persistência paralela fora de `ClinicalRepository`.

---

## 10. Do not repeat

As próximas IAs **não devem**:

- recomeçar o MedAtlas do zero;
- voltar a tratar o produto como simples "site de anatomia";
- substituir o Human Atlas atual por iframe;
- criar renderer simplificado paralelo;
- reabrir decisões de licenciamento já documentadas;
- criar backend antes de validar o redesign atual;
- adicionar diagnóstico/tratamento automático para tornar a demo "mais impressionante";
- esconder que os dados atuais são sintéticos;
- converter o portal do paciente em um dashboard clínico completo;
- criar quatro aplicações independentes para clínica/profissional/equipe/paciente.

---

## 11. Próxima ação exata

1. Fazer visual QA final em 1440/1600px do dashboard, Clinical Report Studio e **novo enquadramento 3D focado**.
2. Concluir o redesign AAA do portal do paciente ao redor do novo 3D: hero, narrativa/abas, branding e hierarquia de conteúdo.
3. Melhorar o painel de laudo e sugestões anatômicas do Clinical Report Studio, reduzindo densidade sem remover os gates.
4. Melhorar editor, provenance visual, CTA de revisão/publicação e preview do paciente.
5. Uniformizar Pacientes/Consultas/Exames/Configurações com o mesmo design system; Atlas 3D já está concluído.
6. Criar o módulo Equipe apenas quando for funcional, sem placeholder.
7. Rodar CI + Browser E2E + axe após cada lote.
8. Só depois iniciar o Supabase dedicado.

---

## 12. Comandos de validação

Requer Node.js 22.13+.

```bash
npm ci
npm run validate:db-contract
npm run validate:anatomy-contract
npm run validate:demo-scenarios
npm run validate:vendored-assets
npm run validate:performance-budget
npm run validate:security-contract
npm run validate:ai-contract
npm run validate:review-gate
npm run validate:report-workflow
npm run validate:license-attribution
npm run validate:reference-atlas
npm run check
npm run build
npm audit --omit=dev --audit-level=high
```
