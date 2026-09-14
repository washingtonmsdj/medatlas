# MedAtlas — gates de qualificação da anatomia feminina

Este documento transforma o inventário em critérios verificáveis para a futura integração. Nenhum gate abaixo autoriza, sozinho, a publicação clínica.

## Gate A — fonte

- [ ] Digital Object HRA/HuBMAP `united-female/v1.5` identificado.
- [ ] Metadata oficial preservado.
- [ ] GLB original preservado sem reexport antes da auditoria.
- [ ] DOI e licença registrados.
- [ ] SHA-256 calculado sobre o arquivo original recebido.

## Gate B — estrutura do asset

- [ ] Árvore de nodes extraída deterministicamente.
- [ ] `source_node_id` preservado sem renomear a origem.
- [ ] Meshes/primitives enumerados.
- [ ] Vértices e triângulos contabilizados.
- [ ] Bounds e transformações verificadas.
- [ ] Nodes sem geometria identificados.
- [ ] Referências quebradas ou duplicadas identificadas.

## Gate C — semântica

- [ ] Cada estrutura candidata possui `source_ontology_id` ou justificativa explícita para ausência.
- [ ] Mapeamento para FMA/MedAtlas revisado.
- [ ] `mapped`, `unmapped` e `ambiguous` são estados mutuamente exclusivos.
- [ ] `unmapped` e `ambiguous` não podem ser confirmados pelo usuário.
- [ ] Nenhum FMA é criado artificialmente.
- [ ] Nomes derivados de posição, aparência ou bounding box não são tratados como evidência semântica.

## Gate D — proveniência e licença

- [ ] Cada asset importado aponta para versão/checkpoint da fonte.
- [ ] SHA-256 do asset importado registrado.
- [ ] Atribuição CC BY 4.0 publicada de forma correspondente.
- [ ] Transformações aplicadas pelo MedAtlas documentadas.
- [ ] Nenhum asset de projeto intermediário é confundido com a fonte HRA.

## Gate E — runtime

- [ ] Nenhum fetch remoto é necessário para uso normal.
- [ ] O catálogo continua tendo uma única autoridade semântica.
- [ ] Não existe renderer/resolver/estado paralelo de anatomia feminina.
- [ ] Explorer, Clinical Studio e Patient usam os mesmos IDs semânticos.
- [ ] Ausência de detalhe suplementar falha fechado sem trocar de conceito.

## Gate F — performance

- [ ] Bundle budget permanece dentro do limite vigente.
- [ ] Carregamento inicial medido em desktop e mobile.
- [ ] Memória GPU/CPU medida em cenário representativo.
- [ ] Chunking/compressão não altera identidade ou proveniência.
- [ ] Atlas masculino não sofre regressão mensurável fora do orçamento aceito.

## Gate G — regressão e release

- [ ] Testes unitários/integração passam.
- [ ] Browser E2E passa 4/4.
- [ ] Pages publica os assets same-origin.
- [ ] Fluxo Clinical Studio verificado.
- [ ] Fluxo Patient verificado.
- [ ] Seleção, foco, contexto e retorno ao corpo completo verificados.
- [ ] Atlas masculino qualificado continua intacto.
- [ ] `URGENTE.md`, registro upstream, notices e provenance atualizados juntos.

## Regra de decisão

Se qualquer gate semântico, de proveniência, licença, segurança ou integridade falhar, a geometria não entra no catálogo clínico. O resultado deve permanecer em avaliação ou ser descartado; não existe fallback silencioso para uma estrutura semanticamente diferente.
