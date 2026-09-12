# MedAtlas — piloto sintético do MVP

## Objetivo

Validar o MedAtlas de ponta a ponta **sem dados reais** e sem depender de backend clínico ativo. O piloto mede clareza de tarefa, qualidade do 3D, ingestão documental local, gates humanos, responsividade e confiança do fluxo profissional → paciente.

Ele não autoriza uso clínico real nem substitui validação de segurança, privacidade ou compliance.

## Perguntas que o piloto deve responder

- O profissional entende rapidamente onde iniciar e continuar um relatório?
- O texto digitado, TXT/MD, texto extraído de PDF ou OCR local entra no mesmo editor antes de qualquer interpretação?
- Um PDF inválido, grande demais, protegido, malformado ou cujo OCR não produza texto útil falha de forma clara sem apagar o texto válido anterior?
- Um PDF escaneado mostra progresso/cancelamento de OCR e respeita os limites de páginas e rasterização?
- Uma imagem inválida, grande demais ou com dimensões/pixels excessivos falha antes do OCR e preserva o texto válido anterior?
- O progresso/cancelamento do OCR é compreensível e o resultado permanece editável?
- O texto do laudo encontra uma estrutura anatômica plausível sem afirmar diagnóstico?
- A anatomia só é adotada depois de confirmação explícita?
- O Human Atlas 3D permanece dominante e útil, não decorativo?
- Exploração temporária de uma peça fica distinta da anatomia clinicamente confirmada?
- A explicação ao paciente permanece bloqueada até a revisão necessária?
- A prévia do paciente é claramente separada da interface profissional?
- O link só nasce depois do gate humano e abre a mesma anatomia revisada?
- O paciente entende que vê anatomia humana de referência, não uma reconstrução do próprio corpo?
- Analytics mostra somente eventos realmente observados no demo local?
- Desktop profissional e smartphone do paciente continuam operáveis sem overflow ou controles sobrepostos?

## Cenários anatômicos canônicos

| Cenário | Conceito esperado |
| --- | --- |
| Coluna lombar | FMA16036 |
| Rim | FMA7203 |
| Coração | FMA7088 |
| Ombro / supraespinal | FMA9629 |

A SSOT dos textos e IDs é `src/clinical/demo-scenarios.json`.

## Contexto SaaS sintético

O preview usa uma organização fictícia e um workspace clínico fixo. O contexto ativo aparece como informação do produto; **não existe troca fake de organização/workspace no shell atual**.

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
15. Analytics local;
16. shell profissional separado da experiência paciente;
17. Equipe/permissões sem mutações fake;
18. axe/WCAG;
19. ausência de overflow e hit areas protegidas em desktop/mobile;
20. arquitetura de profundidade `Corpo → Órgão em detalhe`;
21. um único engine Human Atlas para a autoridade FMA/BodyParts3D.

O Browser E2E é dividido em quatro shards com responsabilidade explícita: `clinical-flow`, `document-ingestion`, `responsive-layout` e `supporting-contracts`. O CI executa `validate:browser-e2e-matrix`, que impede qualquer `tests/e2e/*.spec.ts` de ficar fora da matriz ou ser executado em duplicidade.

O CI adicional protege banco/organização, limites de repositório, publicação, share, anatomia, assets vendorizados, performance, ingestão, segurança, contrato OCR, contrato de IA, revisão, workflow, licenças, Atlas de referência, TypeScript, build e bundle budget. Budgets opcionais de PDF/OCR permanecem separados do core inicial.

## Critérios 3D-first

Em qualquer cenário anatômico, validar manualmente:

- canvas real aparece onde há tarefa anatômica;
- estrutura confirmada continua visualmente distinguível de uma peça apenas inspecionada;
- rotação, zoom, vistas e reset não quebram layout;
- corpo completo permanece contexto primário quando um órgão detalhado é aberto;
- o órgão em detalhe nunca muda sozinho a anatomia confirmada;
- o mesmo conceito confirmado acompanha Clinical Studio → preview → paciente;
- nenhuma copy sugere reconstrução individual do paciente;
- trocar de módulo não deixa renderers/canvases antigos interferindo na interface;
- em 390 px, controles continuam tocáveis, legíveis e sem overflow.

## Fluxo manual sintético recomendado

Executar pelo menos um cenário completo em desktop profissional e depois conferir a experiência paciente em smartphone:

