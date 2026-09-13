# MedAtlas — piloto sintético do MVP

## Objetivo

Validar o MedAtlas de ponta a ponta **sem dados reais** e sem depender de backend clínico ativo. O piloto mede clareza de tarefa, qualidade do 3D, ingestão documental local, gates humanos, responsividade e confiança do fluxo profissional → paciente.

Ele não autoriza uso clínico real nem substitui validação de segurança, privacidade ou compliance.

## Estado do piloto

O aceite funcional integrado está automatizado e qualificado no release:

```text
2f797c81ff24aabba51fb7aa06b76f0fcd6011fc
```

Evidência pós-merge do próprio `main`:

- CI `34728485763`: **PASS**;
- Browser E2E `34728485665`: **PASS 4/4**;
- GitHub Pages `34728485730`: **PASS** incluindo o fluxo 3D/OCR no site publicado.

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

## Perguntas que o piloto qualitativo deve responder

- O profissional entende rapidamente onde iniciar e continuar um relatório?
- A importação local parece claramente local, e não upload para servidor?
- Progresso/cancelamento de OCR é compreensível?
- O texto reconhecido deixa claro que precisa de revisão humana?
- A anatomia sugerida é apresentada como sugestão, não diagnóstico?
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

O preview usa uma organização fictícia e um workspace clínico fixo. O contexto ativo aparece como informação do produto; **não existe troca fake de organização/workspace no shell atual**.

A identidade sintética compartilhada por organização e relatório tem SSOT em `src/demo/identity.ts`. Não duplicar IDs/nome da organização, workspace padrão, profissional atual ou paciente demo em seeds paralelos.

Papéis demonstrativos permanecem source-first e alinhados às políticas projetadas:

- `admin`;
- `clinician`;
- `staff`.

No modo demo, Equipe não deve executar convites, alteração real de papel ou persistência de membership.

## Fronteira de ingestão do MVP atual

O browser MVP aceita localmente, sem upload:

- texto digitado/colado;
- `.txt` e `.md`, com até **64 KiB por bytes UTF-8**;
- `.pdf` textual, com até **8 MiB**, **50 páginas** e **64 KiB de texto extraído**;
- `.pdf` escaneado/image-only como fallback local, com até **8 páginas de OCR**, **2400 px por lado renderizado**, **2,5 MP por página**, **16 MP no total** e **12 MP de imagem embutida**;
- `.png`, `.jpg` e `.jpeg` com OCR local em português, até **6 MiB**, **4096 px por lado**, **4,5 MP** e **64 KiB de texto extraído**.

PDF usa PDF.js `6.3.289` com parser/worker local e lazy. Extensão, MIME, assinatura `%PDF-`, tamanho, páginas, senha e malformação falham fechado. Quando a extração textual não produz conteúdo, o fallback rasteriza localmente somente dentro do orçamento de OCR e reaproveita a fronteira Tesseract já validada. O texto resultante entra no editor e **não executa automaticamente `Encontrar anatomia`**.

Imagem usa Tesseract.js `7.0.0` + modelo português `1.0.0`, ambos pinados. Extensão, MIME, assinatura binária, tamanho, dimensões/pixels são validados antes do OCR. Worker, core e modelo são servidos pelo próprio MedAtlas, com worker direto same-origin e sem fallback silencioso de CDN. OCR é lazy, cancelável e seu resultado entra no editor antes de qualquer interpretação clínica.

PDF escaneado segue a mesma regra: rasterização e OCR são locais, limitados e canceláveis. Se não houver texto suficiente após OCR, o arquivo é rejeitado fail-closed e o último texto válido permanece intacto.

Durante o piloto, nunca usar nomes, exames, identificadores ou qualquer dado real de paciente.

## Aceite automatizado

O Browser E2E protege, entre outros pontos:

1. cenários anatômicos determinísticos;
2. criação de relatório vazio fail-closed;
3. TXT/MD, limite de 64 KiB, MIME incompatível e UTF-8 inválido;
4. PDF textual real, MIME, assinatura, malformação e arquivo >8 MiB;
5. PDF image-only com OCR real por página, assets same-origin, limite de páginas/pixels e ausência de análise anatômica automática;
6. PNG/JPEG com assinatura real, limite de 6 MiB e dimensões/pixels antes do OCR;
7. OCR português real usando apenas assets same-origin, sem CDN e sem worker `blob:`;
8. preservação do último texto válido após falha/cancelamento de ingestão;
9. ausência de análise anatômica automática após qualquer importação;
10. sugestão e confirmação anatômica explícita;
11. Human Atlas real no fluxo profissional e paciente;
12. rascunho educacional, revisão e publicação;
13. preview pré-publicação e link temporário;
14. expiração/revogação de share;
15. jornada integrada arquivo local → paciente → invalidação do share após alteração da fonte;
16. Analytics local;
17. shell profissional separado da experiência paciente;
18. Equipe/permissões sem mutações fake;
19. axe/WCAG;
20. ausência de overflow e hit areas protegidas em desktop/mobile;
21. arquitetura de profundidade `Corpo → Órgão em detalhe`;
22. um único engine Human Atlas para a autoridade FMA/BodyParts3D.

