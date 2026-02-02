export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED' | 'SELECTED'

interface SeatIconProps {
    x?: number
    y?: number
    rotation?: number
    status?: SeatStatus
    label?: string
    size?: number
    onClick?: () => void
}

const SEAT_COLORS: Record<SeatStatus, { fill: string; stroke: string }> = {
    AVAILABLE: { fill: '#ffffff', stroke: '#22c55e' }, // White with Green border
    SELECTED: { fill: '#9333ea', stroke: '#7e22ce' }, // Purple
    RESERVED: { fill: '#f59e0b', stroke: '#d97706' }, // Amber
    BOOKED: { fill: '#e2e8f0', stroke: '#94a3b8' },   // Slate 200 (Gray)
    BLOCKED: { fill: '#cbd5e1', stroke: '#64748b' }   // Slate 300
}

export function ChairIcon({
    x = 0,
    y = 0,
    rotation = 0,
    status = 'AVAILABLE',
    label = '',
    size = 20,
    onClick
}: SeatIconProps) {
    const colors = SEAT_COLORS[status] || SEAT_COLORS.AVAILABLE
    const isInteractive = status === 'AVAILABLE' || status === 'SELECTED'
    const opacity = status === 'BLOCKED' ? 0.5 : 1

    return (
        <g
            transform={`translate(${x}, ${y}) rotate(${rotation}, ${size / 2}, ${size / 2})`}
            onClick={onClick}
            style={{
                cursor: isInteractive && onClick ? 'pointer' : 'default',
                opacity
            }}
            className="seat-icon transition-colors duration-200"
        >
            {/* Shadow/Glow for selected */}
            {status === 'SELECTED' && (
                <circle cx={size / 2} cy={size / 2} r={size * 0.8} fill={colors.fill} opacity={0.3} filter="blur(4px)" />
            )}

            {/* Chair Back */}
            <path
                d={`M${size * 0.15},${size * 0.1} Q${size * 0.5},${size * 0.05} ${size * 0.85},${size * 0.1} L${size * 0.85},${size * 0.6} Q${size * 0.5},${size * 0.65} ${size * 0.15},${size * 0.6} Z`}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={1.5}
            />

            {/* Chair Seat */}
            <rect
                x={size * 0.1}
                y={size * 0.55}
                width={size * 0.8}
                height={size * 0.4}
                rx={size * 0.15}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={1.5}
            />

            {/* Armrests (optional detail for premium feel) */}
            <path
                d={`M${size * 0.1},${size * 0.6} L${size * 0.1},${size * 0.8} M${size * 0.9},${size * 0.6} L${size * 0.9},${size * 0.8}`}
                stroke={colors.stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
            />

            {/* Label */}
            {label && (
                <text
                    x={size / 2}
                    y={size * 1.4}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={size * 0.5}
                    fontWeight="600"
                    pointerEvents="none"
                    style={{ userSelect: 'none' }}
                >
                    {label}
                </text>
            )}
        </g>
    )
}

export function TableSeatIcon({
    x = 0,
    y = 0,
    rotation = 0,
    status = 'AVAILABLE',
    label = '',
    size = 15,
    onClick
}: SeatIconProps) {
    const colors = SEAT_COLORS[status] || SEAT_COLORS.AVAILABLE
    const isInteractive = status === 'AVAILABLE' || status === 'SELECTED'

    return (
        <g
            transform={`translate(${x}, ${y}) rotate(${rotation}, 0, 0)`}
            onClick={onClick}
            style={{ cursor: isInteractive && onClick ? 'pointer' : 'default' }}
            className="table-seat-icon"
        >
            {/* Glow for selected */}
            {status === 'SELECTED' && (
                <circle cx={0} cy={0} r={size * 1.2} fill={colors.fill} opacity={0.3} filter="blur(3px)" />
            )}

            <circle
                cx={0}
                cy={0}
                r={size}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={2}
            />
            {label && (
                <text
                    x={0}
                    y={0}
                    dy={size * 0.1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={status === 'SELECTED' ? '#fff' : '#64748b'}
                    fontSize={size * 0.7}
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{ userSelect: 'none' }}
                >
                    {label}
                </text>
            )}
        </g>
    )
}
