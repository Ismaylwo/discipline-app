import "./globals.css";

export const metadata = {
  title: "Discipline",
  description: "Tasks / Projects / Habits / Notes"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
