import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Palette,
  PencilRuler,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { LogoutButton } from './logout-button';

export function Shell({ children, user }: { children: React.ReactNode; user: { name: string; role: string } }) {
  const links = <>
    <Link href="/dashboard"><LayoutDashboard /> Dashboard</Link>
    <Link href="/courses"><BookOpen /> Courses</Link>
    <Link href="/certificates"><GraduationCap /> Certificates</Link>
    {user.role === 'ADMIN' && <Link href="/admin/builder"><PencilRuler /> Course Studio</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/quiz-results"><BarChart3 /> Quiz Results</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/certificates"><ShieldCheck /> Certificate Records</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/certificate-designer"><Palette /> Certificate Designer</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/users"><Users /> Users</Link>}
  </>;

  return <div className="app-shell">
    <header>
      <Link href="/dashboard" className="brand"><span className="brand-mark"><GraduationCap /></span><span>Elixir Academy</span></Link>
      <details className="mobile-menu"><summary aria-label="Open navigation"><Menu /></summary><nav>{links}<LogoutButton /></nav></details>
      <nav className="desktop-nav">{links}<span className="user-chip">{user.name}</span><LogoutButton /></nav>
    </header>
    <main className="container">{children}</main>
    <footer><span>We Are Elixir Academy</span><span>Learn. Grow. Create.</span></footer>
  </div>;
}
