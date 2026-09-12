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
- [x] share demo opaco, versionado, temporário e revogável;
- [x] Analytics local demo;
- [x] Equipe/permissões sem mutações fake;
- [x] responsividade desktop/mobile e axe/WCAG protegidos por Browser E2E;
- [x] GitHub Pages publicado e verificado em Chromium;
- [x] ingestão local limitada honestamente a texto/TXT/MD;
- [x] limite de 64 KiB aplicado por bytes UTF-8 no arquivo, editor e controlador;
- [x] piloto visual com capturas reais do Browser E2E iniciado e gerando correções concretas de UX.

### Fora do MVP browser atual

- [ ] PDF/imagem/OCR;
- [ ] autenticação real;
- [ ] Supabase de produção ativo;
- [ ] armazenamento clínico real;
- [ ] dados reais de pacientes / PHI;
- [ ] IA remota em produção;
- [ ] billing;
- [ ] convites/mutações reais de equipe;
- [ ] piloto clínico com dados reais.

Esses itens **não podem ser simulados por botões fake, hardcode ou parser improvisado**.

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
18. PDF/imagem só entram com subsystem seguro de ingestão.
19. Supabase/auth/IA remota só entram com gates próprios.
20. Prévia sem aprovação clínica comunica **pendência**, nunca sucesso ou autoria inexistente.
21. Ação já concluída não deve competir visualmente com o próximo CTA real do fluxo.

## 3. Correções MVP consolidadas

### 3.1 Intake — limite real de 64 KiB

A UI e o controlador agora compartilham a mesma autoridade de limite por bytes UTF-8 para texto digitado/colado e arquivo TXT/MD. Browser E2E protege a barreira.

### 3.2 Portal do paciente — revisão pendente

`PatientReportPage` só apresenta conteúdo como revisado quando existe conclusão real + `reviewApproval`. Prévia pendente mostra `REVISÃO PENDENTE`, não inventa revisor e usa semântica visual de warning.

### 3.3 Piloto visual — contraste e hierarquia de ações

O pente-fino usando **capturas reais do Browser E2E** encontrou problemas que os testes funcionais, sozinhos, não evidenciavam:

1. **CTAs primários com baixo contraste** — ações como `Continuar relatório` e `Compartilhar com paciente` pareciam desabilitadas por causa de especificidade/cascade antigo.
   - `src/styles/action-state.css` virou a autoridade explícita para estado visual de ações primárias e desabilitadas.
   - Capturas responsivas posteriores confirmaram texto legível e hierarquia correta.

2. **Painéis laterais do Atlas com texto escuro sobre superfície forest** — o 3D estava correto, mas resumo/contexto/detalhe perdiam legibilidade.
   - `src/styles/reference-atlas-contrast.css` corrige somente contraste dos painéis, sem tocar no renderer nem na anatomia.
   - Captura nova de `atlas-explorer-1600` confirmou a correção no build real.

3. **Prévia do paciente com duas saídas para o profissional** — havia retorno no topo e outro no rodapé.
   - em preview existe agora uma única ação `Voltar ao profissional`;
   - portal publicado mantém `Voltar ao MedAtlas`;
   - `report-explanation.spec.ts` protege a singularidade do caminho de retorno.

4. **`Encontrar anatomia` continuava competindo como CTA primário mesmo depois da anatomia já confirmada.**
   - quando `anatomyReviewRequired=true`, continua `Encontrar anatomia` como ação primária;
   - quando a estrutura já está confirmada, vira `Reanalisar laudo`, visualmente secundária;
   - `report-intake.spec.ts` protege essa transição de hierarquia.

Não esconder/rebaixar outras ações por suposição. Só corrigir após evidência do piloto e estado de domínio explícito.

## 4. Checkpoints e validação

### Último checkpoint completamente verde antes das duas últimas correções de navegação/hierarquia

Source funcional: **`17d278e35ef8e60d885390ff49f564d48cd93e24`**.

- CI **`34692392073` — PASS**;
- Browser E2E **`34692392068` — PASS completo** (`clinical-flow`, `responsive-layout`, `supporting-contracts`);
- GitHub Pages **`34692392044` — PASS**, incluindo verificação remota do fluxo clínico 3D;
- visual QA pós-correção confirmou contraste dos CTAs e dos painéis do Atlas.

### Candidato atual em validação

HEAD de teste/continuidade no momento desta consolidação: **`2e0b35474f68966caa8aca85d306a15433b454b3`**.

Inclui, além do checkpoint verde:

- retorno único na prévia do paciente;
- hierarquia `Encontrar anatomia` → `Reanalisar laudo` após confirmação;
- regressões E2E correspondentes.

CI/Browser E2E do candidato foram disparados. Antes de declarar este SHA como novo baseline verde, confirmar os jobs mais recentes. Não confundir runs cancelados por commits subsequentes com regressão funcional.

## 5. Próxima ordem de trabalho — foco MVP

### P0 — continuar piloto sintético visual/humano

1. fechar os gates do candidato atual;
2. revisar as novas capturas desktop/mobile após as mudanças desta rodada;
3. seguir página por página: Visão geral → Pacientes → Laudos → Atlas 3D → Preview → portal publicado → Analytics;
4. registrar somente atritos observáveis de tarefa, leitura, hierarquia e 3D;
5. corrigir bloqueadores reais sem reabrir arquitetura já provada;
6. manter CI + Browser E2E + Pages verdes.

### P1 — ingestão documental, sem gambiarra

Depois do piloto, PDF/imagem/OCR pode ser o próximo salto funcional, mas deve entrar como **subsystem de ingestão** com MIME/extensões, limites, parser/OCR controlado, arquivo malformado fail-closed, sanitização, storage privado, retenção, estados de processamento/retry e separação entre texto extraído e interpretação clínica.

Até isso existir, a UI continua honesta: **TXT/MD/texto local apenas**.

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

O MVP browser sintético já é tecnicamente utilizável para piloto sintético. O trabalho atual é **lapidar o uso real**, não adicionar módulos grandes nem refatorar por abstração.

Produção clínica continua fora deste gate.

## 7. Arquivos de continuidade

- `README.md` — escopo/arquitetura pública;
- `URGENTE.md` — estado operacional e ordem de trabalho;
- `docs/RELEASE_READINESS.md` — evidência de release e bloqueadores;
- `docs/PILOT.md` — roteiro do piloto sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica e 3D;
- `src/product/constraints.ts` — limites compartilhados do produto.