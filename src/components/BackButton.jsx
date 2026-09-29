import ScreenBack from './ScreenBack'

export default function BackButton({ onClick, className = '' }) {
  return <ScreenBack onBack={onClick} className={className} />
}
