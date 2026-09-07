# MedAtlas — contrato de IA

## Estado atual

A IA remota está **desativada** no MVP sem backend.

O sistema continua usando:

1. triagem anatômica determinística;
2. conceitos FMA conhecidos;
3. confirmação explícita do profissional;
4. gerador educacional determinístico;
5. revisão humana antes da publicação.

Nenhum botão deve fingir que GPT, Claude ou outro provedor está ativo quando não
há integração real.

## Fronteira para um provedor futuro

Qualquer provedor deverá devolver um payload compatível com:

`src/clinical/structured-extraction.schema.json`

A resposta é tratada como não confiável até passar por
`validateStructuredClinicalExtraction`.

O validador exige:

- schema `medatlas.clinical-extraction/1`;
- 1 a 6 candidatos anatômicos;
- IDs no formato FMA;
- IDs realmente presentes no atlas carregado;
- pelo menos uma mesh renderizável por conceito;
- confidence entre 0 e 1;
- evidence textual curta;
- provenance de provider/model/prompt;
- `requiresClinicianReview: true`;
- rejeição de campos extras.

## O que a IA não pode fazer

O contrato não possui campos para:

- diagnóstico autônomo;
- prescrição;
- recomendação automática de tratamento;
- publicação automática;
- alteração silenciosa do relatório;
- conceito anatômico inventado.

Uma saída que não resolva para o atlas fixado é descartada.

## Integração futura

Fluxo esperado:

```text
texto clínico autorizado
        ↓
provedor de IA
        ↓
JSON estruturado
        ↓
schema + runtime validation
        ↓
FMA existente/renderizável
        ↓
sugestão na UI
        ↓
confirmação do profissional
        ↓
rascunho
        ↓
revisão
        ↓
publicação
```

O provedor deve ficar atrás de um backend/edge function. Chaves de API de
provedores não devem ser colocadas no bundle Vite nem em variáveis
`VITE_*`.

## Provenance

Quando a IA for ativada, cada geração deve preservar pelo menos:

- provider;
- model;
- promptVersion;
- generatedAt;
- source excerpt autorizado;
- output estruturado original ou hash/provenance equivalente;
- versão do atlas/resolvedor.

A UI pode editar o rascunho, mas a edição deve continuar registrada como
`clinicianEdited` e reabrir o gate de revisão.
