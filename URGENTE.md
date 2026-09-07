# URGENTE — MedAtlas

> Documento canônico de continuidade. Leia este arquivo antes de alterar o projeto.
> Atualize este checkpoint sempre que uma etapa relevante for concluída.
>
> Última revisão: **2026-09-07**
> Código do redesign consolidado e validado até: **`4cd02467477f060b93bc3337fff4b0200c5e350e`**

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

---

## 4. P0 — agora: fechar o redesign AAA

Esta é a prioridade imediata. Não iniciar features grandes de backend antes de fechar esta superfície.

### P0.1 Validar o lote atual

- [x] Rodar CI/build/typecheck no novo HEAD — PASS em `4cd02467477f060b93bc3337fff4b0200c5e350e`.
- [x] Rodar Browser E2E do fluxo clínico — PASS completo; 16/16 testes após correções de acessibilidade.
- [ ] Fazer captura visual desktop 1440/1600px.
- [ ] Fazer captura mobile.
- [x] Corrigir regressões de acessibilidade introduzidas pelo redesign: ARIA do progresso + contraste do dashboard + contraste do Clinical Report Studio.
- [ ] Continuar visual QA de overflow, clipping e densidade em 1440/1600px.
- [x] Confirmar que o Human Atlas e o fluxo clínico continuam funcionais após o redesign via Browser E2E.
- [x] Confirmar que review gate, publicação e handoff ao paciente continuam funcionais via Browser E2E.

### P0.2 Uniformizar todos os módulos

Aplicar o mesmo design system premium, sem criar telas fake:

- [ ] Pacientes.
- [ ] Consultas.
- [ ] Exames.
- [ ] Atlas 3D.
- [ ] Configurações.
- [ ] experiência do paciente.
- [ ] empty states.
- [ ] loading states.
- [ ] errors/fail-closed states.

Regra: módulo que ainda não tiver backend real pode operar em modo sintético, mas precisa ser funcional e declarar isso claramente.

### P0.3 Melhorar o Clinical Report Studio

- [ ] Reduzir ruído textual no painel de laudo.
- [ ] Transformar sugestões anatômicas em seleção visual mais compacta.
- [ ] Adicionar status/confiança com semântica acessível.
- [ ] Melhorar toolbar do 3D focado.
- [ ] Mostrar modos Isolado / Sistema / Região com UI consistente.
- [ ] Criar transição visual ao confirmar anatomia.
- [ ] Melhorar editor de explicação.
- [ ] Destacar claramente "rascunho assistido" versus "conteúdo aprovado".
- [ ] Melhorar CTA final de aprovação/compartilhamento.
- [ ] Criar preview rápido da experiência do paciente antes da publicação.
- [ ] Manter todas as regras fail-closed.

### P0.4 Portal do paciente AAA

- [ ] Hero mais humano e menos técnico.
- [ ] 3D central e responsivo.
- [ ] abas ou narrativa: "o que foi encontrado / onde fica / explicação".
- [ ] identidade/branding da clínica.
- [ ] selo claro de conteúdo revisado.
- [ ] perguntas para próxima conversa.
- [ ] impressão/PDF.
- [ ] acessibilidade mobile.
- [ ] nunca representar o BodyParts3D como reconstrução do paciente.

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

1. Fazer visual QA em 1440/1600px do dashboard e do Clinical Report Studio.
2. Ajustar spacing, densidade e responsividade sem reabrir a arquitetura.
3. Aplicar o mesmo design system AAA à página do paciente.
4. Rodar novamente Browser E2E + axe após o portal do paciente.
5. Uniformizar Pacientes/Consultas/Exames/Atlas/Configurações.
6. Criar o módulo Equipe apenas quando for funcional, sem placeholder.
7. Só depois iniciar o Supabase dedicado.

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
