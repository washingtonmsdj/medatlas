# MedAtlas — piloto sintético

## Objetivo

Validar o MVP de ponta a ponta sem dados reais e sem depender do backend ativo.

O piloto sintético existe para responder:

- o profissional consegue entrar no contexto correto de organização/workspace?
- o profissional consegue iniciar um relatório do zero?
- o texto clínico encontra anatomia conhecida?
- a estrutura precisa ser confirmada explicitamente?
- a explicação permanece bloqueada até revisão?
- o link do paciente só nasce depois do gate humano?
- a página do paciente abre com a mesma anatomia?
- abrir o link realmente aparece no Analytics local?
- papéis/permissões continuam legíveis e sem mutações fake?
- branding e contexto da clínica chegam ao paciente sem confundir anatomia de referência com reconstrução individual?
- mobile, acessibilidade, expiração e performance continuam dentro dos gates?

## Cenários canônicos

| Cenário | Conceito esperado |
| --- | --- |
| Coluna lombar | FMA16036 |
| Rim | FMA7203 |
| Coração | FMA7088 |
| Ombro / supraespinal | FMA9629 |

A SSOT dos textos e IDs é:

`src/clinical/demo-scenarios.json`

## Contexto SaaS sintético canônico

O piloto atual também exercita uma organização fictícia:

```text
Clínica Horizonte
└── Unidade principal
    ├── Ortopedia
    ├── Cardiologia
    └── Fisioterapia
```

Papéis source-first usados na superfície Equipe:

- `admin`;
- `clinician`;
- `staff`.

Esses papéis precisam continuar espelhando as policies SQL. O modo demo não pode habilitar convites, alteração de papel ou persistência de membership.

## Aceite automatizado

O Browser E2E cobre:

1. os quatro cenários anatômicos acima;
2. criação de relatório visual vazio;
3. sugestão anatômica;
4. confirmação explícita;
5. rascunho educacional;
6. revisão;
7. publicação;
8. abertura da visão do paciente;
9. contagem observável da abertura no Analytics local;
10. organização/workspace ativo e troca local de especialidade;
11. Equipe com matriz de permissões source-first;
12. branding da clínica presente sem mutações fake;
13. contrato visual de convites com transporte bloqueado;
14. mobile sem overflow horizontal;
15. link demo expirado falhando fechado;
16. axe/WCAG nas superfícies principais;
17. Human Atlas completo e modo clínico focado usando o mesmo engine canônico.

CI adicional cobre:

- contrato do banco;
- RLS source-first;
- convites de organização com token hash, admin gate, e-mail vinculado, expiração/revogação e auditoria;
- anatomia curada;
- cenário → FMA;
- integridade SHA-256 dos assets;
- budget de payload;
- privacy/security;
- analytics demo sem telemetria externa;
- contrato de IA;
- gate de revisão clínica;
- licenças/proveniência.

## Critérios 3D-first do piloto

Em qualquer cenário anatômico, validar explicitamente:

- o canvas real aparece no Dashboard/contexto atual, módulo clínico correspondente, preview pré-publicação e portal do paciente;
- o 3D é visualmente dominante onde existe tarefa anatômica e não vira um thumbnail decorativo;
- rotação por arraste, zoom e vistas 3/4/frente/lado respondem sem quebrar o layout;
- o mesmo conceito FMA confirmado acompanha profissional → preview → paciente;
- o deploy não apresenta erro de `atlas.json`, chunk, descompressão ou WebGL;
- mudar o laudo/anatomia reabre a confirmação e exibe **reconfirmação anatômica necessária** enquanto a referência anterior ainda estiver visível;
- nenhum texto sugere que BodyParts3D seja reconstrução ou “corpo/modelo do paciente”;
- em 390 px, os controles clínicos de câmera permanecem horizontais, legíveis e sem overflow;
- trocar de módulo não mantém canvases/renderers anteriores vivos.

## Fluxo manual sintético recomendado

Executar pelo menos um cenário completo em desktop e mobile:

```text
1. abrir Visão geral
2. confirmar organização/workspace ativo
3. abrir Relatórios visuais
4. carregar cenário sintético
5. sugerir anatomia
6. confirmar estrutura
7. validar o 3D focado
8. gerar rascunho educacional
9. revisar explicitamente
10. pré-visualizar paciente
11. publicar link demo
12. abrir visão do paciente
13. confirmar branding + 3D + explicação + perguntas
14. voltar ao ambiente clínico
15. abrir Analytics
16. confirmar que a visualização foi observada
17. abrir Equipe
18. confirmar papéis, unidade/workspaces e boundary de convites
```

Registrar somente observações de produto, por exemplo:

- estrutura encontrada foi a esperada?
- explicação ficou compreensível?
- profissional entendeu quando precisava confirmar?
- houve confusão entre anatomia de referência e corpo do paciente?
- página do paciente ficou clara?
- organização/workspace ficaram compreensíveis sem parecer complexidade desnecessária?
- papéis da Equipe ficaram compreensíveis?
- usuário entende que convites estão source-ready, mas ainda não ativos?
- Analytics comunica somente eventos realmente observados?
- qual etapa pareceu lenta ou desnecessária?

Não registrar nomes reais, exames reais ou qualquer identificador real.

## Critério de conclusão do piloto sintético

O piloto sintético automatizado pode ser considerado concluído quando:

- CI completo passa no mesmo baseline funcional;
- Browser E2E passa o fluxo clínico, paciente, organização, Equipe e Analytics;
- gate responsivo passa em desktop e mobile;
- nenhuma violação axe serious/critical é introduzida;
- nenhum caminho demo transmite dados para telemetria externa;
- nenhum botão de produção cria a falsa impressão de backend ativo;
- BodyParts3D continua identificado como anatomia de referência.

Isso **não autoriza dados reais**.

## Etapa clínica controlada — futura

Permanece bloqueada até:

- backend dedicado;
- autenticação;
- migrations aplicadas no projeto de produção;
- testes reais de isolamento cross-tenant;
- RLS provada por papel;
- Storage privado;
- política de retenção;
- compartilhamentos de produção;
- transporte seguro de convites;
- revisão jurídica/privacidade para o uso pretendido;
- protocolo de suporte/incidente;
- definição formal do escopo do piloto.

Essa fase não está concluída e não deve ser simulada no produto.
