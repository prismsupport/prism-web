import Logo from './Logo'

export default function TopBar({ subtitle, rightContent }) {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
      <Logo subtitle={subtitle} />
      <div className="flex items-center gap-4">{rightContent}</div>
    </div>
  )
}