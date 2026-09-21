const COMMENTS: Record<string, { up: string[]; down: string[] }> = {
  default: {
    up: [
      'Nice work here.', 'Solid effort.', 'Good execution.', 'Well handled.', 'Coming along well.',
      'Consistent throughout.', 'Holding up nicely.', 'Dependable here.', 'Reliable through the heat.',
      'Showing real improvement.', 'This is working.', 'Good awareness here.', 'Technique is coming through.',
    ],
    down: [
      'This area needs attention.', 'Keep working on this.', 'Room to improve here.', 'Focus on this in practice.',
      'Worth revisiting.', 'This is the area to prioritize.', 'Needs more drilling.',
      'Some inconsistency here.', 'Not quite landing yet.', 'Give this more time in rehearsal.',
      'This is holding the dancing back a bit.', 'Patience and practice will help here.',
    ],
  },
  Posture: {
    up: [
      'Good posture.', 'Upright carriage throughout.', 'Posture is holding well.', 'Clean vertical line.',
      'Strong through the spine.', 'Steady and tall.', 'Lifted and organized.', 'Posture stays consistent.',
      'Nice length through the body.', 'Carries the frame well.', 'Grounded but lifted.',
      'Body line is clear.', 'Spine stays active.', 'Posture reads well from a distance.',
    ],
    down: [
      'Work on a taller posture.', 'Lengthen through the spine.', 'Posture dips at times.',
      'Stay lifted through the torso.', 'Posture needs more consistency.', 'Tendency to round forward.',
      'Hips are getting ahead of the body.', 'Head position could be more neutral.',
      'Body collapses a bit in the turns.', 'Core needs to stay more engaged.',
      'Work on staying tall through transitions.', 'Posture breaks down toward the end of phrases.',
      'Think about a string pulling the crown of the head up.',
    ],
  },
  Footwork: {
    up: [
      'Clean footwork.', 'Precise foot placement.', 'Footwork is tidy.', 'Good foot articulation.',
      'Footwork is reliable.', 'Consistent technique underfoot.', 'Heels and toes are working.',
      'Steps are landing clearly.', 'Footwork is neat and deliberate.', 'Good awareness of the floor.',
      'Ball-heel action is there.', 'Transitions between steps are clean.',
      'Footwork holds up at tempo.', 'Nice control through the feet.',
    ],
    down: [
      'Footwork needs more precision.', 'Watch the foot placement.', 'Work on cleaner steps.',
      'Foot timing can be sharper.', 'Footwork gets rushed at times.', 'Feet are skimming rather than placing.',
      'Ball-heel needs more attention.', 'Steps are landing flat.',
      'Work on pointing through the foot.', 'Footwork blurs in the faster sections.',
      'Foot placement is a bit wide.', 'Work on closing the feet more completely.',
      'Losing the footwork detail in turns.', 'Heel leads need more commitment.',
    ],
  },
  Timing: {
    up: [
      'Good timing.', 'Stays with the music.', 'Solid musical timing.', 'Connects well to the beat.',
      'Rhythmically steady.', 'Timing holds up through the heat.', 'Right on the phrase.',
      'Good sense of the bar.', 'Tempo stays consistent.', 'Timing is dependable.',
      'Catches the accents well.', 'Moving with the rhythm, not against it.',
      'Doesn\'t rush or drag.', 'Timing is an asset here.',
    ],
    down: [
      'Watch your timing.', 'Stay closer to the beat.', 'Timing drifts at moments.',
      'Listen more carefully to the music.', 'Tempo awareness needs work.',
      'Getting ahead of the music.', 'Falling slightly behind the beat.',
      'Rushing through the transitions.', 'Slow down and find the pulse.',
      'Count through the pattern more carefully.', 'The timing breaks down in the turns.',
      'Needs to settle into the rhythm earlier.', 'Musical cues are being missed.',
      'Work on hearing the downbeat more clearly.',
    ],
  },
  Connection: {
    up: [
      'Good connection.', 'Partners move as a unit.', 'Natural give-and-take.',
      'Partnership reads well.', 'Responsive to each other.', 'Connection is relaxed and clear.',
      'Good physical communication.', 'Neither partner is forcing it.',
      'Weight sharing is working.', 'Partnership feels settled.',
      'Movement flows between partners.', 'There\'s real listening happening here.',
      'The connection looks comfortable.', 'Partners stay with each other through transitions.',
    ],
    down: [
      'Work on partner connection.', 'Listen more to your partner.', 'Connection needs more sensitivity.',
      'Give more attention to your partner.', 'Partnership feels a bit separate.',
      'Too much independence in the movement.', 'Connection drops during footwork.',
      'Grip is too tight — give a little more.',  'Physical connection needs to be more consistent.',
      'Not enough give-and-take in the frame.', 'Both partners need to soften a bit.',
      'Communication breaks down in the faster sections.', 'The partnership needs more settling time.',
      'Following the lead more closely would help.',
    ],
  },
  Expression: {
    up: [
      'Good presence.', 'Genuine expression.', 'Carries the character well.',
      'Stage presence is building.', 'Performance reads from a distance.', 'Expression is natural.',
      'Comfortable in the performance space.', 'The dancing has personality.',
      'Eyes are engaged.', 'Reads as a performer, not just a technician.',
      'Character comes through in the movement.', 'Performance has intention behind it.',
      'Nice contrast between sections.', 'The story is there.',
    ],
    down: [
      'Work on expression.', 'Connect more to the music.', 'Let the movement carry more feeling.',
      'Expression can be more varied.', 'More engagement with the performance.',
      'Looks a bit internal — open it up.', 'Expression fades in the second half.',
      'The technique is there but the performance isn\'t yet.', 'Think about what the dance is saying.',
      'Eyes could be more present.', 'The dancing needs more intentionality.',
      'Work on differentiating sections of the music.', 'More dynamic contrast would help.',
      'The performance gets cautious under pressure.',
    ],
  },
  Frame: {
    up: [
      'Good frame.', 'Frame holds up well.', 'Consistent shape throughout.',
      'Frame is controlled.', 'Solid and stable frame.', 'Frame stays organized.',
      'Arms are holding their position.', 'Frame doesn\'t waver.',
      'Elbow height is maintained.', 'Frame is active throughout.',
      'Good shoulder placement.', 'Frame supports the partnership well.',
      'Shape is clear and readable.', 'Frame is steady under pressure.',
    ],
    down: [
      'Frame needs attention.', 'Work on maintaining shape.', 'Frame collapses at moments.',
      'Keep the frame more consistent.', 'Arms and shoulders need steadying.',
      'Elbows are dropping.', 'Left side of the frame needs work.',
      'Frame breaks down in the turns.', 'Shoulders are creeping up.',
      'Frame gets soft on the footwork.', 'Work on keeping the frame active through the whole heat.',
      'Right arm loses its shape.', 'The frame needs to feel more three-dimensional.',
      'Don\'t let the frame become passive.',
    ],
  },
  'Leads & Follows': {
    up: [
      'Clear leading and following.', 'Communication reads well.', 'Lead and follow are in sync.',
      'Responses are timely.', 'Good exchange of weight and intention.',
      'Partnership communication is reliable.', 'Lead is clear and followable.',
      'Following is attentive and responsive.', 'Cues are being sent and received.',
      'Neither partner is overriding the other.', 'The lead has good clarity.',
      'Following doesn\'t anticipate — it responds.', 'The dynamic between partners is working.',
      'Timing of the lead and follow is matched.',
    ],
    down: [
      'Lead/follow needs clarity.', 'Leads can be more deliberate.', 'Following needs more attention.',
      'Work on the partnership communication.', 'Responses are a beat behind at times.',
      'Following is anticipating rather than responding.', 'Leads are too subtle.',
      'Too much back-leading happening.', 'Following is rushing the lead.',
      'The lead needs to be more committed.', 'Give more time for the follow to respond.',
      'Leads and follows need to be more matched.', 'The direction of the lead is unclear at times.',
      'Work on making the weight shifts more deliberate.',
    ],
  },
  Musicality: {
    up: [
      'Good musicality.', 'Moves with the phrase.', 'Interprets the music well.',
      'Musical instincts are there.', 'Responds to dynamics and rhythm.', 'Phrasing is considered.',
      'Catches the accents.', 'Movement reflects the character of the music.',
      'Sensitive to tempo changes.', 'Dynamics in the movement match the music.',
      'Good sense of phrase and breath.', 'The music is guiding the movement.',
      'Comfortable with the musical structure.', 'Moves with the melody, not just the beat.',
    ],
    down: [
      'Work on musicality.', 'Listen more carefully to the music.', 'Try to interpret the phrase more.',
      'Movement and music are sometimes separate.', 'Work on matching dynamics to the music.',
      'The dancing is a bit neutral to the music.', 'Not responding to the accents.',
      'More contrast between loud and soft sections.', 'The phrasing needs more shape.',
      'Movement doesn\'t reflect the mood of the music.', 'Try highlighting a few moments in the music.',
      'Work on finding the breath in the phrasing.', 'Moving through the music rather than with it.',
      'The musical structure is being ignored a bit.',
    ],
  },
}

// Deterministic pick: same inputs always produce the same comment
export function getComment(categoryName: string, sentiment: 'up' | 'down', studentId: number, heatId: number, categoryId: number): string {
  const list = (COMMENTS[categoryName] ?? COMMENTS.default)[sentiment]
  const seed = (studentId * 31 + heatId * 17 + categoryId * 7 + (sentiment === 'up' ? 0 : 1)) % list.length
  return list[Math.abs(seed)]
}
