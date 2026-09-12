# MedAtlas — piloto sintético do MVP

## Objetivo

Validar o MedAtlas de ponta a ponta **sem dados reais** e sem depender de backend clínico ativo. O piloto mede clareza de tarefa, qualidade do 3D, ingestão documental local, gates humanos, responsividade e confiança do fluxo profissional → paciente.

Ele não autoriza uso clínico real nem substitui validação de segurança, privacidade ou compliance.

## Perguntas que o piloto deve responder

- O profissional entende rapidamente onde iniciar e continuar um relatório?
- O texto digitado, TXT/MD ou texto extraído de PDF entra no mesmo editor antes de qualquer interpretação?
- Um PDF inválido, grande demais, protegido, malformado ou sem texto falha de forma clara sem apagar o texto válido anterior?
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
- `.pdf` textual, com até **8 MiB**, **50 páginas** e **64 KiB de texto extraído**.

PDF usa PDF.js `6.3.289` com parser/worker local e lazy. Extensão, MIME, assinatura `%PDF-`, tamanho, páginas, senha, malformação e ausência de texto extraível falham fechado. O texto extraído entra no editor e **não executa automaticamente `Encontrar anatomia`**.

Imagem e OCR, incluindo PDF escaneado sem camada textual, continuam fora desta fase. O produto deve comunicar isso explicitamente, não simular OCR nem enviar documentos a serviço remoto.

Durante o piloto, nunca usar nomes, exames, identificadores ou qualquer dado real de paciente.

## Aceite automatizado

O Browser E2E protege, entre outros pontos:

1. cenários anatômicos determinísticos;
2. criação de relatório vazio fail-closed;
3. TXT/MD, limite de 64 KiB, MIME incompatível e UTF-8 inválido;
4. PDF textual real, MIME, assinatura, malformação, ausência de texto e arquivo >8 MiB;
5. preservação do último texto válido após falha de ingestão;
6. ausência de análise anatômica automática após importação;
7. sugestão e confirmação anatômica explícita;
8. Human Atlas real no fluxo profissional e paciente;
9. rascunho educacional, revisão e publicação;
10. preview pré-publicação e link temporário;
11. expiração/revogação de share;
12. Analytics local;
13. shell profissional separado da experiência paciente;
14. Equipe/permissões sem mutações fake;
15. axe/WCAG;
16. ausência de overflow e hit areas protegidas em desktop/mobile;
17. arquitetura de profundidade `Corpo → Órgão em detalhe`;
18. um único engine Human Atlas para a autoridade FMA/BodyParts3D.

O CI adicional protege banco/organização, limites de repositório, publicação, share, anatomia, assets vendorizados, performance, ingestão, segurança, contrato de IA, revisão, workflow, licenças, Atlas de referência, TypeScript, build e bundle budget. O budget do PDF permanece separado do core inicial.

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
8. opcionalmente testar PDF >8 MiB ou PDF sem texto e confirmar rejeição fail-closed
9. executar “Encontrar anatomia”
10. confirmar que a estrutura esperada aparece como sugestão, sem confirmação automática
11. confirmar explicitamente a anatomia
12. validar enquadramento, rotação, zoom, vistas e picking no 3D
13. abrir/fechar órgão em detalhe quando aplicável e confirmar que “Corpo” segue como contexto primário
14. gerar o rascunho educacional
15. revisar/editar e aprovar explicitamente
16. abrir a prévia do paciente e retornar pela única ação “Voltar ao profissional”
17. publicar o link demo
18. abrir o link do paciente e validar branding + 3D + explicação revisada + perguntas
19. confirmar linguagem de anatomia de referência no portal
20. voltar ao ambiente clínico e alterar o laudo
21. confirmar reconfirmação anatômica obrigatória e invalidação das etapas dependentes
22. abrir Analytics e verificar a visualização observada
23. abrir Equipe e confirmar papéis/limites sem mutações de produção
```

## O que registrar

Registrar apenas observações concretas de produto, por exemplo:

- importação local ficou clara ou pareceu upload para servidor?
- PDF textual foi extraído de forma compreensível?
- erro de PDF preservou corretamente o texto anterior?
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

## Evidência automatizada mais recente

Runtime/distribuição PDF: `a95458a8ccb34f99eddbe656f6324088aa88b52a`.  
HEAD final de regressão: `1b8ae472ba42a83aad59d0ab407c9f3c9ce7342f`.

- CI `34714504072` — **PASS completo**.
- Browser E2E `34714504043` — **PASS completo** nos shards `clinical-flow`, `responsive-layout` e `supporting-contracts`.
- GitHub Pages Preview `34708932045` — **PASS**, incluindo PDF real publicado e resolução do worker em `/medatlas/assets/`.

Esse conjunto qualifica o browser MVP para o **piloto manual sintético com ingestão TXT/MD/PDF textual**. Ele não qualifica o produto para dados reais nem para OCR.

## Critério de conclusão do MVP sintético

O candidato pode avançar na avaliação de MVP quando:

- CI, Browser E2E e Pages estiverem verdes para o source funcional correspondente;
- piloto manual sintético não revelar bloqueador P0;
- fluxo laudo → anatomia → confirmação → 3D → explicação → revisão → paciente funcionar sem atalhos fake;
- portal e Clinical Studio permanecerem coerentes entre desktop/mobile;
- nenhum dado sair da fronteira synthetic-only;
- nenhuma superfície prometer diagnóstico automático, reconstrução individual, imagem/OCR ou backend inexistente.

PDF textual local é capacidade real do candidato; **PDF escaneado/imagem ainda não é**.

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
