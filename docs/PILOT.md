# MedAtlas — piloto sintético do MVP

## Objetivo

Validar o MedAtlas de ponta a ponta **sem dados reais** e sem depender de backend clínico ativo. O piloto mede clareza de tarefa, qualidade do 3D, ingestão documental local, gates humanos, responsividade e confiança do fluxo profissional → paciente.

Ele não autoriza uso clínico real nem substitui validação de segurança, privacidade ou compliance.

## Estado do piloto

O aceite funcional integrado está automatizado e qualificado no release:

```text
cfdd61bbb806d3560ba20f2487c41fee6818af75
```

Evidência pós-merge do próprio `main`:

- CI `34770428224`: **PASS**;
- Browser E2E `34770428246`: **PASS 4/4**;
- GitHub Pages `34770428231`: **PASS** incluindo build, deploy, shell/assets e fluxo 3D publicado em Chromium.

O release preserva o primeiro P1 já fechado: em 390 px a busca global era comprimida porque o perfil mantinha `min-width: 220px` herdado mesmo com o texto oculto. O shell clínico neutraliza essa largura com `min-width: 0`, e `responsive-layout.spec.ts` exige busca ≥200 px e perfil ≤48 px.

O segundo P1 qualitativo também está fechado: a ação de correspondência anatômica era apresentada como **“Reanalisar laudo” / “Analisando…”**, o que podia sugerir nova análise clínica ou diagnóstica. A UI agora comunica **“Refazer correspondência”**, **“Localizando anatomia”**, **“Buscando correspondências anatômicas”** e **“Localizando…”**. `report-intake.spec.ts` garante que `Reanalisar laudo` não volte a essa ação.

O artifact `visual-qa-34770428246-responsive-layout` do próprio `main` confirma visualmente a nova copy e as correções responsivas sem regressão relevante em Dashboard, Clinical Studio, Pacientes, Atlas, Equipe, Analytics ou Configurações.

## Aceite integrado automatizado

`tests/e2e/synthetic-pilot.spec.ts` cobre em uma única jornada:

```text
TXT local sintético
  → texto editável
  → encontrar anatomia
  → confirmação explícita
  → Human Atlas 3D
  → rascunho
  → prévia paciente
  → aprovação humana
  → share
  → portal paciente revisado
  → edição da fonte
  → reconfirmação obrigatória
  → share anterior inválido
```

O trabalho manual que permanece neste documento é **qualitativo**. Ele serve para observar compreensão, clareza, fluidez, conforto visual e atritos de uso que asserts automatizados não medem bem. Não deve ser usado para revalidar manualmente toda a mecânica já protegida por CI/Browser/Pages sem uma regressão concreta.

## Como registrar observações

