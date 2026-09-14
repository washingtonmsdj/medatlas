# MedAtlas — inventário HRA Female v1.5

## Estado

**Avaliação offline preparada; asset oficial ainda não incorporado ao repositório.**

A ferramenta `npm run inventory:hra-female` foi incorporada ao runtime de desenvolvimento no PR #21. Ela aceita GLB e metadata locais, calcula SHA-256 do GLB, valida a estrutura glTF/GLB, contabiliza scenes/nodes/meshes/primitives/vertices/triangles/accessors e preserva os nomes/IDs de origem sem fabricar identificadores.

## Fonte em avaliação

- Human Reference Atlas / HuBMAP — 3D Reference Organ Set for Female v1.5.
- Dataset registrado em `docs/FEMALE_ATLAS_EVALUATION.md`.
- A fonte deve ser obtida localmente antes do inventário; o navegador MedAtlas não deve buscar esse asset remotamente.

## Regra de evidência

Não registrar contagens, hashes, cobertura ou mapeamentos como fatos do asset oficial até que o GLB/manifesto oficial tenha sido obtido e processado pela ferramenta. Resultados de terceiros podem orientar investigação, mas não substituem o artefato oficial nem a qualificação MedAtlas.

## Próxima closure técnica

1. obter o GLB e metadata oficiais HRA Female v1.5 em ambiente local autorizado;
2. executar `npm run inventory:hra-female -- --glb <arquivo> --metadata <arquivo> --out <manifesto>`;
3. revisar `missing_source_node_ids`, duplicidades e integridade estrutural;
4. registrar SHA-256 e checkpoint da fonte;
5. construir tabela source ID → FMA/MedAtlas com estados `mapped`, `unmapped` e `ambiguous`;
6. bloquear confirmação para entradas não resolvidas;
7. somente depois avaliar pipeline próprio de composição/otimização.

## Limites

- nenhum asset feminino entra em `public/atlas-assets/` nesta fase;
- nenhum `FemaleAtlas` paralelo;
- nenhum FMA inventado;
- nenhum fallback silencioso para mesh masculino semanticamente diferente;
- nenhum modelo feminino reconstruído/estimado de terceiros vira autoridade clínica;
- o atlas masculino BodyParts3D/FMA permanece a autoridade canônica.
