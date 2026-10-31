
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import roomService from "../services/roomService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeNav, setActiveNav] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [copiedRoom, setCopiedRoom] = useState("");

  const username = user?.username || "User";
  const email = user?.email || "No email available";
  const avatar = user?.avatar || "";
  const currentUserId = String(user?._id || user?.id || "");

  const initials = username
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // FETCH USER ROOMS
  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      setRoomsError("");

      const response = await roomService.getMyRooms();
      setRooms(response.rooms || []);
    } catch (error) {
      console.error("Dashboard rooms error:", error);

      setRoomsError(
        error.response?.data?.message ||
        "Unable to load your rooms. Please try again."
      );
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // NAVIGATION
  const navigation = [
    {
      name: "Home",
      icon: "⌂",
      action: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    },
    {
      name: "Create Room",
      icon: "＋",
      action: () => navigate("/create-room"),
    },
    {
      name: "Join Room",
      icon: "↗",
      action: () => navigate("/join-room"),
    },
    {
      name: "Account",
      icon: "♙",
      action: () => {
        document
          .getElementById("account")
          ?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      name: "Profile Settings",
      icon: "⚙",
      action: () => navigate("/profile"),
    },
  ];

  const handleNavigation = (item) => {
    setActiveNav(item.name);
    setMenuOpen(false);
    item.action();
  };

  // COPY ROOM CODE
  const handleCopyRoomCode = async (roomCode) => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedRoom(roomCode);

      setTimeout(() => {
        setCopiedRoom((current) =>
          current === roomCode ? "" : current
        );
      }, 2000);
    } catch (error) {
      console.error("Copy room code error:", error);
    }
  };

  // COPY INVITE LINK
  const handleCopyInviteLink = async (roomCode) => {
    try {
      const inviteLink = `${window.location.origin}/room/${roomCode}`;

      await navigator.clipboard.writeText(inviteLink);
      setCopiedRoom(`link-${roomCode}`);

      setTimeout(() => {
        setCopiedRoom((current) =>
          current === `link-${roomCode}` ? "" : current
        );
      }, 2000);
    } catch (error) {
      console.error("Copy invite link error:", error);
    }
  };

  // DATE FORMAT
  const formatDate = (date) => {
    if (!date) return "Recently created";

    const createdDate = new Date(date);

    if (Number.isNaN(createdDate.getTime())) {
      return "Recently created";
    }

    return createdDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // FRIEND COUNT
  const friendIds = new Set();

  rooms.forEach((room) => {
    (room.participants || []).forEach((participant) => {
      const participantId = String(
        participant?._id || participant
      );

      if (participantId && participantId !== currentUserId) {
        friendIds.add(participantId);
      }
    });
  });

  const totalFriends = friendIds.size;

  // LOGOUT
  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  // AVATAR
  const Avatar = ({ size = "h-10 w-10", textSize = "text-sm" }) => (
    <div
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-400/20 bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={`${username}'s avatar`}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className={textSize}>{initials || "U"}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b19] text-white selection:bg-indigo-500/30">

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[260px] shrink-0 flex-col border-r border-slate-800/80 bg-[#081225]/90 px-4 py-7 lg:flex">

          <button
            onClick={() => handleNavigation(navigation[0])}
            className="mb-12 flex items-center gap-3 px-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl shadow-lg shadow-indigo-600/20">
              ▶
            </div>

            <span className="text-[21px] font-extrabold tracking-tight">
              Sync<span className="text-indigo-400">Together</span>
            </span>
          </button>

          <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${activeNav === item.name
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                  }`}
              >
                <span className="w-6 text-center text-xl">
                  {item.icon}
                </span>
                {item.name}
              </button>
            ))}
          </nav>

          <div className="my-8 border-t border-slate-800" />

          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-lg text-indigo-300">
              ✦
            </div>

            <h3 className="font-semibold">Better Together</h3>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Great moments are better when shared with friends.
            </p>
          </div>

          <div className="mt-auto pt-8">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              <span className="text-xl">⇥</span>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* TOPBAR */}
          <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#081225]/90 px-4 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
                  ▶
                </div>

                <span className="font-bold">
                  Sync<span className="text-indigo-400">Together</span>
                </span>
              </div>

              <div className="hidden text-sm text-slate-400 lg:block">
                Workspace
                <span className="mx-2 text-slate-600">/</span>
                <span className="text-white">Dashboard</span>
              </div>

              <div className="relative ml-auto flex items-center gap-3">

                <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  <span className="text-xs font-medium text-emerald-300">
                    Online
                  </span>
                </div>

                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-800/70"
                  aria-label="Open account menu"
                  aria-expanded={menuOpen}
                >
                  <Avatar />

                  <div className="hidden text-left sm:block">
                    <p className="max-w-36 truncate text-sm font-semibold">
                      {username}
                    </p>
                    <p className="text-xs text-slate-500">
                      My Account
                    </p>
                  </div>

                  <span className="hidden text-slate-400 sm:block">
                    ⌄
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-slate-700 bg-[#101b30] p-2 shadow-2xl">

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        document
                          .getElementById("account")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      Account Information
                    </button>

                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      Profile Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE NAVIGATION */}
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-medium transition ${activeNav === item.name
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/70 text-slate-400 hover:text-white"
                    }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </header>

          {/* DASHBOARD CONTENT */}
          <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-7 sm:px-8 lg:px-10 lg:py-9">

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">

              {/* LEFT CONTENT */}
              <div className="min-w-0">

                {/* WELCOME */}
                <section className="mb-8">
                  <p className="mb-2 text-xs font-semibold tracking-[2px] text-indigo-400 sm:text-sm">
                    YOUR PERSONAL WATCH PARTY SPACE
                  </p>

                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                    Welcome back,{" "}
                    <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                      {username}
                    </span>
                    ! 👋
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                    Watch, connect and enjoy entertainment together with your friends.
                  </p>
                </section>
                <br />
                {/* CREATE AND JOIN CARDS */}
                <section className="grid gap-5 md:grid-cols-2">

                  {/* CREATE ROOM */}
                  <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-[#17265a] via-[#111c42] to-[#10172f] p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/70 hover:shadow-xl hover:shadow-indigo-950/40 sm:p-7">

                    <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition group-hover:bg-indigo-400/30" />

                    <div className="relative flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-3xl shadow-lg shadow-indigo-500/20">
                        ＋
                      </div>

                      <span className="text-5xl opacity-20 transition duration-300 group-hover:scale-110 group-hover:rotate-6">
                        🎬
                      </span>
                    </div>

                    <div className="relative mt-5">
                      <h2 className="text-xl font-bold">
                        Create a Room
                      </h2>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-indigo-100/70">
                        Start a new watch party and invite your friends to join the fun.
                      </p>

                      <button
                        onClick={() => navigate("/create-room")}
                        className="mt-6 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-950/40 transition hover:scale-105 hover:from-indigo-400 hover:to-blue-500"
                      >
                        Create Room <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* JOIN ROOM */}
                  <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#073b3b] via-[#082b32] to-[#101b30] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-xl hover:shadow-emerald-950/30 sm:p-7">

                    <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl transition group-hover:bg-emerald-400/30" />

                    <div className="relative flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-2xl shadow-lg shadow-emerald-500/20">
                        ♟
                      </div>

                      <span className="text-5xl opacity-20 transition duration-300 group-hover:scale-110">
                        👥
                      </span>
                    </div>

                    <div className="relative mt-5">
                      <h2 className="text-xl font-bold">
                        Join a Room
                      </h2>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-emerald-100/70">
                        Have a room code? Enter it and join your friends instantly.
                      </p>

                      <button
                        onClick={() => navigate("/join-room")}
                        className="mt-6 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-950/40 transition hover:scale-105 hover:from-emerald-400 hover:to-teal-400"
                      >
                        Join Room <span>→</span>
                      </button>
                    </div>
                  </div>
                </section>

                <br />
                {/* YOUR ROOMS */}
                <section className="mt-10">

                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-indigo-400">
                          ▣
                        </span>

                        <h2 className="text-xl font-bold">
                          Your Rooms
                        </h2>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Quick access to your watch parties
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400">
                      {rooms.length} {rooms.length === 1 ? "Room" : "Rooms"}
                    </span>
                  </div>

                  {/* LOADING */}
                  {roomsLoading && (
                    <div className="space-y-4">
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className="animate-pulse rounded-2xl border border-slate-800 bg-[#101c32] p-6"
                        >
                          <div className="flex items-center gap-5">
                            <div className="h-20 w-20 rounded-2xl bg-slate-800" />

                            <div className="flex-1 space-y-3">
                              <div className="h-4 w-36 rounded bg-slate-800" />
                              <div className="h-3 w-48 max-w-full rounded bg-slate-800" />
                              <div className="h-3 w-28 rounded bg-slate-800" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ERROR */}
                  {!roomsLoading && roomsError && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
                      <p className="text-sm text-rose-300">
                        {roomsError}
                      </p>

                      <button
                        onClick={fetchRooms}
                        className="mt-4 rounded-lg bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {!roomsLoading &&
                    !roomsError &&
                    rooms.length === 0 && (
                      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101c32] to-[#0b1426] p-7 sm:p-9">
                        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

                        <div className="relative flex flex-col items-center justify-center py-5 text-center">
                          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-400/20 bg-indigo-500/10 text-4xl shadow-inner shadow-indigo-500/10">
                            ▶
                          </div>

                          <h3 className="text-lg font-bold">
                            Ready for your next watch party?
                          </h3>

                          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                            Create a room to start watching together, or join an existing room using an invite code.
                          </p>

                          <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                              onClick={() => navigate("/create-room")}
                              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500"
                            >
                              + Create Room
                            </button>

                            <button
                              onClick={() => navigate("/join-room")}
                              className="rounded-xl border border-slate-700 bg-slate-800/70 px-5 py-3 text-sm font-semibold transition hover:border-emerald-500/50 hover:bg-slate-700"
                            >
                              Join with Code →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* ROOM LIST */}
                  {!roomsLoading &&
                    !roomsError &&
                    rooms.length > 0 && (
                      <div className="space-y-4">
                        {rooms.map((room) => {
                          const roomCode = room.roomCode;
                          const participants = room.participants || [];
                          const hostId = String(
                            room.host?._id || room.host || ""
                          );

                          const isHost = hostId === currentUserId;

                          return (
                            <div
                              key={room._id || roomCode}
                              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101c32] to-[#0b1426] p-5 transition duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/20 sm:p-6"
                            >
                              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                                {/* ROOM ICON */}
                                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 text-3xl sm:h-20 sm:w-20">
                                  ▶

                                  <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#101c32] bg-emerald-400" />
                                </div>

                                {/* ROOM DETAILS */}
                                <div className="min-w-0 flex-1">

                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="max-w-full truncate text-lg font-bold">
                                      {room.name || "SyncTogether Room"}
                                    </h3>

                                    {isHost && (
                                      <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                                        HOST
                                      </span>
                                    )}
                                  </div>

                                  {/* ROOM CODE */}
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                    <span className="text-slate-400">
                                      Room Code:
                                    </span>

                                    <span className="rounded-md bg-blue-500/10 px-2 py-1 font-mono font-semibold tracking-wide text-blue-400">
                                      {roomCode}
                                    </span>

                                    <button
                                      onClick={() => handleCopyRoomCode(roomCode)}
                                      title="Copy room code"
                                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                                    >
                                      {copiedRoom === roomCode ? "✓" : "▢"}
                                    </button>

                                    <button
                                      onClick={() => handleCopyInviteLink(roomCode)}
                                      title="Copy invite link"
                                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                                    >
                                      {copiedRoom === `link-${roomCode}` ? "✓" : "↗"}
                                    </button>
                                  </div>

                                  {/* PARTICIPANTS */}
                                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-base">♧</span>
                                      {participants.length}{" "}
                                      {participants.length === 1
                                        ? "Participant"
                                        : "Participants"}
                                    </span>

                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                      Active
                                    </span>
                                  </div>

                                  {/* DATE */}
                                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span className="text-indigo-400">◷</span>
                                    Created {formatDate(room.createdAt)}
                                  </div>
                                </div>

                                {/* ACTION */}
                                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                                  <button
                                    onClick={() => navigate(`/room/${roomCode}`)}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-950/30 transition hover:scale-105 hover:from-indigo-400 hover:to-blue-500"
                                  >
                                    Join Room <span>→</span>
                                  </button>

                                  <button
                                    onClick={() => handleCopyInviteLink(roomCode)}
                                    className="text-xs text-slate-500 transition hover:text-indigo-400"
                                  >
                                    {copiedRoom === `link-${roomCode}`
                                      ? "Link copied!"
                                      : "Share invite"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </section>

                <br />
                {/* FOOTER */}
                <footer className="mt-14 flex items-center justify-center gap-4 pb-4 text-xs text-slate-600">
                  <span className="hidden h-px max-w-24 flex-1 bg-slate-800 sm:block" />
                  <span className="text-base text-indigo-400">♡</span>
                  Built for friends, by a friend
                  <span className="hidden h-px max-w-24 flex-1 bg-slate-800 sm:block" />
                </footer>
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className="space-y-5">
                <br />
                {/* ACCOUNT INFORMATION */}
                <section
                  id="account"
                  className="scroll-mt-28 rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101c32] to-[#0b1426] p-5 transition hover:border-slate-700 sm:p-6"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="text-2xl text-blue-400">♙</span>
                    <h2 className="font-bold">
                      Account Information
                    </h2>
                  </div>

                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar size="h-20 w-20" textSize="text-2xl" />

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {username}
                      </h3>

                      <p className="mt-1 break-all text-xs leading-5 text-slate-400">
                        {email}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-500">
                      Welcome to your personal SyncTogether workspace.
                    </p>

                    <button
                      onClick={() => navigate("/profile")}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400/50 hover:bg-indigo-500/20"
                    >
                      ⚙ Manage Profile <span>→</span>
                    </button>
                  </div>
                </section>

                <br />
                {/* QUICK STATS */}
                <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101c32] to-[#0b1426] p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="text-2xl text-blue-400">▥</span>
                    <h2 className="font-bold">Quick Stats</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700/70 bg-slate-800/50 p-4 transition hover:border-indigo-500/40">
                      <span className="text-2xl text-indigo-400">👥</span>

                      <p className="mt-3 text-2xl font-bold tabular-nums">
                        {rooms.length}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Total Rooms
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-700/70 bg-slate-800/50 p-4 transition hover:border-indigo-500/40">
                      <span className="text-2xl text-indigo-400">♧</span>

                      <p className="mt-3 text-2xl font-bold tabular-nums">
                        {totalFriends}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Friends in Rooms
                      </p>
                    </div>
                  </div>
                </section>
                <br />
                {/* PROMOTIONAL CARD */}
                <section className="relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-700/50 via-indigo-800/50 to-purple-900/60 p-6">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-purple-400/20 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[2px] text-indigo-200">
                        The SyncTogether Experience
                      </span>

                      <span className="text-4xl">🎬</span>
                    </div>

                    <h2 className="mt-5 text-xl font-extrabold">
                      Better Together
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-indigo-100/80">
                      Movies, series and videos — share your favourite moments with friends.
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-xs font-medium text-indigo-200">
                      <span className="text-lg text-pink-400">♥</span>
                      SyncTogether
                    </div>
                  </div>
                </section>

                {/* MOBILE LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10 lg:hidden"
                >
                  ⇥ Logout
                </button>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
