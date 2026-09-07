# MedAtlas

**Consulta visual com IA para clínicas, médicos e pacientes.**

O MedAtlas transforma um laudo ou explicação clínica em um relatório visual interativo: o profissional confirma a estrutura anatômica, revisa o conteúdo em linguagem simples e publica um link privado para o paciente.

## Estado atual

Este repositório contém o primeiro milestone do MVP:

- dashboard clínico em português;
- fluxo visual de relatório a partir de um laudo;
- confirmação de estrutura anatômica;
- explicação educacional para paciente;
- gate explícito de revisão clínica;
- geração simulada de link privado;
- viewport preparado para receber o motor 3D do Human Atlas/BodyParts3D;
- arquitetura e roadmap documentados.

Todos os nomes e dados da interface atual são **fictícios e apenas demonstrativos**.

## Rodar

Requer Node.js 22.13+.

```bash
npm install
npm run dev
```

Abra `http://localhost:3016`.

## Direção de produto

```text
consulta / exame
      ↓
extração assistida de termos anatômicos
      ↓
confirmação do profissional
      ↓
Atlas 3D na estrutura correta
      ↓
explicação em linguagem simples
      ↓
revisão clínica obrigatória
      ↓
relatório visual privado
      ↓
paciente
```

A IA **não publica diagnóstico automaticamente**. O produto é projetado como ferramenta de comunicação e educação clínica, com revisão humana antes do compartilhamento.

## Human Atlas / BodyParts3D

A integração do motor anatômico será rastreável. O código do Human Atlas é MIT e os dados anatômicos BodyParts3D usados pelo projeto upstream são CC BY 4.0. Veja `THIRD_PARTY_NOTICES.md` antes de incorporar arquivos upstream.

## Próximo checkpoint

1. incorporar motor 3D upstream com proveniência e atribuição;
2. mapear estruturas do laudo para IDs do atlas;
3. autenticação multi-tenant;
4. pacientes, consultas e relatórios persistidos;
5. share tokens privados, revogáveis e com expiração;
6. armazenamento seguro de documentos;
7. IA estruturada com revisão clínica obrigatória;
8. deploy preview e testes E2E.

Veja `docs/ARCHITECTURE.md` e `URGENTE.md`.
