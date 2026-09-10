# MedAtlas — piloto sintético do MVP

## Objetivo

Validar o MedAtlas de ponta a ponta **sem dados reais** e sem depender de backend clínico ativo. O piloto mede clareza de tarefa, qualidade do 3D, gates humanos, responsividade e confiança do fluxo profissional → paciente.

Ele não autoriza uso clínico real nem substitui validação de segurança, privacidade ou compliance.

## Perguntas que o piloto deve responder

- O profissional entende rapidamente onde iniciar e continuar um relatório?
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

O browser MVP aceita somente:

- texto digitado/colado;
- `.txt`;
- `.md`;
- no máximo **64 KiB medidos em bytes UTF-8**.

O limite é compartilhado pelo importador, pelo editor e pelo controlador do fluxo. PDF, imagem e OCR continuam fora desta fase e não devem ser simulados.

Durante o piloto, nunca usar nomes, exames, identificadores ou qualquer dado real de paciente.

## Aceite automatizado

O Browser E2E protege, entre outros pontos:

1. cenários anatômicos determinísticos;
2. criação de relatório vazio fail-closed;
3. importação TXT/MD e limite de 64 KiB;
4. sugestão e confirmação anatômica explícita;
5. Human Atlas real no fluxo profissional e paciente;
6. rascunho educacional, revisão e publicação;
7. preview pré-publicação e link temporário;
8. expiração/revogação de share;
9. Analytics local;
10. shell profissional separado da experiência paciente;
11. Equipe/permissões sem mutações fake;
12. axe/WCAG;
13. ausência de overflow e hit areas protegidas em desktop/mobile;
14. arquitetura de profundidade `Corpo → Órgão em detalhe`;
15. um único engine Human Atlas para a autoridade FMA/BodyParts3D.

O CI adicional protege banco/organização, limites de repositório, publicação, share, anatomia, assets vendorizados, performance, segurança, contrato de IA, revisão, workflow, licenças, Atlas de referência, TypeScript, build e bundle budget.

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
5. tentar um texto sintético > 64 KiB e confirmar: erro visível + texto válido anterior preservado + análise bloqueada
6. voltar a um texto válido; opcionalmente importar um .txt/.md sintético
7. executar “Encontrar anatomia”
8. confirmar que a estrutura esperada aparece como sugestão, sem confirmação automática
9. confirmar explicitamente a anatomia
10. validar enquadramento, rotação, zoom, vistas e picking no 3D
11. abrir/fechar órgão em detalhe quando aplicável e confirmar que “Corpo” segue como contexto primário
12. gerar o rascunho educacional
13. revisar/editar e aprovar explicitamente
14. abrir a prévia do paciente e retornar pela única ação “Voltar ao profissional”
15. publicar o link demo
16. abrir o link do paciente e validar branding + 3D + explicação revisada + perguntas
17. confirmar linguagem de anatomia de referência no portal
18. voltar ao ambiente clínico e alterar o laudo
19. confirmar reconfirmação anatômica obrigatória e invalidação das etapas dependentes
20. abrir Analytics e verificar a visualização observada
21. abrir Equipe e confirmar papéis/limites sem mutações de produção
```

## O que registrar

Registrar apenas observações concretas de produto, por exemplo:

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

Source funcional desta atualização: `b5c2ca3d5c332432f7417513b19d1f8d06b290fe`.

- CI `34481648367` — **PASS completo**.
- Browser E2E `34481648442` — **PASS completo** nos shards `clinical-flow`, `responsive-layout` e `supporting-contracts`.
- GitHub Pages Preview `34481648389` — **PASS** em build, deploy, verificação de shell/assets e Chromium remoto do fluxo clínico 3D.

Esse conjunto qualifica o browser MVP para o **piloto manual sintético** descrito acima. Ele não qualifica o produto para dados reais.

## Critério de conclusão do MVP sintético

O candidato pode avançar na avaliação de MVP quando:

- CI, Browser E2E e Pages estiverem verdes sobre o mesmo source funcional;
- piloto manual sintético não revelar bloqueador P0;
- fluxo laudo → anatomia → confirmação → 3D → explicação → revisão → paciente funcionar sem atalhos fake;
- portal e Clinical Studio permanecerem coerentes entre desktop/mobile;
- nenhum dado sair da fronteira synthetic-only;
- nenhuma superfície prometer diagnóstico automático, reconstrução do paciente, PDF/OCR ou backend inexistente.

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
