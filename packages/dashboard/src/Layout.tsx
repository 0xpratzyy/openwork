import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/agents', label: 'Agents' },
  { to: '/integrations', label: 'Integrations' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/logs', label: 'Logs' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-6">OpenWork</h1>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
