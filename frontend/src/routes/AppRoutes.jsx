import { BrowserRouter, Routes, Route } from "react-router-dom";

import NotFound from "../pages/NotFound.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

import HomeRedirect from "./HomeRedirect.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import PassengerLayout from "../layouts/PassengerLayout.jsx";
import DriverLayout from "../layouts/DriverLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

import PassengerDashboard from "../pages/passenger/Dashboard.jsx";
import DriverDashboard from "../pages/driver/Dashboard.jsx";
import AdminDashboard from "../pages/admin/Dashboard.jsx";
import RequestRide from "../pages/passenger/RequestRide.jsx";
import RideDetails from "../pages/passenger/RideDetails.jsx";
import Rides from "../pages/passenger/Rides.jsx";
import Profile from "../pages/passenger/Profile.jsx";
import AvailableRides from "../pages/driver/AvailableRides.jsx";
import DriverRides from "../pages/driver/Rides.jsx";
import DriverEarnings from "../pages/driver/Earnings.jsx";
import DriverProfile from "../pages/driver/Profile.jsx";
import DriverVerification from "../pages/admin/DriverVerification.jsx";
import DriverManagement from "../pages/admin/DriverManagement.jsx";
import UserManagement from "../pages/admin/UserManagement.jsx";
import RideManagement from "../pages/admin/RideManagement.jsx";
import PaymentManagement from "../pages/admin/PaymentMangement.jsx";
import ComplaintManagement from "../pages/admin/ComplaintManagement.jsx";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* Passenger */}
        <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
          <Route path="/passenger" element={<PassengerLayout />}>
            <Route index element={<PassengerDashboard />} />
            <Route path="request-ride" element={<RequestRide />} />
            <Route path="rides" element={<Rides />} />
            <Route path="rides/:rideId" element={<RideDetails />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Driver */}
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver" element={<DriverLayout />}>
            <Route index element={<DriverDashboard />} />
            <Route path="available-rides" element={<AvailableRides />} />
            <Route path="rides" element={<DriverRides />} />
            <Route path="earnings" element={<DriverEarnings />} />
            <Route path="profile" element={<DriverProfile />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="drivers" element={<DriverVerification />} />
            <Route path="drivers/manage" element={<DriverManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="rides" element={<RideManagement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="complaints" element={<ComplaintManagement />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
