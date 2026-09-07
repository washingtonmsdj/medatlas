# MedAtlas — piloto sintético

## Objetivo

Validar o MVP de ponta a ponta sem dados reais e sem depender do backend.

O piloto sintético existe para responder:

- o profissional consegue iniciar do zero?
- o texto clínico encontra anatomia conhecida?
- a estrutura precisa ser confirmada explicitamente?
- a explicação permanece bloqueada até revisão?
- o link do paciente só nasce depois do gate humano?
- a página do paciente abre com a mesma anatomia?
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

## Aceite automatizado

O Browser E2E já cobre:

1. os quatro cenários acima;
2. criação de relatório visual vazio;
3. sugestão anatômica;
4. confirmação explícita;
5. rascunho educacional;
6. revisão;
7. publicação;
8. abertura da visão do paciente;
9. mobile sem overflow horizontal;
10. link demo expirado falhando fechado;
11. axe/WCAG nas superfícies principais.

CI adicional cobre:

- contrato do banco;
- anatomia curada;
- cenário → FMA;
- integridade SHA-256 dos assets;
- budget de payload;
- privacy/security;
- contrato de IA;
- gate de revisão clínica.

## Piloto manual sintético

Antes de qualquer uso com PHI, executar manualmente os quatro cenários em desktop
e mobile usando apenas nomes e textos fictícios.

Registrar somente observações de produto, por exemplo:

- estrutura encontrada foi a esperada?
- explicação ficou compreensível?
- profissional entendeu quando precisava confirmar?
- houve confusão entre anatomia de referência e corpo do paciente?
- página do paciente ficou clara?
- qual etapa pareceu lenta ou desnecessária?

Não registrar nomes reais, exames reais ou qualquer identificador.

## Etapa clínica controlada — futura

Permanece bloqueada até:

- backend dedicado;
- autenticação;
- RLS testada;
- Storage privado;
- política de retenção;
- compartilhamentos de produção;
- revisão jurídica/privacidade para o uso pretendido;
- protocolo de suporte/incidente;
- definição formal do escopo do piloto.

Essa fase não está concluída e não deve ser simulada no produto.
