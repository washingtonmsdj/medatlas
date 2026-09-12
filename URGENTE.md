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
- [x] ação `Novo relatório` permanece canônica no Dashboard/busca global, sem launcher duplicado em Configurações;
- [x] navegação mobile prioriza `Visão geral` + `Pacientes` e mantém módulos secundários acessíveis via `Mais`;
- [x] modo paciente usa contexto anatômico regional coerente sem alterar o FMA confirmado;
- [x] responsividade desktop/mobile e axe/WCAG protegidos por Browser E2E;
- [x] GitHub Pages publicado e verificado em Chromium;
- [x] ingestão local limitada honestamente a texto/TXT/MD;
- [x] limite de 64 KiB aplicado por bytes UTF-8 no arquivo, editor e controlador;
- [x] `src/ingestion/` é a fronteira tipada de arquivo → validação → extração para TXT/MD;
- [x] `ReportIntake` não lê bytes de arquivo diretamente;
- [x] extensão, MIME, tamanho e UTF-8 inválido falham fechado antes de substituir o último texto válido;
- [x] piloto visual com capturas reais do Browser E2E gerando correções concretas de UX.

### Fora do MVP browser atual

- [ ] PDF;
- [ ] imagem/OCR;
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
26. Ausência de modelo 3D suplementar nunca deve sugerir que a anatomia clínica confirmada está errada ou precisa ser trocada.
27. Superfícies do paciente devem priorizar **contexto anatômico espacial/regional** ao redor da estrutura confirmada; nunca trocar o conceito FMA para obter um enquadramento visual melhor.
28. Ações globais do fluxo, como `Novo relatório`, não devem reaparecer como launcher local em módulos sem semântica própria para aquela ação.
29. Ingestão documental deve separar arquivo, validação, extração de texto e interpretação clínica; parser/OCR não pertence ao componente React nem pode publicar diretamente no workflow clínico.
30. `ReportIntake` não pode ler bytes de arquivo diretamente; decoding/extraction pertence a `src/ingestion/`.
31. Falha de ingestão nunca substitui o último texto válido do laudo.
32. Texto extraído continua sendo **entrada editável**, nunca confirmação anatômica, diagnóstico, revisão ou publicação.

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
8. **Dashboard mobile parecia ter 3D vazio no screenshot full-page** — a causa era a pausa offscreen via `IntersectionObserver`, não o renderer/câmera. O experimento de readiness foi revertido. `tests/e2e/visual-3d-visibility.spec.ts` traz o 3D para o viewport e `dashboard-3d-mobile-visible-390.png` confirmou L4–L5 renderizado e interativo no mobile.
9. **Studio tinha duas ações equivalentes de `Prévia do paciente` na mesma superfície** — a ação prematura do cabeçalho foi removida em `ada30f49a08884d6c75351a1ceb94204295474a3`; permanece a prévia contextual da etapa 03 e o acesso global do topo. `report-explanation.spec.ts` exige uma única prévia dentro do workspace.
10. **Atlas pedia “Selecione um órgão compatível” para Disco L4–L5 já confirmado** — `36a774f5bdc991d1ea228535cfc58bea4208a7fa` separa anatomia clínica de detalhe suplementar. Para estruturas sem modelo extra, o painel informa `Detalhe 3D adicional não disponível`, mantém a estrutura no corpo completo e não induz troca de anatomia.
11. **Portal publicado parecia ter WebGL vazio em captura full-page** — `tests/e2e/visual-patient-portal-visibility.spec.ts` passa a trazer `#patient-anatomy` para o viewport e capturar a superfície observável. A evidência `patient-portal-anatomy-visible.png` confirmou o Human Atlas renderizado; o vazio antigo era artefato de QA offscreen.
12. **Pacientes/portal mostravam L4–L5 fragmentado e pequeno** — a causa era `contextMode="system"`, que fornecia contexto inadequado para o enquadramento correto da câmera. `PatientsModule` e `PatientReportPage` agora usam `region`, preservando o mesmo FMA e contexto local limitado. As capturas passaram a mostrar coluna lombar/pelve coerentes como no Dashboard.
13. **Dois contratos E2E estavam atrasados em relação ao produto** — mobile agora percorre `Mais → Laudos` e Configurações valida branding read-only em vez de esperar botão fake de edição. `87c44bdb8be43483608de2cd0da9a0d65945eecf` fechou CI/Browser completos.
14. **Configurações duplicava `Novo relatório`** — o launcher local, prop associada e CSS morto foram removidos. Dashboard e busca global permanecem autoridades da ação. `mvp-ux-contracts.spec.ts` protege a ausência do launcher local e a presença da ação canônica no Dashboard.
15. **Analytics e Equipe** — capturas desktop/mobile foram revisadas após as correções acima e não apresentaram atrito objetivo que justificasse nova mudança; não modificar por preferência estética sem nova evidência.

