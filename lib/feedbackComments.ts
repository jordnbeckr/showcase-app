const COMMENTS: Record<string, { up: string[]; down: string[] }> = {
  default: {
    up: ['Looking great!', 'Really nice work here.', 'Excellent execution.', 'Beautiful!', 'Well done!'],
    down: ['This area needs some work.', 'Keep practicing this.', 'Focus on improving this.', 'Room for growth here.'],
  },
  Posture: {
    up: ['Great posture!', 'Posture is looking solid.', 'Beautiful upright carriage.', 'Your posture is excellent.', 'Strong frame and posture.'],
    down: ['Work on keeping a taller posture.', 'Focus on lengthening through the spine.', 'Your posture needs attention.', 'Try to stand taller through the dance.'],
  },
  Footwork: {
    up: ['Footwork is sharp!', 'Very clean footwork.', 'Excellent footwork technique.', 'Your footwork stands out.', 'Precise and beautiful footwork.'],
    down: ['Footwork needs more precision.', 'Focus on your footwork timing.', 'Work on clean foot placement.', 'Practice your footwork technique.'],
  },
  Timing: {
    up: ['Great timing!', 'Right on the music.', 'Excellent musical timing.', 'Your timing is spot on.', 'Beautiful connection to the music.'],
    down: ['Watch your timing.', 'Try to stay closer to the beat.', 'Timing needs work.', 'Focus on listening to the music more.'],
  },
  Connection: {
    up: ['Beautiful connection!', 'Lovely partnership.', 'Great connection between partners.', 'The connection feels natural.', 'Wonderful teamwork.'],
    down: ['Work on your partner connection.', 'Focus on listening to your partner.', 'The connection needs more sensitivity.', 'Try to feel your partner more.'],
  },
  Expression: {
    up: ['Wonderful expression!', 'Very expressive performance.', 'Great stage presence.', 'Love the expressiveness.', 'Beautiful artistic quality.'],
    down: ['Work on your expression.', 'Try to connect more with the music emotionally.', 'Let the music move you more.', 'More expression needed.'],
  },
  Frame: {
    up: ['Excellent frame!', 'Beautiful frame shape.', 'Your frame is strong and consistent.', 'Great frame control.', 'Frame looks polished.'],
    down: ['Frame needs attention.', 'Work on maintaining your frame.', 'Keep a more consistent frame.', 'Focus on frame stability.'],
  },
  'Leads & Follows': {
    up: ['Very clear lead and follow.', 'Communication between partners is excellent.', 'The lead/follow is smooth and clear.', 'Great leading and following.'],
    down: ['Work on the lead/follow communication.', 'Leads need to be clearer.', 'Following needs more sensitivity.', 'Focus on cleaner leads and follows.'],
  },
  Musicality: {
    up: ['Wonderful musicality!', 'Great interpretation of the music.', 'You really feel the music.', 'Beautiful musical phrasing.', 'Excellent musicality.'],
    down: ['Work on your musicality.', 'Listen more carefully to the music.', 'Try to interpret the music more.', 'More musicality needed.'],
  },
}

// Deterministic pick: same inputs always produce the same comment
export function getComment(categoryName: string, sentiment: 'up' | 'down', studentId: number, heatId: number, categoryId: number): string {
  const list = (COMMENTS[categoryName] ?? COMMENTS.default)[sentiment]
  const seed = (studentId * 31 + heatId * 17 + categoryId * 7 + (sentiment === 'up' ? 0 : 1)) % list.length
  return list[Math.abs(seed)]
}
