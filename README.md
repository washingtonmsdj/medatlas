# MedAtlas

**SaaS de comunicação clínica visual 3D para clínicas, profissionais de saúde e pacientes.**

O MedAtlas transforma um trecho de laudo ou explicação clínica em uma experiência visual revisada pelo profissional:

```text
laudo / relatório
      ↓
triagem anatômica
      ↓
conceitos reais FMA / BodyParts3D
      ↓
confirmação explícita do profissional
      ↓
anatomia 3D interativa
      ↓
explicação em linguagem simples
      ↓
revisão clínica
      ↓
link do paciente
```

O produto não foi desenhado para emitir diagnóstico automático. A automação ajuda a localizar anatomia, preparar conteúdo e reduzir atrito; a autoridade de publicação continua sendo humana.

### 3D-first

O Human Atlas não é uma página isolada do MedAtlas: ele é a camada visual que acompanha o workflow anatômico.

Hoje a geometria real BodyParts3D aparece em:

- **Visão geral** — atendimento atual;
- **Pacientes** — contexto visual do relatório;
- **Relatórios visuais** — laudo/exame, contexto da consulta e Clinical 3D Workbench;
- **Atlas 3D** — explorer completo;
  - mantém recursos do Human Atlas de referência como camadas, picking, explode, marcadores, hover por peça no inventário, vistas e enquadramento respeitando os painéis;
  - estruturas compatíveis podem aprofundar para **Órgão em detalhe** sem perder o FMA/BodyParts3D selecionado;
- **preview pré-publicação** — o profissional vê o mesmo Human Atlas real antes de compartilhar;
- **link do paciente** — experiência simplificada com o mesmo engine.

`Equipe`, `Analytics` e `Configurações` não recebem canvas 3D por decoração: nessas telas não existe uma tarefa anatômica.

Consultas e exames não são módulos independentes no MVP; esse contexto pertence ao fluxo de **Relatórios visuais**.

O preview público do MVP está em:

`https://washingtonmsdj.github.io/medatlas/`

O workflow de Pages valida a publicação, os assets anatômicos e executa Playwright contra o site publicado.

## Estado atual

O MVP já possui:

- fluxo clínico em português;
- edição/colagem de texto de laudo;
- importação local de arquivo sintético .txt/.md (máx. 64 KB), sem upload;
- Relatórios visuais concentram ingestão local de laudo/exame e o contexto da consulta; PDF/imagem permanecem explicitamente bloqueados nesta fase;
- módulo Pacientes funcional no modo sintético, derivado do relatório atual e sem persistência paralela;
- triagem determinística de referências anatômicas;
- sugestões limitadas a conceitos que realmente existem no atlas;
- busca manual por conceitos FMA;
- Human Atlas / BodyParts3D real em Three.js;
- explorador Atlas 3D completo derivado diretamente do renderer do Human Atlas: 2.234 peças, sistemas, picking por estrutura, vistas, rotação, isolamento e explode;
- Dashboard, Pacientes, Relatórios visuais e página do paciente reutilizam o mesmo Human Atlas canônico em modo focado, com recorte de anatomia e somente os chunks necessários;
- navegação em dois níveis `Corpo → Órgão em detalhe`, com detalhe suplementar para cérebro, olho, coração, intestino, rins, fígado, pulmões, pâncreas e pele;
- os 9 GLBs detalhados ficam no próprio MedAtlas, são verificados por SHA-256 e carregados somente quando o usuário abre o detalhe;
- suporte a conceitos compostos e várias meshes;
- modos **Isolado**, **Sistema** e **Região**;
- cache de chunks anatômicos;
- 34,3 MB da closure Human Atlas + cerca de 30,0 MB de modelos detalhados vendorizados no próprio MedAtlas; o payload inicial continua limitado porque os órgãos detalhados são lazy-loaded;
- provenance + SHA-256 verificados no CI para Human Atlas e modelos detalhados;
- atribuição BodyParts3D CC BY 4.0 + Human Atlas MIT visível na UI clínica e na página do paciente;
- Browser E2E com Chromium cobrindo desktop, mobile e handoff ao paciente;
- gate axe/WCAG para violações serious/critical;
- piloto sintético guiado com critérios de aceite no dashboard;
- modo demo synthetic-only com shares locais expirando em 30 minutos;
- CSP e headers de segurança no deploy Vercel;
- explicação editável para o paciente;
- re-review obrigatório quando anatomia/texto muda;
- página separada do paciente usando o mesmo conceito 3D aprovado;
- tokens demo criptograficamente aleatórios;
- abstração assíncrona `ClinicalRepository`;
- máquina de estado fail-closed para o ciclo completo do relatório;
- contrato Supabase multi-tenant com RLS fail-closed em source;
- bucket clínico privado e modelo de auditoria;
- tokens de compartilhamento de produção definidos por hash, expiração e revogação;
- CI com `npm ci`, typecheck, build, contrato de banco e auditoria de dependências de produção.

Todos os pacientes, profissionais, clínicas e laudos exibidos atualmente são **dados sintéticos de demonstração**.

## Rodar localmente

Requer Node.js 22.13+.

```bash
npm ci
npm run dev
```

Abra:

```text
http://localhost:3016
```

Validação completa:

