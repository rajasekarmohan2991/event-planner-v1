// Chair icon SVG component for seat visualization
export function ChairIcon({
    x = 0,
    y = 0,
    rotation = 0,
    status = 'AVAILABLE',
    label = '',
    size = 20,
    onClick
}: {
    x?: number
    y?: number
    rotation?: number
    status?: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED'
    label?: string
    size?: number
    onClick?: () => void
}) {
    const colors = {
        AVAILABLE: '#10b981', // green
        RESERVED: '#f59e0b', // orange
        BOOKED: '#ef4444', // red
        BLOCKED: '#6b7280' // gray
    }

    const color = colors[status] || colors.AVAILABLE

    return (
        <g
            transform={`translate(${x}, ${y}) rotate(${rotation}, ${size / 2}, ${size / 2})`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            className="seat-icon"
        >
            {/* Chair seat */}
            <rect
                x={size * 0.2}
                y={size * 0.3}
                width={size * 0.6}
                height={size * 0.5}
                rx={size * 0.1}
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity={status === 'AVAILABLE' ? 0.8 : 0.6}
            />

            {/* Chair back */}
            <rect
                x={size * 0.25}
                y={size * 0.1}
                width={size * 0.5}
                height={size * 0.25}
                rx={size * 0.1}
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity={status === 'AVAILABLE' ? 0.8 : 0.6}
            />

            {/* Seat label */}
            {label && (
                <text
                    x={size / 2}
                    y={size * 0.6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={size * 0.35}
                    fontWeight="bold"
                    pointerEvents="none"
                >
                    {label}
                </text>
            )}

            {/* Status indicator (small dot) */}
            {status !== 'AVAILABLE' && (
                <circle
                    cx={size * 0.85}
                    cy={size * 0.15}
                    r={size * 0.12}
                    fill={status === 'BOOKED' ? '#dc2626' : '#f59e0b'}
                    stroke="#fff"
                    strokeWidth="0.5"
                />
            )}
        </g>
    )
}

// Round table seat icon (chair positioned around table)
export function TableSeatIcon({
    x = 0,
    y = 0,
    rotation = 0,
    status = 'AVAILABLE',
    label = '',
    size = 15,
    onClick
}: {
    x?: number
    y?: number
    rotation?: number
    status?: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED'
    label?: string
    size?: number
    onClick?: () => void
}) {
    const colors = {
        AVAILABLE: '#10b981',
        RESERVED: '#f59e0b',
        BOOKED: '#ef4444',
        BLOCKED: '#6b7280'
    }

    const color = colors[status] || colors.AVAILABLE

    return (
        <g
            transform={`translate(${x}, ${y}) rotate(${rotation}, 0, 0)`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            className="table-seat-icon"
        >
            {/* Simple circle for table seat */}
            <circle
                cx={0}
                cy={0}
                r={size}
                fill={color}
                stroke="#000"
                strokeWidth="1.5"
                opacity={status === 'AVAILABLE' ? 0.9 : 0.6}
            />

            {/* Seat label */}
            {label && (
                <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={size * 0.6}
                    fontWeight="bold"
                    pointerEvents="none"
                >
                    {label}
                </text>
            )}
        </g>
    )
}
