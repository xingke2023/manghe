export default function PublishLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{ maxWidth: 480, margin: '0 auto' }}>
      {children}
    </div>
  );
}
