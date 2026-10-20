import { Outlet } from "react-router-dom";

import Navbar from "../components/common/Navbar.jsx";
import Sidebar from "../components/common/Sidebar.jsx";

const passengerLinks = [
  {
    label: "Dashboard",
    to: "/passenger",
    end: true,
  },
  {
    label: "Request Ride",
    to: "/passenger/request-ride",
  },
  {
    label: "My Rides",
    to: "/passenger/rides",
  },
  {
    label: "Profile",
    to: "/passenger/profile",
  },
];

function PassengerLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="flex">
        <Sidebar links={passengerLinks} />

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PassengerLayout;