```text
1. abrir Visão geral
2. confirmar clínica/workspace exibidos como contexto informativo
3. iniciar Novo relatório pela busca global ou ação canônica do dashboard
4. colar um texto sintético válido e confirmar que “Encontrar anatomia” habilita
5. tentar texto >64 KiB e confirmar erro + preservação do texto válido + análise bloqueada
6. voltar a texto válido e importar opcionalmente um .txt/.md sintético
7. importar um PDF textual sintético e confirmar:
   - nome/páginas/bytes extraídos visíveis
   - texto aparece no editor
   - nenhuma anatomia é analisada automaticamente
8. importar um PDF escaneado sintético e confirmar:
   - progresso de OCR por página aparece
   - texto reconhecido entra no editor e continua editável
   - nenhuma anatomia é analisada automaticamente
9. opcionalmente testar PDF >8 MiB, PDF OCR >8 páginas ou PDF sem texto reconhecível e confirmar rejeição fail-closed
10. importar um PNG/JPEG sintético com texto e confirmar:
   - progresso de OCR local aparece
   - texto reconhecido entra no editor e continua editável
   - nenhuma anatomia é analisada automaticamente
11. opcionalmente testar imagem inválida, >6 MiB ou dimensões excessivas e confirmar preservação do texto anterior
12. executar “Encontrar anatomia”
13. confirmar que a estrutura esperada aparece como sugestão, sem confirmação automática
14. confirmar explicitamente a anatomia
15. validar enquadramento, rotação, zoom, vistas e picking no 3D
16. abrir/fechar órgão em detalhe quando aplicável e confirmar que “Corpo” segue como contexto primário
17. gerar o rascunho educacional
18. revisar/editar e aprovar explicitamente
19. abrir a prévia do paciente e retornar pela única ação “Voltar ao profissional”
20. publicar o link demo
21. abrir o link do paciente e validar branding + 3D + explicação revisada + perguntas
22. confirmar linguagem de anatomia de referência no portal
23. voltar ao ambiente clínico e alterar o laudo
24. confirmar reconfirmação anatômica obrigatória e invalidação das etapas dependentes
25. abrir Analytics e verificar a visualização observada
26. abrir Equipe e confirmar papéis/limites sem mutações de produção
```

## O que registrar

Registrar apenas observações concretas de produto, por exemplo:

- importação local ficou clara ou pareceu upload para servidor?
- PDF textual foi extraído de forma compreensível?
- PDF escaneado deixou claro que o OCR é local e precisa de revisão humana?
- OCR de imagem deixou claro que o texto precisa de revisão humana?
- progresso/cancelamento do OCR ficou compreensível?
- erro de arquivo preservou corretamente o texto anterior?
- estrutura sugerida foi a esperada?
- houve algum momento em que exploração pareceu confirmação clínica?
- o 3D ajudou a entender a anatomia ou pareceu decorativo?
- houve confusão entre referência anatômica e corpo do paciente?
- a reconfirmação após mudar o laudo ficou inequívoca?
- a explicação ficou clara depois da revisão?
- paciente entendeu o que estava vendo?
- alguma etapa ficou escondida, duplicada ou desnecessariamente longa?
- houve overflow, controle sobreposto, alvo pequeno ou perda de contexto em 390 px?
- Analytics exibiu apenas eventos realmente realizados?

Não registrar PHI nem dados clínicos reais.

## Evidência automatizada

A evidência de release deve sempre corresponder ao mesmo source candidato. Para qualificar um candidato de MVP sintético, registrar e conferir:

- CI completo verde, incluindo `validate:security-contract`, `validate:ocr-contract`, `validate:browser-e2e-matrix`, typecheck, build e bundle budget;
- Browser E2E **4/4** verde: `clinical-flow`, `document-ingestion`, `responsive-layout` e `supporting-contracts`;
- `document-ingestion` executando obrigatoriamente `report-intake.spec.ts` e `scanned-pdf-ocr.spec.ts`;
- GitHub Pages verde para o mesmo source, incluindo verificação dos assets OCR same-origin e do fluxo publicado.

Não reutilizar uma execução antiga para declarar um source novo pronto.

## Critério de conclusão do MVP sintético

O candidato pode avançar na avaliação de MVP quando:

- CI, Browser E2E e Pages estiverem verdes para o source funcional correspondente;
- piloto manual sintético não revelar bloqueador P0;
- fluxo laudo → anatomia → confirmação → 3D → explicação → revisão → paciente funcionar sem atalhos fake;
- portal e Clinical Studio permanecerem coerentes entre desktop/mobile;
- nenhum dado sair da fronteira synthetic-only;
- nenhuma superfície prometer diagnóstico automático, reconstrução individual ou backend inexistente.

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
