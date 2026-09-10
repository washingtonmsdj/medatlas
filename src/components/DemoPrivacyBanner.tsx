import { demoShareTtlLabel } from '../product/constraints'

export function DemoPrivacyBanner() {
  return (
    <section
      className="demo-privacy-banner demo-privacy-banner-compact"
      role="note"
      aria-label="Aviso do ambiente demonstrativo"
    >
      <strong>Ambiente demo</strong>
      <span>Dados fictícios · links expiram em {demoShareTtlLabel()}.</span>
    </section>
  )
}
