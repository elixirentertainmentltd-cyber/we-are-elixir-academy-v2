import Link from 'next/link';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { LogoutButton } from './logout-button';
import styles from './shell.module.css';

type ShellUser = {
  name: string;
  role: string;
  pageColour?: string | null;
  accentColour?: string | null;
  textColour?: string | null;
  fontFamily?: string | null;
  language?: string | null;
};

type MenuLink = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

function NavigationLinks({
  links,
}: {
  links: MenuLink[];
}) {
  return (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </>
  );
}

function MobileSection({
  title,
  icon,
  links,
}: {
  title: string;
  icon: React.ReactNode;
  links: MenuLink[];
}) {
  return (
    <details className={styles.mobileSection}>
      <summary>
        <span className={styles.mobileSectionTitle}>
          {icon}
          {title}
        </span>

        <ChevronDown
          className={styles.mobileChevron}
          aria-hidden="true"
        />
      </summary>

      <div className={styles.mobileSectionLinks}>
        <NavigationLinks links={links} />
      </div>
    </details>
  );
}

export function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ShellUser;
}) {
  const themeStyle = {
    '--page-colour': user.pageColour || '#f7faff',
    '--accent-colour': user.accentColour || '#246bfd',
    '--text-colour': user.textColour || '#10243e',
    '--user-font': user.fontFamily || 'Arial',
  } as React.CSSProperties;

  const learningLinks: MenuLink[] = [
    {
      href: '/courses',
      label: 'Courses',
      icon: <BookOpen aria-hidden="true" />,
    },
    {
      href: '/assignments',
      label: 'Assignments',
      icon: <FileCheck2 aria-hidden="true" />,
    },
    {
      href: '/certificates',
      label: 'Certificates',
      icon: <GraduationCap aria-hidden="true" />,
    },
  ];

  const communityLinks: MenuLink[] = [
    {
      href: '/community',
      label: 'Discussions',
      icon: <MessageSquare aria-hidden="true" />,
    },
    {
      href: '/events',
      label: 'Events',
      icon: <CalendarDays aria-hidden="true" />,
    },
  ];

  const accountLinks: MenuLink[] = [
    {
      href: '/profile',
      label: 'My profile',
      icon: <UserRound aria-hidden="true" />,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings aria-hidden="true" />,
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: <Bell aria-hidden="true" />,
    },
  ];

  const adminLinks: MenuLink[] = [
    {
      href: '/admin/builder',
      label: 'Course Studio',
    },
    {
      href: '/admin/categories',
      label: 'Categories',
    },
    {
      href: '/admin/users',
      label: 'Users',
    },
    {
      href: '/admin/quiz-results',
      label: 'Quiz Results',
    },
    {
      href: '/admin/certificates',
      label: 'Certificate Records',
    },
    {
      href: '/admin/certificate-designer',
      label: 'Certificate Designer',
    },
    {
      href: '/admin/assignments',
      label: 'Assignments',
    },
    {
      href: '/admin/media',
      label: 'Media',
    },
    {
      href: '/admin/reports',
      label: 'Reports',
    },
    {
      href: '/admin/audit',
      label: 'Audit Log',
    },
  ];

  return (
    <div
      className="app-shell themed-shell"
      style={themeStyle}
      lang={user.language || 'en'}
    >
      <header className={styles.header}>
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">
            <GraduationCap aria-hidden="true" />
          </span>

          <span>Elixir Academy</span>
        </Link>

        <details className={styles.mobileMenu}>
          <summary
            className={styles.mobileMenuButton}
            aria-label="Open navigation menu"
          >
            <Menu aria-hidden="true" />
            <span>Menu</span>
          </summary>

          <div className={styles.mobilePanel}>
            <div className={styles.mobileUser}>
              <span className={styles.mobileAvatar}>
                {user.name.trim().charAt(0).toUpperCase() || 'E'}
              </span>

              <div>
                <strong>{user.name}</strong>
                <small>
                  {user.role === 'ADMIN'
                    ? 'Administrator'
                    : 'Learner'}
                </small>
              </div>
            </div>

            <nav className={styles.mobileNav}>
              <Link
                className={styles.mobileTopLink}
                href="/dashboard"
              >
                <LayoutDashboard aria-hidden="true" />
                <span>Dashboard</span>
              </Link>

              <MobileSection
                title="Learning"
                icon={<BookOpen aria-hidden="true" />}
                links={learningLinks}
              />

              <MobileSection
                title="Community"
                icon={<MessageSquare aria-hidden="true" />}
                links={communityLinks}
              />

              <MobileSection
                title="Account"
                icon={<UserRound aria-hidden="true" />}
                links={accountLinks}
              />

              {user.role === 'ADMIN' && (
                <MobileSection
                  title="Admin"
                  icon={<ShieldCheck aria-hidden="true" />}
                  links={adminLinks}
                />
              )}

              <Link
                className={styles.mobileTopLink}
                href="/search"
              >
                <Search aria-hidden="true" />
                <span>Search</span>
              </Link>

              <div className={styles.mobileLogout}>
                <LogoutButton />
              </div>
            </nav>
          </div>
        </details>

        <nav className="desktop-nav tidy-nav">
          <Link href="/dashboard">
            <LayoutDashboard aria-hidden="true" />
            Dashboard
          </Link>

          <details className="nav-dropdown">
            <summary>
              Learning
              <ChevronDown aria-hidden="true" />
            </summary>

            <div>
              <NavigationLinks links={learningLinks} />
            </div>
          </details>

          <details className="nav-dropdown">
            <summary>
              Community
              <ChevronDown aria-hidden="true" />
            </summary>

            <div>
              <NavigationLinks links={communityLinks} />
            </div>
          </details>

          <details className="nav-dropdown">
            <summary>
              Account
              <ChevronDown aria-hidden="true" />
            </summary>

            <div>
              <NavigationLinks links={accountLinks} />
            </div>
          </details>

          {user.role === 'ADMIN' && (
            <details className="nav-dropdown">
              <summary>
                <ShieldCheck aria-hidden="true" />
                Admin
                <ChevronDown aria-hidden="true" />
              </summary>

              <div>
                <NavigationLinks links={adminLinks} />
              </div>
            </details>
          )}

          <Link href="/search">
            <Search aria-hidden="true" />
            Search
          </Link>

          <span className="user-chip">{user.name}</span>

          <LogoutButton />
        </nav>
      </header>

      <main className="container">{children}</main>

      <footer>
        <span>We Are Elixir Academy</span>
        <span>Learn. Grow. Create.</span>
      </footer>
    </div>
  );
}
