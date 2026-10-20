import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { changePassword, updateProfile } from "../../api/authApi.js";

function Profile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileLoading(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const response = await updateProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      });

      const updatedUser = response?.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);

        setProfile({
          name: updatedUser.name || "",
          phone: updatedUser.phone || "",
        });
      }

      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      setProfileError(
        error?.response?.data?.message || "Unable to update profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (passwords.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);

      setPasswordMessage("Password changed successfully.");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);

      setPasswordError(
        error?.response?.data?.message || "Unable to change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>

        <p className="mt-1 text-sm text-gray-400">
          Manage your RideSync account.
        </p>
      </div>

      {/* Account Information */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update your basic account information.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={profile.name}
              onChange={handleProfileChange}
              required
              minLength={2}
              maxLength={50}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-gray-500"
            />

            <p className="mt-2 text-xs text-gray-600">
              Email changes require verification and are not available here.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={handleProfileChange}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Account Type
            </label>

            <div className="rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm capitalize text-gray-400">
              {user?.role || "Passenger"}
            </div>
          </div>

          {profileMessage && (
            <p className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              {profileMessage}
            </p>
          )}

          {profileError && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {profileError}
            </p>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Change Password</h2>

          <p className="mt-1 text-sm text-gray-500">
            Use a strong password that you don't reuse elsewhere.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {/* Current password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Current Password
            </label>

            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* New password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              New Password
            </label>

            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {passwordMessage && (
            <p className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              {passwordMessage}
            </p>
          )}

          {passwordError && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {passwordError}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Profile;
