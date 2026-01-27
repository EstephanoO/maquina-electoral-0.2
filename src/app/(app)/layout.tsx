export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="app-shell text-foreground">{children}</div>;
}
