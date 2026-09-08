import { demoShareTtlLabel } from '../product/constraints'

export function DemoPrivacyBanner() {
  return (
    <section className="demo-privacy-banner" role="note" aria-label="Aviso de privacidade do ambiente demonstrativo">
      <strong>Ambiente demonstrativo — use somente dados fictícios.</strong>
      <span>
        Não insira nome real, CPF, telefone, endereço, número de prontuário ou
        outro dado identificável de paciente. Links locais expiram em{' '}
        {demoShareTtlLabel()} e existem apenas para validar o fluxo do MVP.
      </span>
    </section>
  )
}
