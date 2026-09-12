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
- [x] portal publicado e links inválidos/revogados permanecem autocontidos, sem rota artificial de volta ao shell clínico;
- [x] share demo opaco, versionado, temporário e revogável;
- [x] Analytics local demo;
- [x] Equipe/permissões sem mutações fake;
- [x] Configurações demo deixam branding/estado não persistente explicitamente read-only;
- [x] navegação mobile prioriza `Visão geral` + `Pacientes` e mantém módulos secundários acessíveis via `Mais`;
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
22. Portal do paciente publicado é uma experiência autocontida; retorno explícito ao profissional existe apenas na prévia interna.
23. Em mobile, módulos secundários não podem desaparecer: ficam atrás de `Mais` e os testes devem navegar pelo mesmo caminho do usuário.
24. QA visual de WebGL deve observar a superfície como o usuário a observa: renderers pausados fora do viewport não devem ser tratados como falha só porque uma captura `fullPage` não provocou interseção/scroll.
25. Não remover `IntersectionObserver`/pausa offscreen para “consertar” screenshots; preservar a economia de GPU e testar o primeiro frame quando a superfície entra no viewport.

## 3. Correções MVP consolidadas

### 3.1 Intake — limite real de 64 KiB

A UI e o controlador compartilham a mesma autoridade de limite por bytes UTF-8 para texto digitado/colado e arquivo TXT/MD. Browser E2E protege a barreira.

### 3.2 Portal do paciente — revisão e isolamento corretos

`PatientReportPage` só apresenta conteúdo como revisado quando existe conclusão real + `reviewApproval`. Prévia pendente mostra `REVISÃO PENDENTE`, não inventa revisor e usa semântica visual de warning.

A prévia interna mantém uma única ação `Voltar ao profissional`. O portal publicado, links inválidos e shares revogados não oferecem retorno artificial ao shell clínico.

### 3.3 Piloto visual — contraste, hierarquia e QA fiel ao viewport

O pente-fino usando **capturas reais do Browser E2E** encontrou problemas que os testes funcionais, sozinhos, não evidenciavam:

1. **CTAs primários com baixo contraste** — `src/styles/action-state.css` é a autoridade explícita de estado visual das ações primárias/desabilitadas.
2. **Painéis laterais do Atlas com baixo contraste** — `src/styles/reference-atlas-contrast.css` corrige contraste sem tocar no renderer/anatomia.
3. **Prévia do paciente com duas saídas** — ficou uma única rota de retorno no preview e nenhuma no portal publicado.
4. **`Encontrar anatomia` competia depois da confirmação** — após anatomia confirmada vira `Reanalisar laudo`, visualmente secundária; quando `anatomyReviewRequired=true`, volta a `Encontrar anatomia` como ação primária.
5. **Navegação mobile instável/densa** — `Visão geral` e `Pacientes` permanecem primários; `Laudos`, `Atlas 3D`, `Equipe`, `Analytics` e `Configurações` ficam em `Mais`, sem alterar desktop.
6. **Suite responsiva foi truncada por uma edição concorrente** — restaurada integralmente em `f8acc60de0f66b163de843a65da8edbe57d5969d`; não aceitar novamente cobertura parcial como PASS.
7. **Gate do Pages ficou desatualizado após o novo `Mais`** — corrigido em `3e9a88d4284cb23a17e50869f20db3b1a3cc4678` para percorrer a navegação mobile real.
8. **Dashboard mobile parecia ter 3D vazio no screenshot full-page** — investigação confirmou que o Human Atlas fica abaixo do viewport inicial e o renderer pausa frames offscreen com `IntersectionObserver`; desktop e Pacientes renderizam normalmente quando a superfície está dentro do viewport/root margin. O experimento de atrasar readiness foi revertido em `70e653e5f786d91ae589729592ca86664cf9af61` para não mascarar a causa. O QA agora inclui `tests/e2e/visual-3d-visibility.spec.ts`, que traz a superfície para o viewport e captura `dashboard-3d-mobile-visible-390.png` após frames reais do navegador.

Não esconder/rebaixar ações por suposição. Só corrigir após evidência do piloto e estado de domínio explícito.

## 4. Checkpoints e validação

### Baseline verde consolidado anterior

Source funcional: **`2e0b35474f68966caa8aca85d306a15433b454b3`**.

- CI **`34693122528` — PASS**;
- Browser E2E **`34693122510` — PASS completo** (`clinical-flow`, `responsive-layout`, `supporting-contracts`);
- GitHub Pages do runtime correspondente (`b021ca356887233b753b7c21713570a01fbe48f9`) **`34693105521` — PASS**;
- visual QA confirmou contraste dos CTAs, contraste do Atlas e hierarquia `Reanalisar laudo`.

### Baseline de deploy/navegação já provado

Source: **`3e9a88d4284cb23a17e50869f20db3b1a3cc4678`**.

- CI **`34695594932` — PASS**;
- GitHub Pages Preview **`34695594926` — PASS completo**: build, deploy, assets e fluxo 3D publicado em Chromium.

### Candidato atual de QA visual

HEAD funcional/teste: **`fdce791c4a327000c1dd2b813ce75515158225d0`**.

- preserva a otimização offscreen do renderer;
- adiciona captura viewport-aware `dashboard-3d-mobile-visible-390.png` ao shard responsivo;
- CI **`34696244235` — PASS**;
- Browser E2E **`34696244246`** aguardava liberação do grupo de concorrência na hora desta consolidação; runs intermediários foram supersedidos/cancelados e não são regressões.

Não confundir runs cancelados/supersedidos por commits subsequentes com regressão funcional.

## 5. Próxima ordem de trabalho — foco MVP

### P0 — continuar piloto sintético visual/humano

1. Fechar Browser E2E `34696244246` e baixar o artifact responsivo.
2. Inspecionar `dashboard-3d-mobile-visible-390.png`; exigir anatomia visível quando a superfície realmente entra no viewport. Se continuar vazia **nesse teste viewport-aware**, tratar como bug real do renderer/câmera.
3. Se a prova passar, encerrar o falso positivo do screenshot full-page e seguir página por página: Visão geral → Pacientes → Laudos → Atlas 3D → Preview → portal publicado → Analytics/Equipe/Configurações.
4. Registrar somente atritos observáveis de tarefa, leitura, hierarquia e 3D.
5. Manter CI + Browser E2E + Pages verdes.

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