O Browser E2E é dividido em quatro shards com responsabilidade explícita: `clinical-flow`, `document-ingestion`, `responsive-layout` e `supporting-contracts`. `synthetic-pilot.spec.ts` pertence ao `clinical-flow`. O CI executa `validate:browser-e2e-matrix`, que impede qualquer `tests/e2e/*.spec.ts` de ficar fora da matriz ou ser executado em duplicidade.

O CI adicional protege banco/organização, limites de repositório, publicação, share, anatomia, assets vendorizados, performance, ingestão, segurança, contrato OCR, contrato de IA, revisão, workflow, licenças, Atlas de referência, TypeScript, build e bundle budget. `validate:organization-runtime` também protege a SSOT de identidade demo. Budgets opcionais de PDF/OCR permanecem separados do core inicial.

## Critérios 3D-first para observação manual

Em qualquer cenário anatômico, observar:

- canvas real aparece onde há tarefa anatômica;
- estrutura confirmada continua visualmente distinguível de uma peça apenas inspecionada;
- rotação, zoom, vistas e reset parecem naturais;
- corpo completo permanece contexto primário quando um órgão detalhado é aberto;
- o órgão em detalhe nunca parece mudar sozinho a anatomia confirmada;
- o mesmo conceito confirmado acompanha Clinical Studio → preview → paciente;
- nenhuma copy sugere reconstrução individual do paciente;
- trocar de módulo não deixa sensação de canvas antigo ou contexto perdido;
- em 390 px, controles continuam tocáveis, legíveis e confortáveis.

## Fluxo manual sintético recomendado

Como a mecânica principal já possui aceite automatizado, o roteiro manual deve priorizar percepção e não repetição de checks técnicos.

Executar pelo menos um cenário completo em desktop profissional e depois conferir a experiência paciente em smartphone:

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
17. conferir Analytics e Equipe apenas como superfícies demo, sem esperar mutações de produção
```

Opcionalmente, quando houver suspeita concreta de regressão, repetir manualmente PDF textual, PDF escaneado/OCR ou PNG/JPEG. Não transformar isso em checklist obrigatório a cada iteração quando os gates automatizados estiverem verdes.

## O que registrar

Registrar apenas observações concretas de produto, por exemplo:

- importação local ficou clara ou pareceu upload para servidor?
- PDF escaneado/OCR deixou claro que o texto precisa de revisão humana?
- progresso/cancelamento pareceu compreensível?
- estrutura sugerida foi entendida como sugestão?
- houve algum momento em que exploração pareceu confirmação clínica?
- o 3D ajudou a entender a anatomia ou pareceu decorativo?
- houve confusão entre referência anatômica e corpo do paciente?
- a reconfirmação após mudar o laudo ficou inequívoca?
- a explicação ficou clara depois da revisão?
- paciente entendeu o que estava vendo?
- alguma etapa ficou escondida, duplicada ou desnecessariamente longa?
- houve overflow, controle sobreposto, alvo pequeno ou perda de contexto em 390 px?
- Analytics exibiu somente o que realmente aconteceu no demo?

Não registrar PHI nem dados clínicos reais.

## Evidência automatizada

A evidência de release deve sempre corresponder ao mesmo source candidato. Para qualificar um candidato de MVP sintético, registrar e conferir:

- CI completo verde, incluindo `validate:security-contract`, `validate:ocr-contract`, `validate:organization-runtime`, `validate:browser-e2e-matrix`, typecheck, build e bundle budget;
- Browser E2E **4/4** verde: `clinical-flow`, `document-ingestion`, `responsive-layout` e `supporting-contracts`;
- `clinical-flow` executando obrigatoriamente `synthetic-pilot.spec.ts`;
- `document-ingestion` executando obrigatoriamente `report-intake.spec.ts` e `scanned-pdf-ocr.spec.ts`;
- GitHub Pages verde para o mesmo source, incluindo verificação dos assets OCR same-origin e do fluxo publicado.

Não reutilizar uma execução antiga para declarar um source novo pronto.

## Critério de conclusão do MVP sintético

O MVP sintético está funcionalmente qualificado quando:

- CI, Browser E2E e Pages estão verdes para o source integrado correspondente;
- a jornada local intake → anatomia → 3D → explicação → revisão → paciente passa de ponta a ponta;
- alteração da fonte exige reconfirmação e invalida share obsoleto;
- portal e Clinical Studio permanecem coerentes entre desktop/mobile;
- nenhum dado sai da fronteira synthetic-only;
- nenhuma superfície promete diagnóstico automático, reconstrução individual ou backend inexistente.

O release `2f797c81ff24aabba51fb7aa06b76f0fcd6011fc` atende esses critérios automatizados. O piloto manual qualitativo existe para revelar atritos humanos P0/P1, não para mudar essa fronteira técnica sem evidência.

TXT/MD, PDF textual, PDF escaneado/image-only e PNG/JPEG com OCR local são capacidades reais do candidato sintético. Isso **não** autoriza dados reais.

## Produção clínica — etapa futura e separada

Dados reais continuam bloqueados até existir, no mínimo:

- backend dedicado;
- autenticação;
- isolamento cross-tenant/RLS provado;
- Storage privado e testes de negação;
- retenção/backup definidos;
- share de produção com expiração/revogação/auditoria;
- transporte seguro de convites;
- observabilidade e resposta a incidentes;
- revisão jurídica/privacidade para o uso pretendido;
- protocolo de piloto clínico controlado.

Esta fase não deve ser simulada no produto browser atual.
