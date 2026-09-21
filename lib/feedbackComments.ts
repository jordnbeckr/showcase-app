const COMMENTS: Record<string, { up: string[]; down: string[] }> = {
  default: {
    up: ['Nice work here.', 'Solid effort.', 'Good execution.', 'Well handled.', 'Coming along well.', 'Consistent throughout.'],
    down: ['This area needs attention.', 'Keep working on this.', 'Room to improve here.', 'Focus on this in practice.', 'Worth revisiting.'],
  },
  Posture: {
    up: ['Good posture.', 'Upright carriage throughout.', 'Posture is holding well.', 'Clean vertical line.', 'Strong through the spine.', 'Steady and tall.'],
    down: ['Work on a taller posture.', 'Lengthen through the spine.', 'Posture dips at times.', 'Stay lifted through the torso.', 'Posture needs more consistency.'],
  },
  Footwork: {
    up: ['Clean footwork.', 'Precise foot placement.', 'Footwork is tidy.', 'Good foot articulation.', 'Footwork is reliable.', 'Consistent technique underfoot.'],
    down: ['Footwork needs more precision.', 'Watch the foot placement.', 'Work on cleaner steps.', 'Foot timing can be sharper.', 'Footwork gets rushed at times.'],
  },
  Timing: {
    up: ['Good timing.', 'Stays with the music.', 'Solid musical timing.', 'Connects well to the beat.', 'Rhythmically steady.', 'Timing holds up through the heat.'],
    down: ['Watch your timing.', 'Stay closer to the beat.', 'Timing drifts at moments.', 'Listen more carefully to the music.', 'Tempo awareness needs work.'],
  },
  Connection: {
    up: ['Good connection.', 'Partners move as a unit.', 'Natural give-and-take.', 'Partnership reads well.', 'Responsive to each other.', 'Connection is relaxed and clear.'],
    down: ['Work on partner connection.', 'Listen more to your partner.', 'Connection needs more sensitivity.', 'Give more attention to your partner.', 'Partnership feels a bit separate.'],
  },
  Expression: {
    up: ['Good presence.', 'Genuine expression.', 'Carries the character well.', 'Stage presence is building.', 'Performance reads from a distance.', 'Expression is natural.'],
    down: ['Work on expression.', 'Connect more to the music.', 'Let the movement carry more feeling.', 'Expression can be more varied.', 'More engagement with the performance.'],
  },
  Frame: {
    up: ['Good frame.', 'Frame holds up well.', 'Consistent shape throughout.', 'Frame is controlled.', 'Solid and stable frame.', 'Frame stays organized.'],
    down: ['Frame needs attention.', 'Work on maintaining shape.', 'Frame collapses at moments.', 'Keep the frame more consistent.', 'Arms and shoulders need steadying.'],
  },
  'Leads & Follows': {
    up: ['Clear leading and following.', 'Communication reads well.', 'Lead and follow are in sync.', 'Responses are timely.', 'Good exchange of weight and intention.', 'Partnership communication is reliable.'],
    down: ['Lead/follow needs clarity.', 'Leads can be more deliberate.', 'Following needs more attention.', 'Work on the partnership communication.', 'Responses are a beat behind at times.'],
  },
  Musicality: {
    up: ['Good musicality.', 'Moves with the phrase.', 'Interprets the music well.', 'Musical instincts are there.', 'Responds to dynamics and rhythm.', 'Phrasing is considered.'],
    down: ['Work on musicality.', 'Listen more carefully to the music.', 'Try to interpret the phrase more.', 'Movement and music are sometimes separate.', 'Work on matching dynamics to the music.'],
  },
}

// Deterministic pick: same inputs always produce the same comment
export function getComment(categoryName: string, sentiment: 'up' | 'down', studentId: number, heatId: number, categoryId: number): string {
  const list = (COMMENTS[categoryName] ?? COMMENTS.default)[sentiment]
  const seed = (studentId * 31 + heatId * 17 + categoryId * 7 + (sentiment === 'up' ? 0 : 1)) % list.length
  return list[Math.abs(seed)]
}
