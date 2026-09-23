import { describe, expect, it } from 'vitest'
import { newSession } from '../lib/session'
import { withLessOf, withMoreOf } from './Flow'

describe('adding what was typed', () => {
  const s = newSession('youtube')

  it('uses the name we know for "less of", and their own words otherwise', () => {
    expect(withLessOf(s, 'got').turnDown).toEqual(['Game of Thrones'])
    expect(withLessOf(s, 'makeup').turnDown).toEqual(['Beauty & makeup'])
    expect(withLessOf(s, '  lipstick ').turnDown).toEqual(['lipstick'])
    // A first word alone is not a match: "star" stays "star".
    expect(withLessOf(s, 'star').turnDown).toEqual(['star'])
  })

  it('ignores blanks and repeats', () => {
    expect(withLessOf(s, '   ')).toEqual({})
    expect(withLessOf({ ...s, turnDown: ['Game of Thrones'] }, 'GOT')).toEqual({})
    expect(withMoreOf({ ...s, likes: ['sourdough'] }, 'Sourdough')).toEqual({})
  })

  it('picks a topic by its exact name, or keeps their own words', () => {
    expect(withMoreOf(s, 'baking').likes).toEqual(['baking'])
    expect(withMoreOf(s, 'sourdough').likes).toEqual(['sourdough'])
    expect(withMoreOf(s, 'Classic films').likes).toEqual(['classic-films'])
    // A nickname is the topic, so they get its channels and videos.
    expect(withMoreOf(s, 'yoga').likes).toEqual(['yoga-stretching'])
    expect(withMoreOf(s, 'NBA').likes).toEqual(['basketball'])
  })
})
