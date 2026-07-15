import Link from 'next/link';
import {
  Award, BarChart3, Bell, BookOpen, CalendarDays, FileCheck2, FolderOpen, GraduationCap,
  LayoutDashboard, Menu, MessageSquare, Palette, PencilRuler, Search, ShieldCheck, UserRound, Users
} from 'lucide-react';
import { LogoutButton } from './logout-button';

export function Shell({ children, user }: { children: React.ReactNode; user: { name: string; role: string } }) {
  const links = <>
    <Link href="/dashboard"><LayoutDashboard /> Dashboard</Link>
    <Link href="/courses"><BookOpen /> Courses</Link>
    <Link href="/assignments"><FileCheck2 /> Assignments</Link>
    <Link href="/community"><MessageSquare /> Community</Link>
    <Link href="/events"><CalendarDays /> Events</Link>
    <Link href="/certificates"><GraduationCap /> Certificates</Link>
    <Link href="/profile"><UserRound /> Profile</Link>
    <Link href="/notifications"><Bell /> Notifications</Link>
    <Link href="/search"><Search /> Search</Link>
    {user.role === 'ADMIN' && <Link href="/admin/builder"><PencilRuler /> Course Studio</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/media"><FolderOpen /> Media</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/assignments"><FileCheck2 /> Assignment Admin</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/reports"><BarChart3 /> Reports</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/certificates"><ShieldCheck /> Certificates</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/certificate-designer"><Palette /> Certificate Designer</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/quiz-results"><Award /> Quiz Results</Link>}
    {user.role === 'ADMIN' && <Link href="/admin/audit"><ShieldCheck /> Audit Log</Link>}
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
