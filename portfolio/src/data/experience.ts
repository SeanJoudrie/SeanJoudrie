export type TimelineItem = {
  kind: 'service' | 'education' | 'work'
  role: string
  org: string
  period: string
  points: string[]
}

// Real history from Sean's résumé. Military content is deliberately OPSEC-safe:
// branch, role, and values only — no unit, base, or schedule.
export const timeline: TimelineItem[] = [
  {
    kind: 'service',
    role: 'Officer Candidate',
    org: 'U.S. Army National Guard',
    period: 'Oct 2025 – Present',
    points: [
      'Selected for Officer Candidate School to commission as a Second Lieutenant.',
      'Served as Platoon Guide (peer leader) and as the unit’s SHARP and barracks-operations representative — enforcing standards, mediating conflicts, and owning accountability and welfare for the platoon.',
      'Where I learned to lead under real pressure.',
    ],
  },
  {
    kind: 'work',
    role: 'Co-Founder',
    org: 'Flexyn',
    period: 'Jan 2026 – Present',
    points: [
      'Co-founded a fitness web app — a 5,000+ exercise database, barcode-based nutrition scanning, workout & progress tracking, and AI-assisted form feedback.',
      'Own the product roadmap, development priorities, and launch planning while balancing full-time Army training.',
    ],
  },
  {
    kind: 'work',
    role: 'Senior Account Manager II, Business',
    org: 'Verizon Wireless',
    period: 'Nashua, NH · May 2023 – Sep 2025',
    points: [
      'Managed B2B account portfolios end to end in Salesforce — tracking KPIs, prioritizing outreach, and resolving issues to retain and grow clients.',
      'Delivered 50%+ month-over-month store-traffic growth and a 4.5× year-over-year increase in business-segment revenue.',
    ],
  },
  {
    kind: 'work',
    role: 'Shift Lead',
    org: 'Walgreens',
    period: 'Melrose, MA · Aug 2022 – May 2023',
    points: [
      'Ran daily store operations: opening/closing, cash handling and financial reporting, inventory management, and staff training and scheduling.',
    ],
  },
  {
    kind: 'work',
    role: 'OSI Supervisor',
    org: 'SNHU Office of Student Affairs',
    period: 'Manchester, NH · Oct 2021 – Apr 2023',
    points: [
      'Coordinated campus-wide operations and communications: event logistics, budgets, client services, fleet vehicle rentals, and management of the campus food pantry.',
    ],
  },
  {
    kind: 'work',
    role: 'Manager',
    org: 'MG Fitness (Private Health Club)',
    period: 'Wakefield, MA · Aug 2020 – Sep 2022',
    points: [
      'Oversaw club operations, staff training, finances, health & safety compliance, marketing, and events.',
      'Domain insight that directly informed Flexyn.',
    ],
  },
  {
    kind: 'education',
    role: 'B.A. Psychology',
    org: 'Southern New Hampshire University',
    period: 'Manchester, NH',
    points: [
      'Cumulative GPA 3.7 · President’s List (2021–2023) · Order of Omega Honor Society.',
      'The foundation of a human-systems approach: design for how people actually behave, then measure it.',
    ],
  },
  {
    kind: 'education',
    role: 'Certifications',
    org: 'Yale · IBM · Google',
    period: 'Professional',
    points: [
      'Yale: Financial Markets (with Honors), Connected Leadership, Narrative Economics, American Contract Law, The Global Financial Crisis.',
      'IBM: Project Management · Introduction to Data Analytics. Google: Foundations of Digital Marketing & E-commerce.',
    ],
  },
]
