export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="inventory-module">
      {children}
    </div>
  )
}