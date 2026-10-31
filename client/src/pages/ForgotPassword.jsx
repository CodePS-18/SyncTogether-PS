
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: normalizedEmail }
      );

      setMessage(
        response.data?.message ||
        "If an account exists with this email, a password reset link will be sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d19] px-4 py-10 text-white">

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid lg:grid-cols-2">

        {/* Left Branding Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 p-10 lg:flex">

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-blue-400/10" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full border border-violet-400/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <Link to="/login" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold shadow-lg shadow-blue-500/20">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SyncTogether
              </h1>
              <p className="text-xs text-blue-200/60">
                Watch. Connect. Enjoy.
              </p>
            </div>
          </Link>

          <div className="relative my-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ACCOUNT RECOVERY
            </div>

            <h2 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Your account,
              <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                your control.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Forgot your password? Don't worry. Follow a simple
              recovery process and get back to enjoying SyncTogether
              with your friends.
            </p>

            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-xl">
                  ✉
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Email Verification
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Receive a secure password reset link.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                  ♧
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Secure Recovery
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Reset your password through a protected link.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} SyncTogether. All rights reserved.
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">

          <div className="w-full max-w-md">

            {/* Mobile Branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold">
                S
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  SyncTogether
                </h1>
                <p className="text-xs text-slate-500">
                  Watch. Connect. Enjoy.
                </p>
              </div>
            </div>

            {/* Icon */}
            <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <path d="M12 15v3" />
              </svg>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                PASSWORD RECOVERY
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Forgot your
                <span className="block text-blue-400">
                  password?
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your registered email address. We'll send you
                instructions to reset your password.
              </p>
            </div>

            {/* Success Message */}
            {message && (
              <div
                role="status"
                className="mb-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
              >
                <span>✓</span>
                <p>{message}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

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
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setMessage("");
                    setError("");
                  }}
                  placeholder="Enter your registered email"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            {/* Back to Login */}
            <div className="mt-8 border-t border-slate-800 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Back to Sign In
                </Link>
              </p>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-slate-600 lg:hidden">
              © {new Date().getFullYear()} SyncTogether. All rights reserved.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
