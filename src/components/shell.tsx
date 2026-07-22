import Link from 'next/link';
import { Bell, BookOpen, CalendarDays, ChevronDown, FileCheck2, GraduationCap, LayoutDashboard, Menu, MessageSquare, Search, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { LogoutButton } from './logout-button';

type ShellUser={name:string;role:string;pageColour?:string|null;accentColour?:string|null;textColour?:string|null;fontFamily?:string|null};

export function Shell({children,user}:{children:React.ReactNode;user:ShellUser}){
 const style={
  '--page-colour':user.pageColour||'#080812','--accent-colour':user.accentColour||'#8b5cf6','--text-colour':user.textColour||'#f8fafc','--user-font':user.fontFamily||'Arial'
 } as React.CSSProperties;
 const learning=<><Link href="/courses"><BookOpen/>Courses</Link><Link href="/assignments"><FileCheck2/>Assignments</Link><Link href="/certificates"><GraduationCap/>Certificates</Link></>;
 const community=<><Link href="/community"><MessageSquare/>Discussions</Link><Link href="/events"><CalendarDays/>Events</Link></>;
 const account=<><Link href="/profile"><UserRound/>My profile</Link><Link href="/settings"><Settings/>Settings</Link><Link href="/notifications"><Bell/>Notifications</Link></>;
 const admin=user.role==='ADMIN'?<><Link href="/admin/builder">Course Studio</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/users">Users</Link><Link href="/admin/quiz-results">Quiz Results</Link><Link href="/admin/certificates">Certificate Records</Link><Link href="/admin/certificate-designer">Certificate Designer</Link><Link href="/admin/assignments">Assignments</Link><Link href="/admin/media">Media</Link><Link href="/admin/reports">Reports</Link><Link href="/admin/audit">Audit Log</Link><Link href="/admin/push-notifications">Push Notifications</Link></>:null;
 return <div className="app-shell themed-shell" style={style} lang="en"><header><Link href="/dashboard" className="brand" aria-label="We Are Elixir Academy dashboard"><img className="brand-logo" src="/academy-logo.png" alt="We Are Elixir Academy"/></Link><details className="mobile-menu"><summary aria-label="Open navigation"><Menu/></summary><nav><Link href="/dashboard"><LayoutDashboard/>Dashboard</Link>{learning}{community}{account}{admin}<Link href="/search"><Search/>Search</Link><LogoutButton/></nav></details><nav className="desktop-nav tidy-nav"><Link href="/dashboard"><LayoutDashboard/>Dashboard</Link><details className="nav-dropdown"><summary>Learning <ChevronDown/></summary><div>{learning}</div></details><details className="nav-dropdown"><summary>Community <ChevronDown/></summary><div>{community}</div></details><details className="nav-dropdown"><summary>Account <ChevronDown/></summary><div>{account}</div></details>{user.role==='ADMIN'&&<details className="nav-dropdown"><summary><ShieldCheck/> Admin <ChevronDown/></summary><div>{admin}</div></details>}<Link href="/search"><Search/>Search</Link><span className="user-chip">{user.name}</span><LogoutButton/></nav></header><main className="container">{children}</main><footer><img src="/academy-logo.png" alt=""/><span>Learn. Grow. Create.</span></footer></div>
}
