/**
 * The "What do you like?" chips (F-02). Each chip becomes a mix category with
 * sensible sub-topics, so nobody starts from a blank chart. Queries are what we
 * actually send to YouTube search; keep them specific enough to return good
 * long-form results.
 */

export interface TopicPreset {
  id: string
  label: string
  /** Shown before "More topics" is opened. */
  popular?: boolean
  children: { label: string; query: string }[]
}

export const TOPICS: TopicPreset[] = [
  // Popular: shown first.
  { id: 'video-essays', label: 'Video essays', popular: true, children: [
    { label: 'Film & TV essays', query: 'film analysis video essay' },
    { label: 'Culture essays', query: 'internet culture video essay' },
  ] },
  { id: 'science', label: 'Science', popular: true, children: [
    { label: 'Space', query: 'space science explained' },
    { label: 'Biology', query: 'biology explained documentary' },
    { label: 'Physics', query: 'physics explained' },
  ] },
  { id: 'math', label: 'Math', popular: true, children: [
    { label: 'Math explainers', query: 'math explained visually' },
    { label: 'Math puzzles', query: 'math puzzle explained' },
  ] },
  { id: 'comedy', label: 'Comedy', popular: true, children: [
    { label: 'Stand-up', query: 'stand up comedy special clip' },
    { label: 'Sketches', query: 'sketch comedy' },
  ] },
  { id: 'history', label: 'History', popular: true, children: [
    { label: 'World history', query: 'world history documentary' },
    { label: 'Odd history', query: 'strange history explained' },
  ] },
  { id: 'psychology', label: 'Psychology', popular: true, children: [
    { label: 'How the mind works', query: 'psychology explained' },
    { label: 'Behavior studies', query: 'famous psychology experiments explained' },
  ] },
  { id: 'true-crime', label: 'True crime', popular: true, children: [
    { label: 'Case deep dives', query: 'true crime case documentary' },
    { label: 'Heists & scams', query: 'famous heist explained' },
  ] },
  { id: 'tv-film', label: 'TV & film', popular: true, children: [
    { label: 'Behind the scenes', query: 'behind the scenes filmmaking' },
    { label: 'Reviews', query: 'movie review' },
  ] },
  { id: 'music', label: 'Music', popular: true, children: [
    { label: 'Live sessions', query: 'live session performance' },
    { label: 'Music theory', query: 'music theory explained' },
  ] },
  { id: 'gaming', label: 'Gaming', popular: true, children: [
    { label: 'Game design', query: 'game design analysis' },
    { label: 'Retro games', query: 'retro game history' },
  ] },
  { id: 'cooking', label: 'Cooking', popular: true, children: [
    { label: 'Recipes', query: 'easy recipe cooking' },
    { label: 'Food science', query: 'food science explained' },
  ] },
  { id: 'fitness', label: 'Fitness', popular: true, children: [
    { label: 'Training', query: 'strength training explained' },
    { label: 'Running', query: 'running tips form' },
  ] },

  // More topics.
  { id: 'tech', label: 'Tech', children: [
    { label: 'How tech works', query: 'how it works technology explained' },
    { label: 'Reviews', query: 'honest tech review' },
  ] },
  { id: 'programming', label: 'Coding', children: [
    { label: 'Programming explained', query: 'programming concepts explained' },
    { label: 'Build projects', query: 'coding project build from scratch' },
  ] },
  { id: 'engineering', label: 'Engineering', children: [
    { label: 'How things are built', query: 'engineering explained how it is built' },
    { label: 'Failures', query: 'engineering disaster explained' },
  ] },
  { id: 'animation', label: 'Animation', children: [
    { label: 'Animated shorts', query: 'animated short film' },
    { label: 'How animation works', query: 'animation process behind the scenes' },
  ] },
  { id: 'art', label: 'Art & design', children: [
    { label: 'Art history', query: 'art history explained' },
    { label: 'Design', query: 'graphic design explained' },
  ] },
  { id: 'architecture', label: 'Architecture', children: [
    { label: 'Buildings explained', query: 'architecture explained building' },
    { label: 'Cities', query: 'urban planning explained city' },
  ] },
  { id: 'nature', label: 'Nature & animals', children: [
    { label: 'Wildlife', query: 'wildlife documentary' },
    { label: 'Ocean', query: 'deep ocean documentary' },
  ] },
  { id: 'travel', label: 'Travel', children: [
    { label: 'Places', query: 'travel documentary city' },
    { label: 'Food travel', query: 'street food travel' },
  ] },
  { id: 'geography', label: 'Geography', children: [
    { label: 'Maps explained', query: 'geography explained maps' },
    { label: 'Borders', query: 'weird borders explained' },
  ] },
  { id: 'philosophy', label: 'Philosophy', children: [
    { label: 'Big questions', query: 'philosophy explained' },
    { label: 'Thinkers', query: 'philosopher ideas explained' },
  ] },
  { id: 'economics', label: 'Money & economics', children: [
    { label: 'Economics', query: 'economics explained' },
    { label: 'Personal finance', query: 'personal finance basics' },
  ] },
  { id: 'business', label: 'Business', children: [
    { label: 'Company stories', query: 'company history documentary' },
    { label: 'Startups', query: 'startup story founder' },
  ] },
  { id: 'news', label: 'News explained', children: [
    { label: 'Explainers', query: 'news explained in depth' },
  ] },
  { id: 'language', label: 'Languages', children: [
    { label: 'Linguistics', query: 'linguistics explained' },
    { label: 'Learning languages', query: 'language learning tips' },
  ] },
  { id: 'books', label: 'Books', children: [
    { label: 'Book reviews', query: 'book review' },
    { label: 'Literature', query: 'classic novel explained' },
  ] },
  { id: 'diy', label: 'DIY & making', children: [
    { label: 'Woodworking', query: 'woodworking project' },
    { label: 'Restoration', query: 'restoration project' },
  ] },
  { id: 'cars', label: 'Cars', children: [
    { label: 'Car reviews', query: 'car review' },
    { label: 'How cars work', query: 'how car engine works explained' },
  ] },
  { id: 'sports', label: 'Sports', children: [
    { label: 'Sports analysis', query: 'sports analysis breakdown' },
    { label: 'Sports history', query: 'sports history documentary' },
  ] },
  { id: 'health', label: 'Health', children: [
    { label: 'Body explained', query: 'human body explained' },
    { label: 'Sleep & habits', query: 'sleep science explained' },
  ] },
  { id: 'makeup', label: 'Makeup & style', children: [
    { label: 'Tutorials', query: 'makeup tutorial' },
    { label: 'Fashion', query: 'fashion history explained' },
  ] },
  { id: 'podcasts', label: 'Long talks', children: [
    { label: 'Interviews', query: 'long form interview' },
  ] },
]

/** Pool for the wildcard slice (F-10): "random but good", not truly random. */
export const WILDCARD_QUERIES = [
  'bookbinding by hand',
  'lock picking explained',
  'mushroom foraging',
  'bonsai care',
  'sign painting by hand',
  'knife sharpening',
  'map making by hand',
  'old radio restoration',
  'beekeeping',
  'calligraphy',
  'speedrun explained',
  'stop motion animation making',
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
  'The Office',
  'Harry Potter',
  'Fortnite',
  'Pokémon',
  'Joe Rogan clips',
  'Mr Beast',
  'Celebrity gossip',
  'Crypto',
  'Prank videos',
  'True crime',
]

export const WILDCARD_ID = 'wildcard'
export const MAX_CATEGORIES = 7