Não esconder/rebaixar ações por suposição. Só corrigir após evidência do piloto e estado de domínio explícito.

### 3.4 Fundação da ingestão documental — TXT/MD

O primeiro checkpoint de P1 está concluído **sem habilitar PDF/OCR prematuramente**:

- `src/ingestion/contracts.ts` define resultado tipado e códigos de falha;
- `src/ingestion/local-text.ts` é a autoridade para ler arquivos locais TXT/MD;
- `src/product/constraints.ts` centraliza extensões, MIME e limite de 64 KiB;
- a leitura usa `arrayBuffer()` e `TextDecoder('utf-8', { fatal: true })`;
- extensão, MIME declarado, tamanho antes/depois da leitura, UTF-8 e conteúdo mínimo falham fechado;
- `ReportIntake` apenas chama a fronteira e apresenta mensagens; não decodifica arquivo;
- falha de MIME/encoding preserva o último texto válido;
- `scripts/validate-security-contract.mjs` proíbe leitura direta de bytes dentro de `ReportIntake` e exige as barreiras acima;
- Browser E2E cobre `.txt` com MIME incompatível e payload UTF-8 inválido.

A aplicação do texto no relatório continua separada da interpretação: importar não executa `Encontrar anatomia`, não confirma FMA e não publica conteúdo.

## 4. Checkpoints e validação

### Baseline verde do contexto anatômico regional

Runtime: **`0f4fbb379719c05675787457370d9d6b01d8a11f`**.  
Contrato: **`5a2c0a39f1f20839c55651b381470a439077c16e`**.

- CI **`34699149431` — PASS completo**;
- Browser E2E **`34699096707` — PASS completo nos três shards**;
- GitHub Pages **`34699096669` — PASS completo**, incluindo fluxo 3D publicado;
- artefato responsivo **`10299557362`** confirmou visualmente contexto lombar/pélvico coerente em Dashboard, Pacientes e portal publicado.

### Baseline verde — piloto visual fechado

Runtime: **`eaa541b69040b86c84194ddfaa3cfcbe8af54692`**.  
HEAD de testes: **`83c42ab56eb8cecdaf2916571650ac9124b98374`**.

- CI **`34701927508` — PASS completo**;
- Browser E2E **`34701927501` — PASS completo**;
- GitHub Pages **`34701462500` — PASS completo**;
- artefato responsivo **`10300078764`** confirmou Configurações sem o launcher duplicado e sem quebra visual em desktop/mobile.

### Baseline verde atual — fundação de ingestão P1

Runtime TXT/MD: **`795416df188e0b8f60dbec27a314845d0187fa84`**.  
E2E de rejeição: **`fbf5566770e9f96dcb24a997a8613bd1e32d9790`**.  
Security/contrato: **`11a3ac4810e409097d6f76642a3080f5c91c2acd`**.

