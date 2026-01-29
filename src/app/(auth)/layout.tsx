export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
