export function appHomeUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}

export function patientShareUrl(shareSlug: string) {
  const base = import.meta.env.BASE_URL

  if (base === '/') {
    return `${window.location.origin}/p/${encodeURIComponent(shareSlug)}`
  }

  const url = new URL(base, window.location.origin)
  url.searchParams.set('patient', shareSlug)
  return url.toString()
}
