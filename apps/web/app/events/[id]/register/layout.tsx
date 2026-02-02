// This layout file exists to prevent the parent layout from applying authentication
// to the public registration page

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
