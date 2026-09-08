import { demoShareTtlLabel } from '../product/constraints'

export function DemoPrivacyBanner() {
  return (
    <section
      className="demo-privacy-banner demo-privacy-banner-mvp"
      role="note"
      aria-label="Aviso do ambiente demonstrativo"
    >
      <strong>Demo</strong>
      <span>
        Use apenas dados fictícios · links expiram em {demoShareTtlLabel()}.
      </span>
    </section>
  )
}
