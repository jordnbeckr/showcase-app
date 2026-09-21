const COMMENTS: Record<string, { up: string[]; down: string[] }> = {
  default: {
    up: [
      'Nice work.', 'Solid effort.', 'Well handled.', 'Coming along well.',
      'Consistent here.', 'Holding up.', 'Showing improvement.',
      'This is working.', 'Good awareness.', 'Progress is showing.',
      'Looking more comfortable.', 'Technique is there.', 'Keep it up.',
    ],
    down: [
      'Needs attention.', 'Keep working on this.', 'Room to improve.',
      'Worth more time in practice.', 'Some inconsistency here.',
      'Not quite there yet.', 'Give this more focus.', 'Keep at it.',
      'An area to prioritize.', 'Will come with repetition.',
      'Needs more drilling.', 'Still developing.', 'Work in progress.',
    ],
  },
  Posture: {
    up: [
      'Good posture.', 'Stays tall.', 'Clean body line.',
      'Strong and steady.', 'Well lifted.', 'Consistent shape.',
      'Grounded but upright.', 'Posture holds through the heat.',
      'Good length.', 'Reads well from a distance.',
      'Body line is clear.', 'Upright throughout.', 'Posture is a strength.',
    ],
    down: [
      'Work on posture.', 'Stay more lifted.', 'Posture dips at times.',
      'Tendency to round forward.', 'Body line needs work.',
      'Keep the torso more upright.', 'Posture gets passive.',
      'Head position could be steadier.', 'Posture breaks down in places.',
      'More lift needed.', 'Work on staying tall through transitions.',
      'Posture softens in the second half.', 'Needs more consistency.',
    ],
  },
  Footwork: {
    up: [
      'Clean footwork.', 'Good foot placement.', 'Steps are precise.',
      'Footwork is tidy.', 'Reliable underfoot.', 'Holds up at tempo.',
      'Good floor awareness.', 'Transitions are clean.',
      'Steps land clearly.', 'Footwork is a strength.',
      'Neat and deliberate.', 'Good control here.', 'Consistent steps.',
    ],
    down: [
      'Footwork needs work.', 'Watch the placement.', 'Steps get rushed.',
      'Losing detail underfoot.', 'Placement can be cleaner.',
      'Work on slowing it down first.', 'Steps are landing flat.',
      'Footwork blurs at tempo.', 'Needs more precision.',
      'Inconsistent through the heat.', 'Breaks down under pressure.',
      'Give the feet more attention.', 'Work on each step individually.',
    ],
  },
  Timing: {
    up: [
      'Good timing.', 'Stays with the music.', 'Right on the beat.',
      'Rhythmically steady.', 'Doesn\'t rush or drag.', 'Tempo is consistent.',
      'Moves with the rhythm.', 'Timing is dependable.',
      'Catches the accents.', 'Stays on the music throughout.',
      'Timing is a strength.', 'Well-paced.', 'Musically reliable.',
    ],
    down: [
      'Watch your timing.', 'Stay closer to the beat.', 'Timing drifts.',
      'Listen to the music more.', 'Getting ahead of the music.',
      'Falling behind at times.', 'Rushing through sections.',
      'Find the pulse first.', 'Timing breaks down in places.',
      'Tempo awareness needs work.', 'Settle into the rhythm earlier.',
      'Inconsistent through the heat.', 'Beat awareness needs practice.',
    ],
  },
  Connection: {
    up: [
      'Good connection.', 'Partners move as one.', 'Natural give-and-take.',
      'Reads as a partnership.', 'Responsive to each other.',
      'Communication is clear.', 'Comfortable together.',
      'Movement flows between partners.', 'Good awareness of each other.',
      'Neither partner forces it.', 'Partnership is settled.',
      'Connection is a strength.', 'Well attuned to each other.',
    ],
    down: [
      'Work on connection.', 'Listen more to your partner.', 'Feels a bit separate.',
      'Too independent at times.', 'Connection drops in places.',
      'Stay more attuned.', 'Communication needs work.',
      'More awareness of each other.', 'Both partners need to soften.',
      'Breaks down in faster sections.', 'Work on the partnership.',
      'More give-and-take needed.', 'Partnership still finding its footing.',
    ],
  },
  Expression: {
    up: [
      'Good presence.', 'Natural expression.', 'Carries the character.',
      'Performance reads well.', 'Comfortable on the floor.',
      'Has personality.', 'Reads as a performer.',
      'Character comes through.', 'Stage presence is there.',
      'Dancing with intention.', 'Expression is growing.',
      'Nice variety.', 'The performance is there.',
    ],
    down: [
      'Work on expression.', 'Connect more to the music.', 'Open it up.',
      'More variety needed.', 'Performance needs more investment.',
      'A bit internal right now.', 'Think about what the dance says.',
      'More presence on the floor.', 'Expression fades at times.',
      'Neutral when it could be more.', 'Work on performing, not just executing.',
      'More contrast would help.', 'The performance side needs attention.',
    ],
  },
  Frame: {
    up: [
      'Good frame.', 'Frame holds well.', 'Consistent shape.',
      'Solid and stable.', 'Frame stays organized.', 'Doesn\'t waver.',
      'Active throughout.', 'Shape is clear.',
      'Steady under pressure.', 'Frame is a strength.',
      'Arms hold their position.', 'Well-structured.', 'Shape reads well.',
    ],
    down: [
      'Frame needs attention.', 'Work on maintaining shape.', 'Frame softens.',
      'Arms need steadying.', 'Shape drifts through the heat.',
      'Frame breaks down in places.', 'Gets passive at times.',
      'Keep the frame more active.', 'Shoulders need to settle.',
      'Frame is inconsistent.', 'Arms lose their shape.',
      'Work on the overall structure.', 'Shape needs more practice.',
    ],
  },
  'Leads & Follows': {
    up: [
      'Clear lead and follow.', 'Communication works.', 'In sync.',
      'Responses are timely.', 'Lead is clear.', 'Following is attentive.',
      'Cues are landing.', 'Neither partner forces it.',
      'Good balance between partners.', 'Following is responsive.',
      'Partnership communicates well.', 'Well matched.', 'Dynamic is working.',
    ],
    down: [
      'Lead/follow needs clarity.', 'Leads can be more deliberate.', 'Following needs attention.',
      'Responses are slow.', 'Leads are too subtle.',
      'Following is anticipating.', 'More give-and-take needed.',
      'Communication breaks down.', 'Leads and follows need to match.',
      'Intentions need to be clearer.', 'Gets muddled in places.',
      'More patience needed.', 'Work on the exchange between partners.',
    ],
  },
  Musicality: {
    up: [
      'Good musicality.', 'Moves with the music.', 'Interprets the music well.',
      'Musical instincts are good.', 'Responsive to the rhythm.',
      'Phrasing is there.', 'Sensitive to the music.',
      'Music guides the movement.', 'Comfortable with the structure.',
      'Movement and music connect.', 'Catches the dynamics.',
      'Musicality is a strength.', 'Good sense of phrase.',
    ],
    down: [
      'Work on musicality.', 'Listen more carefully.', 'Moving past the music.',
      'Drift from the music at times.', 'More response to the rhythm needed.',
      'Movement and music separate.', 'Phrasing needs shape.',
      'Not following the dynamics.', 'Music isn\'t guiding the movement.',
      'More awareness of the music.', 'Musicality needs attention.',
      'Try highlighting moments in the music.', 'Work on staying with the phrase.',
    ],
  },
}

// Deterministic pick: same inputs always produce the same comment
export function getComment(categoryName: string, sentiment: 'up' | 'down', studentId: number, heatId: number, categoryId: number): string {
  const list = (COMMENTS[categoryName] ?? COMMENTS.default)[sentiment]
  const seed = (studentId * 31 + heatId * 17 + categoryId * 7 + (sentiment === 'up' ? 0 : 1)) % list.length
  return list[Math.abs(seed)]
}