Toda observação concreta do piloto deve ser registrada pelo formulário **[Observação do piloto sintético](https://github.com/washingtonmsdj/medatlas/issues/new?template=pilot-observation.yml)**. O template aplica automaticamente o label `pilot` e exige ambiente, cenário fictício, passos reproduzíveis, esperado × observado, impacto e confirmações de privacidade.

Use **um issue por comportamento distinto**. Não misture múltiplos defeitos no mesmo registro e não abra issue apenas para repetir uma ideia genérica sem comportamento observável. P0/P1 só deve virar mudança de runtime depois de reprodução ou evidência suficiente para localizar a causa.

Nunca anexar PHI, exames reais, nomes, identificadores ou imagens clínicas reais. O intake não autoriza produção clínica, Supabase real nem IA remota.

## Perguntas que o piloto qualitativo deve responder

- O profissional entende rapidamente onde iniciar e continuar um relatório?
- A importação local parece claramente local, e não upload para servidor?
- Progresso/cancelamento de OCR é compreensível?
- O texto reconhecido deixa claro que precisa de revisão humana?
- A anatomia sugerida é apresentada como sugestão, não diagnóstico?
- A ação de localizar/refazer correspondência anatômica permanece claramente distinta de reanálise clínica ou diagnóstico?
- A confirmação anatômica explícita é inequívoca?
- O Human Atlas 3D ajuda a explicar ou parece apenas decorativo?
- Exploração temporária permanece distinta da anatomia confirmada?
- A prévia do paciente é claramente separada da interface profissional?
- O paciente entende que vê anatomia humana de referência, não seu corpo reconstruído?
- Revisão, publicação e invalidação após mudança de fonte são compreensíveis?
- Desktop profissional e smartphone do paciente continuam confortáveis, sem overflow ou controles sobrepostos?

## Cenários anatômicos canônicos

| Cenário | Conceito esperado |
| --- | --- |
| Coluna lombar | FMA16036 |
| Rim | FMA7203 |
| Coração | FMA7088 |
| Ombro / supraespinal | FMA9629 |

A SSOT dos textos e IDs anatômicos é `src/clinical/demo-scenarios.json`.

## Contexto SaaS sintético

O preview usa organização, workspace, profissional e paciente totalmente fictícios. A identidade sintética compartilhada por organização e relatório tem SSOT em `src/demo/identity.ts`.

Não existe troca fake de organização/workspace no shell atual. No modo demo, Equipe não executa convites, alteração real de papel ou persistência de membership.

Papéis demonstrativos permanecem source-first:

- `admin`;
- `clinician`;
- `staff`.

## Fronteira de ingestão do MVP atual

O browser MVP aceita localmente, sem upload:

- texto digitado/colado;
- `.txt` e `.md`, até **64 KiB UTF-8**;
- `.pdf` textual, até **8 MiB**, **50 páginas** e **64 KiB** de texto extraído;
- `.pdf` escaneado/image-only como fallback local, até **8 páginas de OCR**, **2400 px por lado renderizado**, **2,5 MP por página**, **16 MP no total** e **12 MP de imagem embutida**;
- `.png`, `.jpg` e `.jpeg` com OCR local em português, até **6 MiB**, **4096 px por lado**, **4,5 MP** e **64 KiB** de texto extraído.

PDF usa PDF.js `6.3.289` com parser/worker local e lazy. Extensão, MIME, assinatura `%PDF-`, tamanho, páginas, senha e malformação falham fechado. Quando não há camada textual utilizável, o fallback rasteriza localmente dentro do orçamento de OCR e reaproveita a fronteira Tesseract validada.

Imagem usa Tesseract.js/core `7.0.0` + modelo português `1.0.0`, todos pinados e same-origin. `workerBlobURL: false` permanece obrigatório. O resultado entra no editor e **não executa automaticamente `Encontrar anatomia`**.

Durante o piloto, nunca usar nomes, exames, identificadores ou qualquer dado real de paciente.

## Aceite automatizado permanente

O Browser E2E protege, entre outros pontos:

1. cenários anatômicos determinísticos;
2. criação de relatório vazio fail-closed;
3. TXT/MD e seus limites;
4. PDF textual real e seus limites;
5. PDF image-only com OCR real por página e assets same-origin;
6. PNG/JPEG com assinatura/dimensões validadas antes do OCR;
7. OCR português real sem CDN e sem worker `blob:`;
8. preservação do último texto válido após falha/cancelamento;
9. ausência de análise anatômica automática após importação;
10. sugestão e confirmação anatômica explícita;
11. copy de correspondência anatômica que não se apresenta como reanálise clínica do laudo;
12. Human Atlas real no fluxo profissional e paciente;
13. rascunho, revisão, publicação e preview;
14. share temporário, revogação e expiração;
15. jornada integrada arquivo local → paciente → invalidação do share após alteração da fonte;
16. Analytics local;
17. shell profissional separado da experiência paciente;
18. Equipe/permissões sem mutações fake;
19. axe/WCAG;
20. ausência de overflow e hit areas protegidas em desktop/mobile;
21. topbar mobile com busca útil e perfil compacto em 390 px;
22. arquitetura de profundidade `Corpo → Órgão em detalhe`;
23. um único engine Human Atlas para a autoridade FMA/BodyParts3D.

O Browser E2E é dividido em quatro shards: `clinical-flow`, `document-ingestion`, `responsive-layout` e `supporting-contracts`. `synthetic-pilot.spec.ts` pertence ao `clinical-flow`; `report-intake.spec.ts` protege ingestão e a semântica de correspondência anatômica; `scanned-pdf-ocr.spec.ts` pertence a `document-ingestion`. `validate:browser-e2e-matrix` impede spec órfão, duplicado ou referência inexistente.

## Critérios 3D-first para observação manual

Em qualquer cenário anatômico, observar:

- canvas real aparece onde há tarefa anatômica;
- estrutura confirmada continua distinta de uma peça apenas inspecionada;
- rotação, zoom, vistas e reset parecem naturais;
- corpo completo permanece contexto primário quando um órgão detalhado é aberto;
- o órgão em detalhe nunca parece mudar sozinho a anatomia confirmada;
- o mesmo conceito confirmado acompanha Clinical Studio → preview → paciente;
- nenhuma copy sugere reconstrução individual do paciente;
- ações de correspondência anatômica usam linguagem de localizar/refazer correspondência, não prometem reanálise clínica do laudo;
- trocar de módulo não deixa sensação de canvas antigo ou contexto perdido;
- em 390 px, controles e busca global continuam tocáveis, legíveis e confortáveis.

## Fluxo manual sintético recomendado

A mecânica principal já possui aceite automatizado. O roteiro manual deve priorizar percepção:

```text
1. abrir Visão geral e localizar rapidamente a ação principal
2. iniciar Novo relatório sem orientação externa
3. importar um arquivo sintético compatível
4. observar se fica claro que o arquivo é processado localmente
5. executar “Encontrar anatomia”
6. observar se sugestão e confirmação parecem estados diferentes
7. confirmar explicitamente a anatomia
8. usar rotação, zoom, vistas, picking e órgão em detalhe quando aplicável
9. gerar o rascunho educacional
10. revisar/editar e aprovar explicitamente
11. abrir a prévia do paciente
12. publicar o link demo
13. abrir como paciente no smartphone e avaliar branding + 3D + explicação
14. confirmar que a linguagem comunica anatomia de referência
15. voltar ao profissional e alterar o laudo
16. observar se a necessidade de reconfirmação fica inequívoca
17. quando a anatomia já estiver confirmada, conferir se “Refazer correspondência” é entendido como nova busca anatômica, não reanálise clínica
18. conferir Analytics e Equipe apenas como superfícies demo
```

Opcionalmente, quando houver suspeita concreta de regressão, repetir manualmente PDF textual, PDF escaneado/OCR ou PNG/JPEG. Não transformar isso em checklist obrigatório a cada iteração quando os gates automatizados estiverem verdes.

## O que registrar

Registrar apenas observações concretas de produto:

- importação local pareceu upload para servidor?
- OCR deixou claro que o texto precisa de revisão humana?
- progresso/cancelamento foi compreensível?
- estrutura sugerida foi entendida como sugestão?
- “Encontrar anatomia” / “Refazer correspondência” foram entendidos como localização anatômica e não diagnóstico?
- exploração pareceu confirmação clínica em algum momento?
- o 3D ajudou a entender ou pareceu decorativo?
- houve confusão entre referência anatômica e corpo do paciente?
- reconfirmação após mudar o laudo ficou inequívoca?
- alguma etapa ficou escondida, duplicada ou longa demais?
- houve overflow, controle sobreposto, alvo pequeno ou perda de contexto em 390 px?

Não registrar PHI nem dados clínicos reais.

## Evidência automatizada de release

A evidência deve corresponder ao mesmo source candidato. Para o release atual:

```text
source: cfdd61bbb806d3560ba20f2487c41fee6818af75
CI:     34770428224 PASS
Browser:34770428246 PASS 4/4
Pages:  34770428231 PASS
```

Artifact responsivo do mesmo source:

```text
visual-qa-34770428246-responsive-layout
sha256:9fa2ced7b8803ff7d6ad437301ef24c601f223d84aa8cd33b69c0eddea907397
```

Não reutilizar execução antiga para declarar um source novo pronto.

## Critério de conclusão do MVP sintético

O MVP sintético está funcionalmente qualificado quando:

- CI, Browser E2E e Pages estão verdes para o mesmo source integrado;
- a jornada local intake → anatomia → 3D → explicação → revisão → paciente passa de ponta a ponta;
- alteração da fonte exige reconfirmação e invalida share obsoleto;
- portal e Clinical Studio permanecem coerentes entre desktop/mobile;
- nenhum dado sai da fronteira synthetic-only;
- nenhuma superfície promete diagnóstico automático, reconstrução individual ou backend inexistente.

O release `cfdd61bbb806d3560ba20f2487c41fee6818af75` atende esses critérios automatizados. O piloto qualitativo continua apenas para revelar novos atritos humanos P0/P1 reproduzíveis.
