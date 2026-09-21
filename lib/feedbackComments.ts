const COMMENTS: Record<string, { up: string[]; down: string[] }> = {
  default: {
    up: [
      'Nice work here.', 'Solid effort.', 'Good execution.', 'Well handled.', 'Coming along well.',
      'Consistent throughout.', 'Holding up nicely.', 'Reliable through the heat.',
      'Showing real improvement.', 'This is working.', 'Good awareness here.',
      'Technique is coming through.', 'Looking more comfortable.', 'Progress is showing.',
    ],
    down: [
      'This area needs attention.', 'Keep working on this.', 'Room to improve here.',
      'Focus on this in practice.', 'Worth revisiting.', 'Needs more time.',
      'Some inconsistency here.', 'Not quite there yet.', 'Give this more attention in rehearsal.',
      'This is an area to prioritize.', 'Patience and repetition will help.',
      'Keep at it.', 'More work needed here.', 'This will come with practice.',
    ],
  },
  Posture: {
    up: [
      'Good posture.', 'Upright carriage throughout.', 'Posture is holding well.',
      'Clean body line.', 'Strong and steady.', 'Lifted and organized.',
      'Posture stays consistent.', 'Nice length through the body.', 'Grounded but lifted.',
      'Posture reads well.', 'Body line is clear.', 'Carries the posture well.',
      'Stays tall throughout.', 'Posture supports the dancing.',
    ],
    down: [
      'Work on a taller posture.', 'Stay more lifted through the body.', 'Posture dips at times.',
      'Posture needs more consistency.', 'Tendency to round forward.',
      'Work on staying tall through the heat.', 'Posture breaks down at times.',
      'Body line needs more attention.', 'Work on keeping the body more upright.',
      'Head position could be steadier.', 'More lift through the torso.',
      'Posture needs to stay active.', 'Try to maintain the length throughout.',
      'Posture softens in the second half.',
    ],
  },
  Footwork: {
    up: [
      'Clean footwork.', 'Precise foot placement.', 'Footwork is tidy.',
      'Footwork is reliable.', 'Steps are landing clearly.', 'Footwork is neat.',
      'Good awareness of the floor.', 'Transitions between steps are clean.',
      'Footwork holds up at tempo.', 'Good control through the feet.',
      'Footwork is consistent.', 'Steps are well-placed.', 'Footwork is a strength.',
      'Feet are doing the right things.',
    ],
    down: [
      'Footwork needs more precision.', 'Watch the foot placement.', 'Work on cleaner steps.',
      'Footwork gets a bit rushed.', 'Steps need more care.', 'Footwork loses detail at times.',
      'Foot placement can be cleaner.', 'Work on the footwork in slower sections first.',
      'Footwork blurs a bit at tempo.', 'Steps are landing a bit flat.',
      'More attention needed underfoot.', 'Footwork is inconsistent.',
      'Work on slowing down and placing the feet well.', 'Footwork breaks down under pressure.',
    ],
  },
  Timing: {
    up: [
      'Good timing.', 'Stays with the music.', 'Solid musical timing.',
      'Connects well to the beat.', 'Rhythmically steady.', 'Timing holds up through the heat.',
      'Right on the music.', 'Tempo stays consistent.', 'Timing is dependable.',
      'Moves with the rhythm.', 'Doesn\'t rush or drag.', 'Timing is reliable.',
      'Stays on the beat throughout.', 'Timing is a strength here.',
    ],
    down: [
      'Watch your timing.', 'Stay closer to the beat.', 'Timing drifts at moments.',
      'Listen more carefully to the music.', 'Tempo awareness needs work.',
      'Getting a bit ahead of the music.', 'Falling slightly behind at times.',
      'Rushing through sections.', 'Slow down and find the pulse.',
      'Timing breaks down in places.', 'Needs to settle into the rhythm.',
      'More awareness of the music needed.', 'Work on staying with the beat.',
      'Timing is inconsistent through the heat.',
    ],
  },
  Connection: {
    up: [
      'Good connection.', 'Partners move well together.', 'Natural give-and-take.',
      'Partnership reads well.', 'Responsive to each other.', 'Connection is clear.',
      'Good communication between partners.', 'Partnership feels settled.',
      'Movement flows between partners.', 'The connection looks comfortable.',
      'Partners stay with each other.', 'Connection is a strength here.',
      'Partnership works well together.', 'Good awareness of each other.',
    ],
    down: [
      'Work on partner connection.', 'Listen more to your partner.', 'Connection needs more sensitivity.',
      'Give more attention to your partner.', 'Partnership feels a bit separate.',
      'Too independent in places.', 'Connection drops at times.',
      'Work on staying more connected.', 'Communication needs to be more consistent.',
      'Both partners need to be more aware of each other.',
      'Connection breaks down in the faster sections.', 'Work on the partnership.',
      'More attentiveness to your partner would help.', 'Partnership needs more time together.',
    ],
  },
  Expression: {
    up: [
      'Good presence.', 'Genuine expression.', 'Carries the character well.',
      'Stage presence is building.', 'Performance reads well.', 'Expression is natural.',
      'Comfortable on the floor.', 'The dancing has personality.',
      'Reads as a performer.', 'Character comes through.',
      'Performance has intention.', 'Nice variety in the movement.',
      'The performance is there.', 'Expression is growing.',
    ],
    down: [
      'Work on expression.', 'Connect more to the music.', 'Let the movement say more.',
      'Expression can be more varied.', 'More engagement with the performance.',
      'Open it up a bit.', 'The performance side needs more work.',
      'Think about what the dance is communicating.', 'More presence on the floor.',
      'Expression fades at times.', 'More contrast in the movement would help.',
      'The dancing is a bit neutral.', 'Work on performing, not just executing.',
      'More investment in the performance.',
    ],
  },
  Frame: {
    up: [
      'Good frame.', 'Frame holds up well.', 'Consistent shape throughout.',
      'Frame is controlled.', 'Solid and stable frame.', 'Frame stays organized.',
      'Frame doesn\'t waver.', 'Frame is active throughout.',
      'Frame supports the partnership well.', 'Shape is clear.',
      'Frame is steady.', 'Frame is a strength here.',
      'Good shape overall.', 'Frame stays where it should.',
    ],
    down: [
      'Frame needs attention.', 'Work on maintaining shape.', 'Frame softens at moments.',
      'Keep the frame more consistent.', 'Arms and shoulders need steadying.',
      'Frame breaks down at times.', 'Work on keeping the frame active.',
      'Shape drifts through the heat.', 'Frame gets a bit passive.',
      'Work on the overall shape.', 'Frame needs to be more consistent.',
      'Arms need to stay more organized.', 'Frame is inconsistent.',
      'Shape needs more attention in practice.',
    ],
  },
  'Leads & Follows': {
    up: [
      'Clear leading and following.', 'Communication reads well.', 'Lead and follow are in sync.',
      'Responses are timely.', 'Good communication between partners.',
      'Lead is clear.', 'Following is attentive.', 'Cues are working.',
      'Neither partner is forcing it.', 'The lead and follow balance is good.',
      'Following is responsive.', 'The dynamic between partners is working.',
      'Lead and follow are well matched.', 'Communication is a strength here.',
    ],
    down: [
      'Lead/follow needs more clarity.', 'Leads can be more deliberate.', 'Following needs more attention.',
      'Work on the communication between partners.', 'Responses are a bit slow at times.',
      'Leads need to be clearer.', 'Following needs to be more attentive.',
      'More give-and-take needed.', 'Work on the lead and follow balance.',
      'Communication breaks down in places.', 'Leads and follows need to match better.',
      'Work on making the intentions clearer.', 'Lead/follow gets muddled at times.',
      'More patience in the lead/follow would help.',
    ],
  },
  Musicality: {
    up: [
      'Good musicality.', 'Moves with the music.', 'Interprets the music well.',
      'Musical instincts are there.', 'Responds to the rhythm well.', 'Phrasing is considered.',
      'Moving with the music.', 'Movement reflects the music.',
      'Sensitive to the music.', 'Good sense of phrase.',
      'The music is guiding the movement.', 'Comfortable with the music.',
      'Movement and music are connected.', 'Musicality is a strength here.',
    ],
    down: [
      'Work on musicality.', 'Listen more carefully to the music.', 'Try to move with the music more.',
      'Movement and music drift apart at times.', 'Work on matching the music more closely.',
      'The dancing is a bit separate from the music.', 'More response to the music needed.',
      'The music isn\'t guiding the movement enough.', 'Phrasing needs more shape.',
      'Work on staying connected to the music.', 'More awareness of the music needed.',
      'Movement needs to reflect the music more.', 'Musicality needs more attention.',
      'Work on listening to and moving with the music.',
    ],
  },
}

// Deterministic pick: same inputs always produce the same comment
export function getComment(categoryName: string, sentiment: 'up' | 'down', studentId: number, heatId: number, categoryId: number): string {
  const list = (COMMENTS[categoryName] ?? COMMENTS.default)[sentiment]
  const seed = (studentId * 31 + heatId * 17 + categoryId * 7 + (sentiment === 'up' ? 0 : 1)) % list.length
  return list[Math.abs(seed)]
}
