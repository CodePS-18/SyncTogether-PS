
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, updateProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
    setAvatar(user?.avatar || "");
    setAvatarError(false);
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const trimmedUsername = username.trim();
    const trimmedAvatar = avatar.trim();

    if (
      trimmedUsername.length < 3 ||
      trimmedUsername.length > 30
    ) {
      setProfileError(
        "Username must be between 3 and 30 characters."
      );
      return;
    }

    if (trimmedAvatar) {
      try {
        const parsedUrl = new URL(trimmedAvatar);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        setProfileError("Please enter a valid HTTP or HTTPS avatar URL.");
        return;
      }
    }

    setProfileLoading(true);

    try {
      const response = await updateProfile({
        username: trimmedUsername,
        avatar: trimmedAvatar,
      });

      setProfileMessage(
        response?.message || "Profile updated successfully!"
      );
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const displayName = username.trim() || "User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d19] text-white">

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-10 flex items-center justify-between border-b border-slate-800/80 pb-5">

          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold shadow-lg shadow-blue-500/20">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SyncTogether
              </h1>
              <p className="text-xs text-slate-500">
                Profile Settings
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </header>

        {/* Page Heading */}
        <section className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            ACCOUNT MANAGEMENT
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your Profile
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Manage your personal information, customize your profile,
            and keep your account details up to date.
          </p>
        </section>

        {/* Main Content */}
        <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.5fr]">

          {/* Profile Preview */}
          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10">

            {/* Preview Cover */}
            <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-violet-600/30">
              <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full border border-white/10" />
              <div className="absolute -right-4 -top-14 h-36 w-36 rounded-full border border-white/10" />
              <div className="absolute -left-12 -bottom-24 h-44 w-44 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="absolute left-6 top-5 text-xs font-semibold tracking-widest text-blue-200/80">
                PROFILE PREVIEW
              </div>
            </div>

            <div className="px-6 pb-6">

              {/* Avatar */}
              <div className="-mt-14 mb-4 flex items-end justify-between">

                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[5px] border-slate-900 bg-gradient-to-br from-blue-500 to-violet-600 text-4xl font-bold shadow-xl shadow-black/30">

                  {avatar && !avatarError ? (
                    <img
                      src={avatar}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    initials
                  )}

                </div>

                <span className="mb-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                  Active Account
                </span>
              </div>

              {/* User Details */}
              <h3 className="text-2xl font-bold tracking-tight">
                {displayName}
              </h3>

              <p className="mt-1 break-all text-sm text-slate-400">
                {user?.email || "No email available"}
              </p>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    SyncTogether Member
                  </p>
                  <p className="text-xs text-slate-500">
                    Your account is ready to collaborate.
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div className="mt-6 border-t border-slate-800 pt-5">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Account Details
                </h4>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-400">
                    Account Status
                  </span>
                  <span className="text-sm font-medium text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-400">
                    Email Status
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    Registered
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-400">
                    Platform
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    SyncTogether
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* Profile Form */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/10 sm:p-8">

            <div className="mb-7 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  Profile Information
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Update your public profile details.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setProfileMessage("");
                    setProfileError("");
                  }}
                  minLength={3}
                  maxLength={30}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter your username"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Choose a unique username.</span>
                  <span>{username.length}/30</span>
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-sm text-slate-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Your registered email address cannot be changed.
                </p>
              </div>

              {/* Avatar URL */}
              <div>
                <label
                  htmlFor="avatar"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Avatar Image URL
                </label>

                <input
                  id="avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    setAvatarError(false);
                    setProfileMessage("");
                    setProfileError("");
                  }}
                  maxLength={2048}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="https://example.com/avatar.jpg"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Use a publicly accessible image URL to customize your avatar.
                </p>
              </div>

              {/* Error */}
              {profileError && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  <span>!</span>
                  <p>{profileError}</p>
                </div>
              )}

              {/* Success */}
              {profileMessage && (
                <div
                  role="status"
                  className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
                >
                  <span>✓</span>
                  <p>{profileMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center">

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
                >
                  {profileLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>

                <Link
                  to="/dashboard"
                  className="rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3.5 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </Link>

              </div>
            </form>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800/80 py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} SyncTogether. All rights reserved.
        </footer>

      </div>
    </div>
  );
};

export default Profile;