```bash
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

## Anatomia 3D

O MedAtlas fixa sua integração inicial ao Human Atlas no commit:

```text
1c38bf35c254a891200d3cedecfd57abebe83d8d
```

O renderer não usa iframe. O catálogo e as geometrias BodyParts3D são resolvidos semanticamente e renderizados dentro da aplicação.

Os arquivos necessários ao runtime estão em `public/atlas-assets/`. O runtime resolve esse diretório relativamente ao `BASE_URL` do Vite, permitindo deploy tanto na raiz quanto em subpaths como `/medatlas/`. Eles foram copiados do commit upstream fixado por um workflow reproduzível e possuem `SHA256SUMS` + `PROVENANCE.json`. O navegador não precisa buscar geometrias no repositório upstream durante o uso normal.

Nos cenários sintéticos atuais, o payload inicial de atlas fica aproximadamente entre **3,4 MB e 6,0 MB**, apesar da closure total vendorizada ter 34,3 MB, porque o renderer carrega somente os chunks necessários ao conceito selecionado.

Exemplo atual:

```text
“L4-L5”
   ↓
FMA16036
   ↓
Intervertebral disk of fourth lumbar vertebra
   ↓
BodyParts3D element FJ3216
   ↓
Three.js
```

A anatomia é **referência educacional**, não reconstrução do corpo individual do paciente.

### Profundidade de órgão

Quando a estrutura selecionada possui um modelo detalhado compatível, a interface
oferece uma segunda profundidade:

```text
Corpo completo / Human Atlas
        ↓
estrutura FMA confirmada
        ↓
Órgão em detalhe
        ↓
voltar ao corpo preservando a seleção
```

O detalhe é complementar. Ele não confirma FMA, não altera o relatório e não
substitui BodyParts3D como fonte de verdade clínica. Os arquivos ficam em
`public/organ-models/` e são carregados sob demanda.

## Triagem do laudo

O primeiro resolvedor de texto é deliberadamente determinístico.

Ele:

1. normaliza o texto;
2. procura aliases anatômicos conhecidos em português;
3. cruza com IDs existentes no atlas fixado;
4. também pode detectar nomes originais do catálogo;
5. retorna sugestões;
6. exige confirmação explícita antes de alterar o relatório.

A próxima camada de IA já possui um contrato técnico estrito em `src/clinical/structured-extraction.schema.json` e `src/clinical/structured-extraction.ts`. Um modelo poderá sugerir candidatos, mas a resposta só é aceita se passar pelo schema/runtime validator, exigir revisão clínica e cada FMA existir como conceito renderizável no atlas fixado.

O provedor remoto permanece explicitamente desativado enquanto o MVP não possui backend. Chaves de modelo não devem entrar no bundle Vite. Veja `docs/AI.md`.

## Dados e Supabase

O projeto ainda opera em modo demo no navegador.

O contrato de produção está em:

- `supabase/migrations/202609070001_medatlas_core.sql`
- `docs/SECURITY.md`
- `docs/ARCHITECTURE.md`
- `docs/RELEASE_READINESS.md`

Ele define:

- organizações/tenants;
- membros e papéis;
- profissionais;
- pacientes;
- consultas;
- relatórios visuais;
- documentos clínicos;
- compartilhamentos;
- auditoria;
- RLS em todas as tabelas de aplicação;
- Storage privado;
- token de paciente armazenado somente como SHA-256.

O backend Supabase **não é ativado silenciosamente** só porque variáveis de ambiente existem. A troca do adaptador demo pelo adaptador Supabase ocorrerá somente depois de migration + testes de isolamento.

Enquanto isso, o modo atual é explicitamente **synthetic-only**. Não deve receber dados reais de pacientes. Os links de demonstração expiram automaticamente em 30 minutos e a persistência local é limitada.

## Segurança

Alguns invariantes já são gates permanentes:

- nenhuma publicação com revisão pendente;
- nenhum token previsível;
- nenhum ID de paciente em URL de compartilhamento;
- nenhum grant amplo para `anon`;
- nenhuma tabela clínica sem RLS;
- nenhum documento clínico em bucket público;
- nenhuma IA pode publicar diretamente;
- dados demo não devem compartilhar projeto/storage com dados clínicos reais.

Veja `docs/SECURITY.md` e `docs/PILOT.md`.

## Deploy

### Vercel

`vercel.json` está pronto e usa `npm ci`.

O workflow manual `.github/workflows/preview-artifact.yml` gera um pacote
estático de preview pequeno, sem duplicar os binários anatômicos. O checkpoint
atual e as provas de deploy estão em `docs/RELEASE_READINESS.md`.

### GitHub Pages

O preview público está ativo em:

```text
https://washingtonmsdj.github.io/medatlas/
```

O workflow `.github/workflows/pages.yml` publica a aplicação, valida shell/assets anatômicos e executa Playwright contra o deploy real, incluindo canvas Human Atlas nas superfícies 3D-first, no preview pré-publicação e no portal do paciente.

## Licenças e provenance

- Human Atlas: MIT.
- BodyParts3D 4.0: CC BY 4.0.
- `thebuggeddev/anatomy`: integração e modelos detalhados sob permissão específica registrada em `docs/UPSTREAM_ANATOMY.md`; não é tratada como licença open-source geral.

Veja:

- `THIRD_PARTY_NOTICES.md`
- `third_party/human-atlas/LICENSE`
- `third_party/human-atlas/PROVENANCE.md`

## Roadmap

O plano executável e continuamente atualizado está em:

`URGENTE.md`

As próximas frentes são:

1. concluir o piloto sintético/manual no preview público e corrigir UX observada;
2. preparar critérios do piloto clínico controlado;
3. somente depois, projeto Supabase exclusivo do MedAtlas;
4. provas de isolamento multi-tenant + autenticação;
5. adapter Supabase do `ClinicalRepository`;
6. ativar provedor de IA somente atrás do backend e dos gates já definidos.
