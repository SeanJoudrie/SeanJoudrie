import { checkPrompt, scoreLabel, type Severity } from '../lib/check'

const mark: Record<Severity, { sign: string; cls: string; name: string }> = {
  good: { sign: '✓', cls: 'bg-accent-soft text-accent', name: 'Good' },
  warn: { sign: '!', cls: 'bg-warn-soft text-warn', name: 'Worth fixing' },
  bad: { sign: '×', cls: 'bg-bad-soft text-bad', name: 'Missing' },
}
const order: Record<Severity, number> = { bad: 0, warn: 1, good: 2 }

export function ScoreBadge({ score }: { score: number }) {
  const sev: Severity = score >= 85 ? 'good' : score >= 55 ? 'warn' : 'bad'
  return (
    <span className={`inline-flex items-center gap-1 rounded-ui px-2 py-1 text-sm font-semibold ${mark[sev].cls}`}>
      {score} <span className="font-medium">· {scoreLabel(score)}</span>
    </span>
  )
}

export function CheckPanel({ text }: { text: string }) {
  const r = checkPrompt(text)
  if (!r.words) return <p className="text-sm text-ink-2">Write or paste a prompt to check it.</p>
  const findings = [...r.findings].sort((a, b) => order[a.severity] - order[b.severity])
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <ScoreBadge score={r.score} />
        <span className="text-sm text-ink-2">{r.words} words</span>
      </div>
      <ul className="mt-4 list-none space-y-3 p-0">
        {findings.map((f) => (
          <li key={f.id} className="flex gap-3">
            <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-ui text-sm font-semibold ${mark[f.severity].cls}`}>{mark[f.severity].sign}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold"><span className="sr-only">{mark[f.severity].name}: </span>{f.label}</p>
              <p className="mt-1 text-sm text-ink-2">{f.detail}</p>
              {f.fix && <p className="mt-1 text-sm"><span className="font-medium">Fix:</span> {f.fix}</p>}
              {f.quotes && f.quotes.length > 0 && (
                <ul className="mt-2 list-none space-y-1 p-0">
                  {f.quotes.map((q) => <li key={q} className="border-l-2 border-line pl-3 font-mono text-xs text-ink-2">{q}</li>)}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink-2">This checks structure, not whether the prompt is right for your job. The Lab is where you find that out.</p>
    </div>
  )
}