- CI **`34704644495` — PASS completo**, incluindo novo `validate:security-contract`, TypeScript, build e bundle budget;
- Browser E2E **`34704614163` — PASS completo**:
  - `clinical-flow` — PASS, incluindo MIME incompatível e UTF-8 inválido;
  - `responsive-layout` — PASS;
  - `supporting-contracts` — PASS;
- GitHub Pages do runtime **`34702511026` — PASS completo**, incluindo verificação Chromium do fluxo 3D publicado.

O CI intermediário **`34702511028`** falhou porque o security contract ainda exigia a arquitetura antiga (`file.text()` dentro de `ReportIntake`). O gate foi corrigido para proteger a nova fronteira em vez de ser afrouxado. Não classificar isso como regressão do runtime.

## 5. Próxima ordem de trabalho — foco MVP

### P0 — baseline do piloto sintético

O pente-fino visual atual está fechado. Dashboard, Studio, Atlas, Pacientes, portal publicado, Analytics, Equipe e Configurações foram observados em capturas reais desktop/mobile. Não iniciar outro redesenho abstrato.

Manter como regressão obrigatória:

1. CI completo;
2. Browser E2E nos três shards;
3. Pages quando houver alteração de runtime;
4. QA viewport-aware para superfícies WebGL;
5. correção somente de atrito reproduzível ou requisito explícito.

### P1 — ingestão documental, sem gambiarra — **EM EXECUÇÃO**

Fundação TXT/MD concluída:

- [x] extrair de `ReportIntake` a responsabilidade de validar/ler arquivos;
- [x] criar `src/ingestion/` com contratos tipados de resultado/erro;
- [x] separar `arquivo → validação → extração de texto → aplicação no relatório → interpretação anatômica`;
- [x] manter `src/product/constraints.ts` como autoridade de limites/extensões/MIME;
- [x] tratar extensão, MIME, tamanho, leitura e UTF-8 fail-closed;
- [x] proteger o comportamento atual com security contract + Browser E2E;
- [x] preservar o último texto válido quando a ingestão falha.

Próximo gate — **PDF, sem OCR ainda**:

1. definir limite próprio de arquivo/páginas/texto extraído para PDF;
2. integrar parser PDF mantido e executado localmente, sem upload e sem `eval`/código remoto;
3. validar extensão + MIME + assinatura `%PDF-` antes de parsear;
4. tratar arquivo criptografado, sem texto, truncado/malformado e excesso de páginas/tamanho fail-closed;
5. extrair texto para o mesmo contrato de documento e exibi-lo no editor antes de qualquer análise anatômica;
6. carregar parser de forma lazy para não degradar o bundle inicial/3D;
7. adicionar contratos de segurança, testes unitários/Browser e budget antes de expor `PDF` no `accept`/copy da UI;
8. só depois avaliar imagem/OCR, com estados explícitos de processamento/retry/erro.

Storage privado, retenção de dados reais e PHI continuam fora até o gate de produção clínica.

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

O MVP browser sintético está **tecnicamente qualificado e visualmente estabilizado para piloto sintético**. A fundação de ingestão TXT/MD já está separada e protegida; o próximo salto funcional é PDF local controlado, mantendo texto extraído separado da interpretação clínica.

Produção clínica continua fora deste gate.

## 7. Arquivos de continuidade

- `README.md` — escopo/arquitetura pública;
- `URGENTE.md` — estado operacional e ordem de trabalho;
- `docs/RELEASE_READINESS.md` — evidência de release e bloqueadores;
- `docs/PILOT.md` — roteiro do piloto sintético;
- `docs/SECURITY.md` — fronteiras de segurança;
- `docs/ANATOMY_ARCHITECTURE.md` — autoridade anatômica e 3D;
- `src/ingestion/contracts.ts` — contrato tipado de ingestão;
- `src/ingestion/local-text.ts` — fronteira TXT/MD local fail-closed;
- `src/product/constraints.ts` — limites/extensões/MIME compartilhados do produto.
