import ListenerArt from './ListenerArt'
import MentorArt from './MentorArt'
import PathfinderArt from './PathfinderArt'


export default function PersonaArt({
  persona,
}) {
  if (persona === 'mayak') {
    return <ListenerArt />
  }

  if (persona === 'kompas') {
    return <MentorArt />
  }

  return <PathfinderArt />
}