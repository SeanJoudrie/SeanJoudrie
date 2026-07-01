export type TimelineItem = {
  kind: 'service' | 'education' | 'work'
  role: string
  org: string
  period: string
  points: string[]
}

// [FILL] — replace org names, dates, and bullet specifics with your real history.
// The threads (military, education, B2B/ops/gym leadership) are seeded; make them exact.
export const timeline: TimelineItem[] = [
  {
    kind: 'service',
    role: 'Officer Candidate',
    org: 'U.S. Army National Guard',
    period: 'Current',
    points: [
      'Completed Basic Combat Training; selected for the officer commissioning pipeline.',
      'Squad-level leadership — accountable for the readiness, discipline, and performance of a team under pressure.',
      'Operating a demanding 18-month training commitment alongside full-time building.',
    ],
  },
  {
    kind: 'education',
    role: 'B.A. Psychology · Minor, Business Analytics',
    org: '[FILL: University]',
    period: '[FILL: year]',
    points: [
      'GPA 3.7. Coursework spanning human behavior, research methods, statistics, and data analysis.',
      'The foundation of a human-systems approach: design for how people actually behave, then measure it.',
    ],
  },
  {
    kind: 'work',
    role: 'B2B Account Management',
    org: '[FILL: Company]',
    period: '[FILL: dates]',
    points: [
      'Owned client relationships end to end — onboarding, retention, and growth.',
      'Translated customer needs into clear requirements and follow-through.',
    ],
  },
  {
    kind: 'work',
    role: 'Operations Supervisor',
    org: '[FILL: Company]',
    period: '[FILL: dates]',
    points: [
      'Supervised daily operations and a frontline team; accountable for throughput and standards.',
      'Built and enforced process under real-world constraints.',
    ],
  },
  {
    kind: 'work',
    role: 'Gym Management',
    org: '[FILL: Company]',
    period: '[FILL: dates]',
    points: [
      'Ran day-to-day operations, staff, and member experience.',
      'Domain insight that directly informed Flexyn.',
    ],
  },
]
