import { Outlet } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import Sidebar from "../components/common/Sidebar.jsx";

const driverLinks = [
  { label: "Dashboard", to: "/driver", end: true },
  { label: "Available Rides", to: "/driver/available-rides" },
  { label: "My Rides", to: "/driver/rides" },
  { label: "Earnings", to: "/driver/earnings" },
  { label: "Profile", to: "/driver/profile" },
];

function DriverLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="flex">
        <Sidebar links={driverLinks} />

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DriverLayout;
