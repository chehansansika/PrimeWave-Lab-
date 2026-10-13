export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-navy-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-navy-400/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
