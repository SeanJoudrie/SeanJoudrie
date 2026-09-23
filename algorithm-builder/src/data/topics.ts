/**
 * The "What do you like?" chips (F-02). Each chip becomes a mix category with
 * sensible sub-topics, so nobody starts from a blank chart. Queries are what we
 * actually send to YouTube search; keep them specific enough to return good
 * long-form results.
 */

export interface TopicPreset {
  id: string
  label: string
  children: { label: string; query: string }[]
}

export const TOPICS: TopicPreset[] = [
  {
    id: 'video-essays',
    label: 'Video essays',
    children: [
      { label: 'Film & TV essays', query: 'film analysis video essay' },
      { label: 'Culture essays', query: 'internet culture video essay' },
    ],
  },
  {
    id: 'science',
    label: 'Science',
    children: [
      { label: 'Space', query: 'space science explained' },
      { label: 'Biology', query: 'biology explained documentary' },
      { label: 'Physics', query: 'physics explained' },
    ],
  },
  {
    id: 'math',
    label: 'Math',
    children: [
      { label: 'Math explainers', query: 'math explained visually' },
      { label: 'Math puzzles', query: 'math puzzle explained' },
    ],
  },
  {
    id: 'comedy',
    label: 'Comedy',
    children: [
      { label: 'Stand-up', query: 'stand up comedy special clip' },
      { label: 'Sketches', query: 'sketch comedy' },
    ],
  },
  {
    id: 'history',
    label: 'History',
    children: [
      { label: 'World history', query: 'world history documentary' },
      { label: 'Odd history', query: 'strange history explained' },
    ],
  },
  {
    id: 'psychology',
    label: 'Psychology',
    children: [{ label: 'Psychology', query: 'psychology explained video essay' }],
  },
  {
    id: 'true-crime',
    label: 'True crime',
    children: [{ label: 'Case deep dives', query: 'true crime case documentary' }],
  },
  {
    id: 'tv-film',
    label: 'TV & film',
    children: [
      { label: 'Behind the scenes', query: 'behind the scenes filmmaking' },
      { label: 'Reviews', query: 'movie review' },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    children: [
      { label: 'Live sessions', query: 'live session performance' },
      { label: 'Music theory', query: 'music theory explained' },
    ],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    children: [
      { label: 'Game design', query: 'game design analysis' },
      { label: 'Let’s plays', query: 'lets play' },
    ],
  },
  {
    id: 'cooking',
    label: 'Cooking',
    children: [{ label: 'Recipes', query: 'easy recipe cooking' }],
  },
  {
    id: 'makeup',
    label: 'Makeup & style',
    children: [{ label: 'Tutorials', query: 'makeup tutorial' }],
  },
]

/** Pool for the wildcard slice (F-10): "random but good", not truly random. */
export const WILDCARD_QUERIES = [
  'how its made factory',
  'miniature model making',
  'deep sea creatures documentary',
  'origami tutorial advanced',
  'restoration rusty tool',
  'linguistics explained',
  'architecture explained',
  'bird calls explained',
  'typography history',
  'maps explained geography',
  'clock repair',
  'glass blowing',
]

/** Suggestions for "too much of what?" (F-04): common culprits people name. */
export const CULPRITS = [
  'Game of Thrones',
  'Star Wars',
  'Breaking Bad',
  'Better Call Saul',
  'Red Dead Redemption 2',
  'Minecraft',
  'Marvel',
  'Lego',
  'Politics',
  'Podcast clips',
  'Shorts',
  'Reaction videos',
]

export const WILDCARD_ID = 'wildcard'
export const MAX_CATEGORIES = 7
