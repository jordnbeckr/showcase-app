const COMMENTS: Record<string, { up: string[]; down: string[] }> = {
  default: {
    up: [
      'Nice work.', 'Solid effort.', 'Well handled.', 'Coming along well.',
      'Consistent here.', 'Showing improvement.',
      'This is working.', 'Good awareness.', 'Progress is showing.',
      'Looking more comfortable.', 'Technique is there.', 'Keep it up.',
    ],
    down: [
      'Keep developing this.', 'Continue to work on this.',
      'Keep solidifying this area.', 'Keep building here.',
      'Continue to develop this.', 'Keep working on this.',
      'Keep focusing on this.', 'Continue building on this.',
      'Keep at it.', 'Keep progressing here.',
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
      'Keep developing your posture.', 'Continue to work on staying tall.',
      'Keep solidifying your body line.', 'Keep building your posture.',
      'Continue to develop your posture.', 'Keep working on your posture.',
      'Keep focusing on your posture.', 'Continue building your body line.',
      'Keep working on staying lifted.', 'Keep progressing with your posture.',
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
      'Keep developing your footwork.', 'Continue to work on your footwork.',
      'Keep solidifying your footwork.', 'Keep building your footwork.',
      'Continue to develop your footwork.', 'Keep working on your footwork.',
      'Keep focusing on your footwork.', 'Continue building your footwork.',
      'Keep working on foot placement.', 'Keep progressing with your footwork.',
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
      'Keep developing your timing.', 'Continue to work on your timing.',
      'Keep solidifying your timing.', 'Keep building your timing.',
      'Continue to develop your timing.', 'Keep working on your timing.',
      'Keep focusing on your timing.', 'Continue building your timing.',
      'Keep working on staying with the music.', 'Keep progressing with your timing.',
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
      'Keep developing your connection.', 'Continue to work on your connection.',
      'Keep solidifying your connection.', 'Keep building your connection.',
      'Continue to develop your connection.', 'Keep working on your connection.',
      'Keep focusing on your connection.', 'Continue building your connection.',
      'Keep working on the partnership.', 'Keep progressing with your connection.',
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
      'Keep developing your expression.', 'Continue to work on your expression.',
      'Keep solidifying your performance.', 'Keep building your stage presence.',
      'Continue to develop your expression.', 'Keep working on your expression.',
      'Keep focusing on your expression.', 'Continue building your performance.',
      'Keep working on your presence.', 'Keep progressing with your expression.',
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
      'Keep developing your frame.', 'Continue to work on your frame.',
      'Keep solidifying your frame.', 'Keep building your frame.',
      'Continue to develop your frame.', 'Keep working on your frame.',
      'Keep focusing on your frame.', 'Continue building your frame.',
      'Keep working on maintaining your shape.', 'Keep progressing with your frame.',
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
      'Keep developing your lead and follow.', 'Continue to work on your lead and follow.',
      'Keep solidifying your lead and follow.', 'Keep building your lead and follow.',
      'Continue to develop your lead and follow.', 'Keep working on your lead and follow.',
      'Keep focusing on your lead and follow.', 'Continue building your lead and follow.',
      'Keep working on the communication between partners.', 'Keep progressing with your lead and follow.',
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
      'Keep developing your musicality.', 'Continue to work on your musicality.',
      'Keep solidifying your musicality.', 'Keep building your musicality.',
      'Continue to develop your musicality.', 'Keep working on your musicality.',
      'Keep focusing on your musicality.', 'Continue building your musicality.',
      'Keep working on connecting to the music.', 'Keep progressing with your musicality.',
    ],
  },
}

// Deterministic pick: same inputs always produce the same comment
export function getComment(categoryName: string, sentiment: 'up' | 'down', studentId: number, heatId: number, categoryId: number): string {
  const list = (COMMENTS[categoryName] ?? COMMENTS.default)[sentiment]
  const seed = (studentId * 31 + heatId * 17 + categoryId * 7 + (sentiment === 'up' ? 0 : 1)) % list.length
  return list[Math.abs(seed)]
}
