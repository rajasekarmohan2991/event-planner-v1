// Auth segment layout must NOT include <html> or <body>.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
