# MedAtlas — inventário inicial da fonte feminina HRA/HuBMAP v1.5

## Status

**Avaliação técnica — sem integração de runtime.**

Este documento registra somente evidências públicas verificáveis e separa claramente o que já foi confirmado do que ainda precisa ser obtido diretamente do artefato/manifesto oficial antes de qualquer importação para `public/atlas-assets/`.

## Fonte primária

- Digital Object: `united-female/v1.5`
- Dataset: `https://lod.humanatlas.io/ref-organ/united-female/v1.5`
- DOI: `https://doi.org/10.48539/HBM352.BTSQ.586`
- GLB canônico informado pela distribuição HRA: `https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb`
- Metadata informado pela distribuição HRA: `https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/metadata.json`
- Licença registrada no checkpoint atual: CC BY 4.0.

A publicação independente no NIH 3D confirma um modelo **Body, Female**, criado por HRA, associado à coleção Human Reference Atlas 3D Reference Object Library, com o arquivo `3d-vh-f-united.glb`. A página também identifica a origem no Visible Human Dataset. citeturn3search0turn3search2

## Evidência já confirmada

| Campo | Estado | Evidência |
|---|---|---|
| Fonte HRA/HuBMAP | confirmado | Digital Object `united-female/v1.5` e publicação NIH 3D |
| Versão | confirmado | `v1.5` |
| Artefato GLB | confirmado | `3d-vh-f-united.glb` |
| Coleção | confirmado | Human Reference Atlas 3D Reference Object Library |
| Origem declarada | confirmado | Visible Human Female / Visible Human Dataset |
| Licença de distribuição | registrada | CC BY 4.0 |
| DOI | confirmado | `10.48539/HBM352.BTSQ.586` |
| Quantidade exata de nodes | **pendente de validação direta** | Não inferir de fontes derivadas |
| Quantidade exata de meshes | **pendente de validação direta** | Não inferir de fontes derivadas |
| IDs ontológicos completos | **pendente de validação direta** | Deve vir do metadata/GLB oficial |
| SHA-256 do artefato | **pendente** | Deve ser calculado sobre o arquivo efetivamente importado |
| Mapeamento FMA → source node | **pendente** | Precisa de tabela auditável |

## Regra de contagem

Não vamos usar números publicados por projetos de terceiros como verdade do artefato HRA. Há implementações independentes que relatam 888 nodes e constroem tabelas de mapeamento próprias; isso é útil como pista de avaliação, mas não substitui a inspeção do GLB/metadata oficial. citeturn2search0

Portanto, `888` é tratado no MedAtlas como **hipótese a conferir**, não como metadado canônico.

## Primeira matriz de qualificação

Antes de importar qualquer geometria, a coleta precisa produzir uma linha por estrutura com pelo menos:

```text
source_node_id
source_label
source_ontology_id
source_version
source_asset
medatlas_concept_id
fma_id
mapping_status
mapping_evidence
license
attribution
asset_sha256
mesh_count
triangle_count
bounds
notes
```

`mapping_status` só pode ser:

- `mapped` — correspondência determinada e documentada;
- `unmapped` — não existe correspondência aprovada;
- `ambiguous` — existem candidatos e não há evidência suficiente para escolher.

Somente `mapped` poderá entrar no catálogo clínico. `unmapped` e `ambiguous` devem permanecer fora da confirmação anatômica.

## Pontos de atenção encontrados na avaliação externa

Uma implementação independente de seleção do mesmo HRA v1.5 demonstra que a fonte contém casos que exigem julgamento explícito: estruturas sem termo adequado no padrão adotado, nomes conflitantes e estruturas que não deveriam ser promovidas apenas por inferência geométrica. Isso reforça a necessidade de preservar o `source_node_id` e registrar decisões de mapeamento em vez de gerar nomes plausíveis. citeturn2search0

Esse material **não é fonte clínica do MedAtlas** e não deve ser incorporado ao runtime.

## Próxima coleta técnica

1. Obter o `metadata.json` oficial do Digital Object.
2. Obter uma cópia local do GLB oficial somente para qualificação offline.
3. Extrair a árvore de nodes sem alterar os nomes originais.
4. Calcular SHA-256 do arquivo bruto.
5. Contar nodes, meshes, primitives, vértices e triângulos.
6. Extrair IDs ontológicos presentes no metadata/GLB.
7. Gerar manifesto determinístico.
8. Iniciar a tabela `source_node_id → FMA/MedAtlas`.
9. Classificar cada entrada como `mapped`, `unmapped` ou `ambiguous`.
10. Só então avaliar compressão/chunking e impacto de performance.

## Gate de segurança arquitetural

Até a conclusão dessa coleta:

- nenhum GLB HRA feminino é publicado em `public/atlas-assets/`;
- nenhum fetch remoto é adicionado ao runtime;
- nenhum `FemaleAtlas` paralelo é criado;
- nenhum FMA é inventado para preencher lacunas;
- o atlas masculino BodyParts3D/FMA permanece a autoridade canônica.

## Fontes externas verificadas

- HRA Digital Object / dataset: `https://lod.humanatlas.io/ref-organ/united-female/v1.5`
- NIH 3D entry: `https://3d.nih.gov/entries/3DPX-020992`
- NIH 3D download metadata: `https://3d.nih.gov/entries/download/20992/1.01`
- HRA validation tooling: `https://github.com/hubmapconsortium/hra-ref-organ-validation`

A publicação NIH é usada como evidência independente da existência/publicação do artefato; a autoridade de origem continua sendo o Digital Object HRA/HuBMAP. citeturn3search0turn0search0
