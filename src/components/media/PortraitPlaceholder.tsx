import logo from '../../assets/logos/popolo-logo.png'

export function PortraitPlaceholder({
  className = '',
}: {
  className?: string
}) {
  return (
    <div className={`portrait-placeholder ${className}`.trim()} aria-hidden>
      <img src={logo} alt="" />
    </div>
  )
}
