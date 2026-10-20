import { NavLink } from "react-router-dom";

function Sidebar({ links = [] }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-gray-800 bg-gray-900 min-h-[calc(100vh-4rem)]">
      <nav className="w-full p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
