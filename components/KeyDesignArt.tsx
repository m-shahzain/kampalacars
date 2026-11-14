import type { KeyDesignId } from '@/lib/key-service'

// Simple drawings of each key type, so customers can match the key they have.
const BODY = '#1f2937'
const BUTTON = '#4b5563'
const BLADE = '#d1d5db'
const BLADE_EDGE = '#9ca3af'
const GOLD = '#eab308'

/** A key blade with cut teeth, starting at x and running to the right. */
function Blade({ x, y = 34, length = 92 }: { x: number; y?: number; length?: number }) {
  const end = x + length
  return (
    <path
      d={`M${x} ${y} H${end - 6} L${end} ${y + 6} L${end - 6} ${y + 12} H${end - 16} l-4 5 l-4 -5 h-8 l-4 6 l-4 -6 h-10 l-4 5 l-4 -5 H${x} Z`}
      fill={BLADE}
      stroke={BLADE_EDGE}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  )
}

/** Lock, unlock and boot buttons, stacked from top to bottom or set side by side. */
function Buttons({ cx, top, gap = 13, row = false }: { cx: number; top: number; gap?: number; row?: boolean }) {
  // Centre of each button: lock, unlock, boot.
  const at = [0, 1, 2].map((index) => (row ? { x: cx + index * gap, y: top } : { x: cx, y: top + index * gap }))
  const [lock, unlock, boot] = at
  return (
    <g>
      {at.map(({ x, y }, index) => (
        <circle key={index} cx={x} cy={y} r="5" fill={BUTTON} stroke="#6b7280" strokeWidth="1" />
      ))}
      <rect x={lock.x - 2} y={lock.y - 1} width="4" height="3" rx="0.5" fill="#fff" />
      <path d={`M${lock.x - 1.4} ${lock.y - 1} v-1.3 a1.4 1.4 0 0 1 2.8 0 v1.3`} fill="none" stroke="#fff" strokeWidth="0.8" />
      <rect x={unlock.x - 2} y={unlock.y - 1} width="4" height="3" rx="0.5" fill="#fff" />
      <path d={`M${unlock.x - 1.4} ${unlock.y - 1} v-1.3 a1.4 1.4 0 0 1 2.8 0`} fill="none" stroke="#fff" strokeWidth="0.8" />
      <path d={`M${boot.x - 2.5} ${boot.y + 1.5} h5 l-1 -3 h-3 Z`} fill="#fff" />
    </g>
  )
}

export function KeyDesignArt({ design, className }: { design: KeyDesignId; className?: string }) {
  return (
    <svg viewBox="0 0 160 80" className={className} role="img" aria-hidden="true">
      {design === 'standard' && (
        <g>
          <Blade x={50} />
          <rect x="10" y="20" width="44" height="40" rx="14" fill={BODY} />
          <circle cx="24" cy="40" r="5" fill="#fff" />
        </g>
      )}

      {design === 'transponder' && (
        <g>
          <Blade x={56} />
          <rect x="8" y="16" width="52" height="48" rx="12" fill={BODY} />
          <circle cx="20" cy="40" r="4.5" fill="#fff" />
          {/* The chip inside the head */}
          <rect x="31" y="31" width="18" height="18" rx="2.5" fill={GOLD} />
          <path d="M35 31 v-3 M40 31 v-3 M45 31 v-3 M35 49 v3 M40 49 v3 M45 49 v3" stroke={GOLD} strokeWidth="1.6" />
          <rect x="35" y="35" width="10" height="10" rx="1.5" fill="none" stroke={BODY} strokeWidth="1.2" />
        </g>
      )}

      {design === 'remote-head' && (
        <g>
          <Blade x={66} length={86} />
          <path d="M8 22 Q8 10 22 10 H58 Q70 10 70 24 V56 Q70 70 58 70 H22 Q8 70 8 58 Z" fill={BODY} />
          <Buttons cx={40} top={27} />
        </g>
      )}

      {design === 'flip' && (
        <g>
          {/* Blade flipping out of the remote */}
          <g transform="rotate(-14 84 40)">
            <Blade x={82} length={72} />
          </g>
          <rect x="6" y="18" width="84" height="44" rx="16" fill={BODY} />
          <circle cx="82" cy="40" r="7" fill={BUTTON} stroke="#6b7280" strokeWidth="1" />
          <circle cx="82" cy="40" r="2.5" fill="#9ca3af" />
          <Buttons cx={27} top={40} row />
        </g>
      )}

      {design === 'smart' && (
        <g>
          <rect x="44" y="6" width="72" height="68" rx="22" fill={BODY} />
          <rect x="52" y="14" width="56" height="52" rx="16" fill="none" stroke="#374151" strokeWidth="1.5" />
          <Buttons cx={80} top={27} />
          {/* Signal waves: works from your pocket */}
          <path d="M126 30 q6 10 0 20 M134 25 q10 15 0 30" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M34 30 q-6 10 0 20 M26 25 q-10 15 0 30" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {design === 'not-sure' && (
        <g>
          <rect x="30" y="20" width="40" height="40" rx="13" fill="none" stroke={BLADE_EDGE} strokeWidth="2" strokeDasharray="5 4" />
          <path d="M70 34 H124 L130 40 L124 46 H70" fill="none" stroke={BLADE_EDGE} strokeWidth="2" strokeDasharray="5 4" />
          <text x="50" y="48" textAnchor="middle" fontSize="24" fontWeight="700" fill={GOLD} fontFamily="system-ui, sans-serif">?</text>
        </g>
      )}
    </svg>
  )
}
