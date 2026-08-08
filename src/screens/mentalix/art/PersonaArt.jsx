import SemanticGlyph, {
  semanticKindForPersona,
} from '../../../components/SemanticGlyph'


export default function PersonaArt({
  persona,
}) {
  return (
    <SemanticGlyph
      kind={semanticKindForPersona(persona)}
      className="w-full h-auto"
    />
  )
}
