# MedAtlas

**Consulta visual com IA para clínicas, médicos e pacientes.**

O MedAtlas transforma um laudo ou explicação clínica em um relatório visual interativo: o profissional confirma a estrutura anatômica, revisa o conteúdo em linguagem simples e publica um link privado para o paciente.

## Estado atual

O MVP já possui:

- dashboard clínico em português;
- fluxo `laudo → anatomia → revisão → compartilhamento`;
- gate explícito de revisão clínica;
- relatório visual com link privado simulado;
- integração P0 com o catálogo e a geometria real BodyParts3D do Human Atlas;
- mapeamento demonstrativo do disco L4–L5 para o conceito FMA `FMA16036`;
- arquitetura e roadmap documentados.

Todos os nomes e dados clínicos exibidos atualmente são **fictícios e apenas demonstrativos**.

## Rodar

Requer Node.js 22.13+.

```bash
npm install
npm run dev
```

Abra `http://localhost:3016`.

Durante o desenvolvimento, o Vite faz proxy de `/atlas-assets/*` para o commit fixado do Human Atlas. Em Vercel, a mesma rota é configurada por rewrite.

## Anatomia 3D

A primeira integração carrega a geometria real da estrutura confirmada no relatório. Ela é intencionalmente menor que o explorador completo do Human Atlas: primeiro provamos a cadeia semântica e de provenance, depois expandimos para busca, camadas, seleção e múltiplas estruturas.

```text
trecho do laudo
      ↓
estrutura confirmada pelo profissional
      ↓
FMA16036
      ↓
atlas.json fixado
      ↓
FJ3216 / chunk BodyParts3D
      ↓
Three.js
      ↓
relatório visual
```

A geometria é **anatomia de referência**, não uma reconstrução do paciente.

## Segurança de produto

A IA **não publica diagnóstico automaticamente**. O produto é uma ferramenta de comunicação e educação clínica com revisão humana antes do compartilhamento.

## Licenças e provenance

- Human Atlas: MIT, fixado no commit `1c38bf35c254a891200d3cedecfd57abebe83d8d`
- BodyParts3D 4.0: CC BY 4.0

Veja `THIRD_PARTY_NOTICES.md` e `third_party/human-atlas/PROVENANCE.md`.

## Próximos checkpoints

1. generalizar o renderer para conceitos compostos e múltiplas estruturas;
2. busca anatômica e camadas;
3. mover os assets 3D para storage/CDN controlado pelo MedAtlas;
4. autenticação multi-tenant;
5. pacientes, consultas e relatórios persistidos;
6. links privados revogáveis e com expiração;
7. IA estruturada com revisão clínica obrigatória;
8. deploy preview e testes E2E.

Veja `docs/ARCHITECTURE.md` e `URGENTE.md`.
