# MedAtlas — arquitetura

## Objetivo do sistema

O MedAtlas é uma camada de comunicação clínica visual entre profissional e paciente.

Ele pode auxiliar em:

- leitura estrutural de um texto fornecido pelo profissional;
- localização de anatomia;
- geração de rascunhos educacionais;
- preparação de uma experiência 3D;
- compartilhamento controlado.

Ele não transforma uma sugestão de software em diagnóstico ou conduta clínica.

## Fluxo canônico

```text
Clinical source text
        ↓
Anatomy resolver
        ↓
Known atlas concepts only
        ↓
Clinician confirmation
        ↓
Atlas selection state
        ↓
Patient explanation draft
        ↓
Clinician review gate
        ↓
Published visual report
        ↓
Opaque patient share
```

## Camadas

### 1. UI clínica

Responsabilidades:

- entrada do laudo/relatório;
- mostrar candidatos anatômicos;
- navegação 3D;
- edição da explicação;
- revisão/publicação.

A UI não deve conhecer diretamente Storage, SQL ou `localStorage`.

### 2. ClinicalRepository

`src/data/clinical-repository.ts` define a fronteira de persistência.

Hoje:

```text
UI → ClinicalRepository → DemoClinicalRepository
```

Alvo:

```text
UI → ClinicalRepository → SupabaseClinicalRepository
```

Isso permite trocar persistência sem reescrever o fluxo clínico.

O seletor do repositório é fail-closed: variáveis Supabase sozinhas não ativam automaticamente backend incompleto.

### 3. Resolver anatômico

Existem duas entradas complementares:

- busca manual;
- triagem do texto do relatório.

O resolvedor determinístico é a SSOT inicial de segurança. Candidatos precisam existir no `atlas.json` fixado.

A futura IA entra acima dele, não abaixo:

```text
LLM output
   ↓
schema validation
   ↓
atlas concept resolution
   ↓
known IDs only
   ↓
clinician confirmation
```

### 4. Renderer

O renderer usa Three.js e a geometria BodyParts3D empacotada pelo Human Atlas.

Propriedades atuais:

- upstream fixado por SHA;
- assets comprimidos vendorizados em `public/atlas-assets/`;
- SHA-256 + provenance da closure anatômica;
- nenhum fetch normal de geometria depende do repositório upstream;
- conceitos com uma ou várias meshes;
- download agrupado por chunk;
- cache de chunks imutáveis;
- modos Isolado/Sistema/Região;
- contexto próximo sem carregar o atlas completo;
- mesma seleção semântica na visão clínica e na visão do paciente.

O relatório deve armazenar estado semântico, não apenas screenshot.

Exemplo:

```ts
interface AtlasSelection {
  conceptId: string
  elementIds: string[]
  visibleSystems: string[]
  contextMode: 'none' | 'system' | 'region'
  camera?: {
    position: [number, number, number]
    target: [number, number, number]
  }
  annotations: Array<{
    elementId: string
    label: string
  }>
}
```

### 5. Data plane Supabase

Contrato source-first:

`supabase/migrations/202609070001_medatlas_core.sql`

Domínios:

- **organizations** — tenant;
- **organization_members** — identidade + papel;
- **professionals** — perfil clínico;
- **patients** — paciente dentro do tenant;
- **consultations** — contexto do atendimento;
- **visual_reports** — conteúdo e estado aprovado;
- **clinical_documents** — metadata/integridade de arquivo privado;
- **report_shares** — links de paciente;
- **audit_events** — trilha de eventos relevantes.

## Segurança multi-tenant

Todos os objetos clínicos pertencem a uma organização.

RLS usa a identidade autenticada para resolver membership.

Escrita clínica:

- admin;
- clinician.

Leitura clínica interna:

- membro ativo da organização, conforme política.

A validação real de cross-tenant ainda precisa ser provada em um projeto Supabase dedicado antes de qualquer dado real.

## Publicação do relatório

Um relatório só pode ficar `published` quando:

- não há revisão pendente;
- existe conceito anatômico;
- existe explicação;
- existe aprovador;
- existe timestamp de aprovação.

Modificar anatomia ou explicação invalida o estado publicado no frontend; a implementação Supabase deve manter a mesma propriedade transacionalmente.

## Compartilhamento do paciente

Produção:

1. gera 32 bytes aleatórios;
2. retorna o token bruto uma única vez;
3. persiste somente `SHA-256(token)`;
4. registra versão do relatório;
5. define expiração;
6. permite revogação.

Resolver público recebe token, aplica hash e retorna somente projeção patient-safe.

Nenhuma tabela de aplicação recebe grant de leitura para `anon`.

## Storage clínico

Bucket:

`clinical-documents`

Características:

- privado;
- path prefixado pelo UUID do tenant;
- RLS de leitura;
- escrita limitada a papel clínico;
- metadata com SHA-256 e tamanho;
- formatos limitados no contrato inicial.

## Auditoria

A aplicação não concede insert arbitrário na tabela de auditoria para o navegador.

Eventos críticos são emitidos por operações controladas, incluindo:

- criação de organização;
- criação de compartilhamento;
- visualização válida de compartilhamento.

## IA

Contrato alvo:

```json
{
  "source_excerpt": "...",
  "candidate_structures": [
    {
      "concept_id": "FMA...",
      "label": "...",
      "confidence": 0.0
    }
  ],
  "patient_explanation_draft": "...",
  "requires_clinician_review": true
}
```

O campo `concept_id` precisa ser resolvido contra o atlas fixado antes de a resposta ser considerada utilizável.

## Ambientes

### Demo

- dados sintéticos;
- DemoClinicalRepository;
- token aleatório;
- persistência local;
- sem alegação de privacidade clínica.

### Produção futura

- Supabase dedicado;
- autenticação;
- RLS testada;
- Storage privado;
- compartilhamentos expirados/revogáveis;
- logs/auditoria;
- secrets separados;
- dados anatômicos em origem controlada pelo MedAtlas.

### Assets anatômicos

A closure comprimida do Human Atlas está sob origem controlada pelo MedAtlas em `public/atlas-assets/`.

O workflow `vendor-atlas-assets.yml` baixa somente do commit upstream fixado, gera hashes SHA-256 e provenance. O CI recalcula os hashes e aplica um orçamento de payload antes do build. Atualizar o upstream exige uma mudança explícita de source/provenance; não existe atualização silenciosa em runtime.

Os cenários sintéticos atuais exigem de 1 a 2 chunks e permanecem abaixo de 7,5 MB de payload inicial de atlas (catálogo + geometria comprimida).

## Proibições arquiteturais

- não reutilizar banco de outro produto;
- não usar ID de paciente/report como token;
- não guardar token bruto;
- não abrir bucket clínico;
- não aceitar ID anatômico inventado por IA;
- não publicar automaticamente saída de IA;
- não criar segundo renderer paralelo;
- não representar BodyParts3D como reconstrução do paciente.
