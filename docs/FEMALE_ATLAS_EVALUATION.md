# MedAtlas — avaliação de anatomia feminina

## Objetivo

Avaliar a incorporação de uma referência anatômica feminina sem criar uma segunda verdade clínica, sem substituir o Human Atlas/BodyParts3D já qualificado e sem promover modelos reconstruídos/estimados a autoridade anatômica.

Esta etapa é **avaliação**, não mudança de runtime.

## Fonte prioritária

A fonte anatômica feminina a ser avaliada diretamente é o **Human Reference Atlas / HuBMAP — 3D Reference Organ Set for Female v1.5**.

- Dataset: `https://lod.humanatlas.io/ref-organ/united-female/v1.5`
- DOI: `https://doi.org/10.48539/HBM352.BTSQ.586`
- Licença: CC BY 4.0, conforme a atribuição da fonte registrada em `docs/UPSTREAM_ANATOMY_SOURCES.md`.

`wiiiimm/human-atlas` permanece uma referência de implementação/evidência para avaliação, mas seu **female reconstructed study model não é candidato a autoridade clínica**: ele é descrito upstream como experimental e estimado.

## Arquitetura alvo

A evolução deve manter uma única autoridade semântica de anatomia no MedAtlas:

```text
fonte anatômica feminina HRA/HuBMAP
        ↓
adapter de ingestão/proveniência
        ↓
mapeamento MedAtlas ↔ FMA/source IDs
        ↓
manifesto validado
        ↓
pipeline próprio de composição/otimização
        ↓
Human Atlas runtime
```

O adapter deve preservar, quando disponíveis:

- identificador da fonte;
- identificador FMA/ontológico mapeado;
- nome original e nome canônico MedAtlas;
- relação entre conceito e meshes;
- versão da fonte;
- licença/atribuição;
- origem e SHA-256 dos artefatos importados.

Não criar um `FemaleAtlas` paralelo nem duplicar o resolver, renderer ou estado de seleção.

## Critérios de aceitação para qualquer integração

1. **Autoridade única** — Explorer, Clinical Studio e Patient continuam usando a mesma autoridade semântica.
2. **FMA/source IDs preservados** — nenhum mesh feminino pode ser confirmado apenas por nome ou posição visual.
3. **Proveniência completa** — cada artefato importado é rastreável à fonte e ao checkpoint exato.
4. **Licença verificável** — atribuição e termos ficam registrados antes de qualquer publicação.
5. **Sem modelo estimado como verdade** — modelos reconstruídos/estimados permanecem explicitamente fora da autoridade clínica.
6. **Renderabilidade** — seleção confirmada deve possuir geometria válida ou falhar fechado; ausência de detalhe suplementar não invalida a confirmação.
7. **Performance** — payload, número de meshes, memória e tempo de carregamento devem permanecer dentro de budgets definidos por evidência, sem degradar o atlas masculino qualificado.
8. **Isolamento de regressão** — o atlas masculino atual permanece inalterado até a nova closure passar todos os gates.
9. **Patient-safe** — a interface não apresenta IDs técnicos como conteúdo primário nem sugere reconstrução individual da paciente.
10. **Reversibilidade** — assets antigos permanecem disponíveis enquanto o novo conjunto é qualificado.

## Plano de execução

### Fase A — inventário

- obter o manifesto/lista oficial do HRA feminino v1.5;
- registrar quantidade de meshes/nodes e identificadores de origem;
- classificar estruturas por cobertura e por necessidade de mapeamento FMA;
- identificar estruturas sem equivalente direto no catálogo atual.

### Fase B — mapeamento

- construir uma tabela de correspondência source ID → FMA/MedAtlas;
- marcar explicitamente `mapped`, `unmapped` e `ambiguous`;
- impedir confirmação de entradas `unmapped`/`ambiguous`;
- manter os IDs de origem para auditoria.

### Fase C — pipeline próprio

- importar somente artefatos qualificados;
- gerar manifest/provenance e SHA-256;
- aplicar compressão/chunking seguindo a arquitetura atual;
- evitar dependência de fetch remoto durante o uso normal;
- medir budgets de bundle, rede e memória.

### Fase D — integração controlada

- adicionar a referência feminina por configuração de composição, não por renderer paralelo;
- validar seleção, foco, contexto e retorno ao corpo completo;
- testar Clinical Studio e Patient com a mesma seleção semântica;
- executar CI + Browser E2E + Pages antes de considerar release.

### Fase E — qualificação

A integração só pode virar release quando houver evidência para:

- provenance/licença;
- anatomia/FMA;
- integridade dos assets;
- performance;
- segurança/privacy;
- Browser E2E 4/4;
- Pages com assets publicados e same-origin;
- ausência de regressão no atlas masculino.

## O que não fazer

- não apontar o navegador diretamente para o GLB do HRA em produção;
- não copiar o female reconstructed study model do `wiiiimm/human-atlas` como autoridade;
- não criar IDs FMA artificiais;
- não fazer fallback silencioso de conceito feminino para um mesh masculino semanticamente diferente;
- não alterar o pin masculino atual durante a avaliação;
- não transformar uma avaliação visual em validação clínica.

## Decisão atual

**Não integrar ainda.** O próximo trabalho técnico é obter e validar o inventário oficial HRA feminino v1.5 e construir o mapeamento source ID → FMA/MedAtlas antes de importar qualquer geometria para `public/atlas-assets/`.

Até essa qualificação, o release masculino BodyParts3D/FMA continua sendo a autoridade canônica do runtime.
