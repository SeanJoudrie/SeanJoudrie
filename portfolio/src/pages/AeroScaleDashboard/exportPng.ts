/**
 * Serialize the live chart SVG to a 2× PNG download. The chart paints with
 * CSS custom properties, which don't survive serialization — so every
 * element's paint is resolved to its computed value onto a clone first.
 */
export async function exportChartPng(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const src = [svg as Element, ...svg.querySelectorAll('*')]
  const dst = [clone as Element, ...clone.querySelectorAll('*')]

  src.forEach((el, i) => {
    const cs = getComputedStyle(el)
    const resolved: Record<string, string> = {
      fill: cs.fill,
      stroke: cs.stroke,
      'stroke-opacity': cs.strokeOpacity,
      'fill-opacity': cs.fillOpacity,
      opacity: cs.opacity,
      'stop-color': cs.stopColor,
      'stop-opacity': cs.stopOpacity,
      'font-family': cs.fontFamily,
      'font-size': cs.fontSize,
      'font-weight': cs.fontWeight,
      'letter-spacing': cs.letterSpacing,
    }
    if (cs.filter !== 'none') resolved.filter = cs.filter
    let style = ''
    for (const [k, v] of Object.entries(resolved)) if (v) style += `${k}:${v};`
    dst[i].setAttribute('style', style)
    dst[i].removeAttribute('class')
  })

  const w = svg.width.baseVal.value
  const h = svg.height.baseVal.value
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
  )
  try {
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
      img.src = svgUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = w * 2
    canvas.height = h * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = getComputedStyle(svg).getPropertyValue('--color-aero-card').trim() || '#131a26'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
