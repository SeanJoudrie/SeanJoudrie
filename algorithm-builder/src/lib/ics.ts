/**
 * The one-week tune-up reminder as a calendar file (F-05). No email, no
 * account: the reminder lives in the user's own calendar.
 */
export function tuneUpIcs(link: string, from = new Date()): string {
  const start = new Date(from)
  start.setDate(start.getDate() + 7)
  start.setHours(10, 0, 0, 0)
  const end = new Date(start.getTime() + 15 * 60 * 1000)
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Algorithm Builder//Tune-up//EN',
    'BEGIN:VEVENT',
    `UID:${stamp}-${Math.random().toString(36).slice(2)}@algorithm-builder`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    'SUMMARY:Feed tune-up (2 min)',
    `DESCRIPTION:${escape(`Tally your homepage again and adjust your mix: ${link}`)}`,
    `URL:${link}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n')
}

const pad = (n: number) => String(n).padStart(2, '0')
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** RFC 5545 lines are folded at 75 octets. */
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  for (let i = 0; i < line.length; i += 74) parts.push((i ? ' ' : '') + line.slice(i, i + 74))
  return parts.join('\r\n')
}

export function download(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
