import { Outlet } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import Sidebar from "../components/common/Sidebar.jsx";

const adminLinks = [
  {
    label: "Dashboard",
    to: "/admin",
    end: true,
  },
  {
    label: "Users",
    to: "/admin/users",
  },
  {
    label: "Drivers",
    to: "/admin/drivers",
  },
  {
    label: "Rides",
    to: "/admin/rides",
  },
  {
    label: "Payments",
    to: "/admin/payments",
  },
  {
    label: "Complaints",
    to: "/admin/complaints",
  },
];

function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="flex">
        <Sidebar links={adminLinks} />

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
