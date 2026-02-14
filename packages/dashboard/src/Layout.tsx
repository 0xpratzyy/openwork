import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Plug, Bot, ShieldCheck, ListTodo, Activity, Settings, BookOpen } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const pageTitle: Record<string, string> = {
  '/': 'Home',
  '/agents': 'Agents',
  '/integrations': 'Integrations',
  '/approvals': 'Approvals',
  '/tasks': 'Tasks',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  const title = pageTitle[location.pathname] || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-60 bg-dark-sidebar border-r border-dark-border flex flex-col">
        <div className="p-5 border-b border-dark-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            OpenWork
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">AI Team Dashboard</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-hover'
                }`
              }
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-dark-border">
          <a
            href="https://github.com/nicepkg/openwork"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Docs
          </a>
          <p className="text-xs text-gray-700 mt-1">v0.1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-dark-border flex items-center px-6">
          <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
