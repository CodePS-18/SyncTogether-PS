
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import roomService from "../services/roomService";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import VideoPlayer from "../components/VideoPlayer";

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const socket = useSocket();
  const { user } = useAuth();

  const currentUserId = String(user?._id || user?.id || "");

  const [socketConnected, setSocketConnected] = useState(
    socket?.connected ?? false
  );
  const [socketError, setSocketError] = useState("");

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomNotice, setRoomNotice] = useState("");

  const [onlineParticipants, setOnlineParticipants] = useState([]);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Room settings state
  const [showSettings, setShowSettings] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [updatingRoom, setUpdatingRoom] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  // Participant removal state
  const [removingParticipantId, setRemovingParticipantId] = useState("");
  const [removeError, setRemoveError] = useState("");

  // End room state
  const [endingRoom, setEndingRoom] = useState(false);
  const [endRoomError, setEndRoomError] = useState("");

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);

  const chatEndRef = useRef(null);

  const isHost =
    String(room?.host?._id || room?.host || "") === currentUserId;

  const formatMessageTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderAvatar = (item) => {
    if (item.sender && typeof item.sender === "object") {
      if (item.sender.avatar) return item.sender.avatar;
    }

    const senderId =
      typeof item.sender === "object"
        ? item.sender?._id
        : item.sender || item.userId;

    const participant = room?.participants?.find(
      (person) => String(person._id) === String(senderId)
    );

    return participant?.avatar || item.avatar || "";
  };

  const copyToClipboard = async (value, type) => {
    try {
      await navigator.clipboard.writeText(value);

      if (type === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      setRoomNotice("Unable to copy. Please copy it manually.");
    }
  };

  const handleCopyRoomCode = () => {
    if (room?.roomCode) {
      copyToClipboard(room.roomCode, "code");
    }
  };

  const handleCopyInviteLink = () => {
    if (room?.roomCode) {
      const inviteLink = `${window.location.origin}/room/${room.roomCode}`;
      copyToClipboard(inviteLink, "link");
    }
  };

  // UPDATE ROOM NAME (HOST ONLY)
  const handleUpdateRoomName = async (event) => {
    event.preventDefault();

    const newName = roomNameInput.trim();

    if (!newName) {
      setSettingsError("Room name is required.");
      return;
    }

    if (newName.length > 100) {
      setSettingsError("Room name cannot exceed 100 characters.");
      return;
    }

    try {
      setUpdatingRoom(true);
      setSettingsError("");

      const response = await roomService.updateRoomName(
        roomCode,
        newName
      );

      setRoom(response.room);
      setShowSettings(false);
      setRoomNotice("Room name updated successfully.");
    } catch (err) {
      setSettingsError(
        err.response?.data?.message ||
        "Failed to update room name."
      );
    } finally {
      setUpdatingRoom(false);
    }
  };

  // REMOVE PARTICIPANT (HOST ONLY)
  const handleRemoveParticipant = (participant) => {
    if (!isHost || !socket?.connected) {
      setRemoveError("You must be connected as the room host.");
      return;
    }

    const participantId = String(participant._id);

    if (participantId === currentUserId) {
      setRemoveError("You cannot remove yourself.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${participant.username} from this room?`
    );

    if (!confirmed) return;

    setRemovingParticipantId(participantId);
    setRemoveError("");

    socket.timeout(5000).emit(
      "room:remove-participant",
      {
        roomCode,
        userId: participantId,
      },
      (timeoutError, response) => {
        setRemovingParticipantId("");

        if (timeoutError) {
          setRemoveError("Server did not respond. Please try again.");
          return;
        }

        if (!response?.success) {
          setRemoveError(
            response?.message || "Could not remove participant."
          );
          return;
        }

        setRoom((previousRoom) => {
          if (!previousRoom) return previousRoom;

          return {
            ...previousRoom,
            participants: previousRoom.participants.filter(
              (item) => String(item._id) !== participantId
            ),
          };
        });

        setOnlineParticipants((previous) =>
          previous.filter((id) => id !== participantId)
        );

        setRemoveError("");
        setRoomNotice(
          `${participant.username} was removed from the room.`
        );
      }
    );
  };

  // END ROOM (HOST ONLY)
  const handleEndRoom = () => {
    if (!isHost || endingRoom) return;

    if (!socket?.connected) {
      setEndRoomError("Socket connection is not available.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to end this room? All participants will be disconnected."
    );

    if (!confirmed) return;

    setEndingRoom(true);
    setEndRoomError("");

    socket.timeout(5000).emit(
      "room:end",
      { roomCode },
      (timeoutError, response) => {
        if (timeoutError) {
          setEndingRoom(false);
          setEndRoomError(
            "Server did not respond. Please try again."
          );
          return;
        }

        if (!response?.success) {
          setEndingRoom(false);
          setEndRoomError(
            response?.message || "Could not end the room."
          );
        }

        // On success, the room:ended event redirects everyone.
      }
    );
  };

  // LOAD ROOM INFORMATION
  useEffect(() => {
    let cancelled = false;

    const loadRoom = async () => {
      try {
        const data = await roomService.getRoom(roomCode);

        if (!cancelled) {
          setRoom(data.room);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Failed to load room."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!roomCode) {
      setError("Room code is missing.");
      setLoading(false);

      return () => {
        cancelled = true;
      };
    }

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  // LISTEN FOR ROOM, CHAT AND PARTICIPANT EVENTS
  useEffect(() => {
    if (!socket || !roomCode) return;

    const normalizedRoomCode = roomCode.toUpperCase();

    // ROOM ENDED
    const handleRoomEnded = (data) => {
      if (
        data?.roomCode?.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      navigate("/dashboard", {
        replace: true,
        state: {
          message:
            data.message || "This room has been ended by the host.",
        },
      });
    };

    // USER JOINED
    const handleUserJoined = (data) => {
      if (
        data?.roomCode &&
        data.roomCode.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      setRoomNotice("A user joined the room.");

      roomService
        .getRoom(roomCode)
        .then((data) => setRoom(data.room))
        .catch((err) =>
          console.error("Failed to refresh room:", err)
        );
    };

    // USER LEFT
    const handleUserLeft = (data) => {
      if (
        data?.roomCode &&
        data.roomCode.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      setRoomNotice("A user left the room.");

      roomService
        .getRoom(roomCode)
        .then((data) => setRoom(data.room))
        .catch((err) =>
          console.error("Failed to refresh room:", err)
        );
    };

    // CHAT MESSAGE
    const handleChatMessage = (message) => {
      if (
        message?.roomCode?.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      setMessages((previousMessages) => {
        if (
          message._id &&
          previousMessages.some(
            (item) => item._id === message._id
          )
        ) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    };

    // PARTICIPANTS UPDATE
    const handleParticipantsUpdate = (data) => {
      if (
        data?.roomCode &&
        data.roomCode.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      if (Array.isArray(data?.onlineParticipants)) {
        setOnlineParticipants(
          data.onlineParticipants.map((id) =>
            String(id?._id || id?.id || id)
          )
        );
      }
    };

    // PARTICIPANT REMOVED
    const handleParticipantRemoved = (data) => {
      if (
        data?.roomCode?.toUpperCase() !== normalizedRoomCode
      ) {
        return;
      }

      navigate("/dashboard", {
        replace: true,
        state: {
          message:
            data.message ||
            "You have been removed from this room by the host.",
        },
      });
    };

    socket.on("room:ended", handleRoomEnded);
    socket.on("room:user-joined", handleUserJoined);
    socket.on("room:user-left", handleUserLeft);
    socket.on("room:participants", handleParticipantsUpdate);
    socket.on("chat:message", handleChatMessage);
    socket.on("room:participant-removed", handleParticipantRemoved);

    return () => {
      socket.off("room:ended", handleRoomEnded);
      socket.off("room:user-joined", handleUserJoined);
      socket.off("room:user-left", handleUserLeft);
      socket.off("room:participants", handleParticipantsUpdate);
      socket.off("chat:message", handleChatMessage);
      socket.off(
        "room:participant-removed",
        handleParticipantRemoved
      );
    };
  }, [socket, roomCode, navigate]);

  // CONNECT TO LIVE ROOM AND RESTORE CHAT HISTORY
  useEffect(() => {
    if (!roomCode || !socket) return;

    let active = true;

    const handleConnect = () => {
      if (!active) return;

      setSocketConnected(true);
      setSocketError("");

      socket.emit("room:join", roomCode, (response) => {
        if (!active) return;

        setChatLoading(false);

        if (!response?.success) {
          setSocketError(
            response?.message || "Could not join live room."
          );
          return;
        }

        setSocketError("");

        setMessages(
          Array.isArray(response.messages)
            ? response.messages
            : []
        );

        setOnlineParticipants(
          Array.isArray(response.onlineParticipants)
            ? response.onlineParticipants.map((id) =>
              String(id?._id || id?.id || id)
            )
            : []
        );
      });
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleConnectError = (err) => {
      setSocketConnected(false);
      setChatLoading(false);
      setSocketError(err.message || "Socket connection failed.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      active = false;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      if (socket.connected) {
        socket.emit("room:leave", roomCode);
      }
    };
  }, [socket, roomCode]);

  // SEND CHAT MESSAGE
  const handleSendMessage = (event) => {
    event?.preventDefault?.();

    const message = chatInput.trim();

    if (!message) {
      setChatError("Please enter a message.");
      return;
    }

    if (message.length > 1000) {
      setChatError("Message cannot exceed 1000 characters.");
      return;
    }

    if (!socket?.connected) {
      setChatError("Not connected. Please try again.");
      return;
    }

    setSending(true);
    setChatError("");

    socket.timeout(5000).emit(
      "chat:send",
      { roomCode, message },
      (timeoutError, response) => {
        setSending(false);

        if (timeoutError) {
          setChatError(
            "Server did not respond. Please refresh and try again."
          );
          return;
        }

        if (!response?.success) {
          setChatError(
            response?.message || "Could not send your message."
          );
          return;
        }

        setChatInput("");
      }
    );
  };

  // AUTO-SCROLL CHAT
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B16] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="mt-5 font-medium text-slate-300">
            Preparing your room...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Getting everything ready for you.
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B16] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Room Unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error || "Room information is unavailable."}
          </p>

          <Link
            to="/dashboard"
            className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const participants = room.participants || [];

  const onlineCount = participants.filter((participant) =>
    onlineParticipants.includes(String(participant._id))
  ).length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070B16] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed left-0 top-0 h-96 w-96 rounded-full bg-blue-600/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-96 w-96 rounded-full bg-violet-600/5 blur-[120px]" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0B1020]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl shadow-lg shadow-blue-900/30"
            >
              🎬
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                SyncTogether
              </h1>

              <div className="mt-0.5 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Room</span>
                <span className="font-mono font-semibold tracking-wider text-blue-400">
                  {room.roomCode}
                </span>
                <span className="text-slate-700">•</span>
                <span
                  className={
                    socketConnected
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {socketConnected ? "Live" : "Connecting"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRoomCode}
              className="rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-blue-500/50 hover:text-white sm:px-4 sm:text-sm"
            >
              {copiedCode ? "✓ Copied" : "▣ Copy Code"}
            </button>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 sm:px-4 sm:text-sm"
            >
              {copiedLink ? "✓ Copied" : "↗ Invite Friends"}
            </button>

            {isHost && (
              <button
                type="button"
                onClick={handleEndRoom}
                disabled={endingRoom || !socketConnected}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                {endingRoom ? "Ending Room..." : "End Room"}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 sm:px-4 sm:text-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {endRoomError && (
        <div className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {endRoomError}
          </p>
        </div>
      )}

      <main className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Room heading */}
        <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Private Room
              </span>

              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {socketConnected ? "Connected" : "Reconnecting"}
              </span>
            </div>

            <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {room.name}
            </h2>

            {isHost && (
              <button
                type="button"
                onClick={() => {
                  setRoomNameInput(room.name);
                  setSettingsError("");
                  setShowSettings(true);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:border-blue-400/50 hover:bg-blue-500/20"
              >
                <span>⚙️</span>
                Room Settings
              </button>
            )}

            <p className="mt-2 text-sm text-slate-400">
              Your own space to watch, chat and enjoy together.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <div className="min-w-[115px] rounded-2xl border border-white/[0.07] bg-slate-900/70 px-4 py-3">
              <p className="text-xs text-slate-500">Participants</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {participants.length}
              </p>
            </div>

            <div className="min-w-[115px] rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3">
              <p className="text-xs text-slate-500">Online now</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {onlineCount}
              </p>
            </div>

            <div className="min-w-[115px] rounded-2xl border border-blue-500/15 bg-blue-500/[0.05] px-4 py-3">
              <p className="text-xs text-slate-500">Messages</p>
              <p className="mt-1 text-2xl font-bold text-blue-400">
                {messages.length}
              </p>
            </div>
          </div>
        </section>

        {roomNotice && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
            <span>● {roomNotice}</span>
            <button
              type="button"
              onClick={() => setRoomNotice("")}
              className="text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {socketError && (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300">
            {socketError}
          </div>
        )}

        {/* Main layout */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          {/* Main content */}
          <div className="min-w-0 space-y-6">
            {/* Video player */}
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1425] shadow-2xl shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                <div>
                  <h3 className="font-semibold text-white">
                    Now Watching
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Enjoy your shared entertainment experience
                  </p>
                </div>

                <span className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  Live Session
                </span>
              </div>

              <div className="p-3 sm:p-5">
                <VideoPlayer
                  roomCode={roomCode}
                  initialVideoUrl={room.media?.url || ""}
                />
              </div>
            </section>

            <br />
            {/* Chat */}
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1425] shadow-xl shadow-black/10">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                    💬
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      Room Chat
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Talk with everyone in the room
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
                  {messages.length} messages
                </span>
              </div>

              <div
                className="h-[360px] overflow-y-auto p-4 sm:h-[420px] sm:p-6"
                aria-live="polite"
                aria-label="Chat messages"
              >
                {chatLoading ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading messages...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                      💬
                    </div>
                    <p className="mt-4 font-semibold text-slate-300">
                      It's quiet in here!
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Send the first message and start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((item, index) => {
                      const avatar = getSenderAvatar(item);
                      const initial =
                        item.username?.charAt(0).toUpperCase() || "?";

                      const senderId = String(
                        item.sender?._id ||
                        item.sender ||
                        item.userId ||
                        ""
                      );

                      const isOwnMessage =
                        senderId === currentUserId;

                      return (
                        <div
                          key={
                            item._id ||
                            `${item.createdAt}-${item.username}-${index}`
                          }
                          className={`flex items-start gap-3 ${isOwnMessage ? "flex-row-reverse" : ""
                            }`}
                        >
                          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                            <span>{initial}</span>

                            {avatar && (
                              <img
                                src={avatar}
                                alt={`${item.username}'s avatar`}
                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>

                          <div
                            className={`min-w-0 max-w-[85%] rounded-2xl border px-4 py-3 ${isOwnMessage
                              ? "rounded-tr-sm border-blue-500/25 bg-blue-500/[0.10]"
                              : "rounded-tl-sm border-white/[0.06] bg-slate-800/70"
                              }`}
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <p className="text-xs font-bold text-blue-300">
                                {item.username || "Unknown user"}
                                {isOwnMessage && (
                                  <span className="ml-1.5 font-normal text-slate-500">
                                    (You)
                                  </span>
                                )}
                              </p>

                              <span className="text-[10px] text-slate-500">
                                {formatMessageTime(item.createdAt)}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="border-t border-white/[0.06] bg-[#0A1020] p-4 sm:p-5"
              >
                <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/70 p-1.5 transition focus-within:border-blue-500/70 focus-within:ring-4 focus-within:ring-blue-500/10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => {
                      setChatInput(event.target.value);

                      if (chatError) {
                        setChatError("");
                      }
                    }}
                    placeholder="Write a message..."
                    maxLength={1000}
                    autoComplete="off"
                    aria-label="Chat message"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                  />

                  <button
                    type="submit"
                    disabled={sending || !chatInput.trim()}
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? "Sending..." : "Send"}
                    <span>➤</span>
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  {chatError ? (
                    <p role="alert" className="text-xs text-red-400">
                      {chatError}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Messages are visible to everyone in this room.
                    </p>
                  )}

                  <span className="shrink-0 text-xs text-slate-600">
                    {chatInput.length}/1000
                  </span>
                </div>
              </form>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="min-w-0 space-y-6">
            <br />
            {/* Participants */}
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1425]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
                <div>
                  <h3 className="font-semibold text-white">
                    People in this room
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Your watching squad
                  </p>
                </div>

                <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  {participants.length}
                </span>
              </div>

              <div className="p-4">
                <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">
                      Active members
                    </span>
                  </div>

                  <span className="text-sm font-bold text-emerald-400">
                    {onlineCount} online
                  </span>
                </div>

                {removeError && (
                  <p
                    role="alert"
                    className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                  >
                    {removeError}
                  </p>
                )}

                <div className="space-y-2">
                  {participants.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                      <span className="text-3xl">👥</span>
                      <p className="mt-3 text-sm font-medium text-slate-300">
                        No participants yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Invite your friends to join.
                      </p>
                    </div>
                  ) : (
                    participants.map((participant) => {
                      const participantId = String(participant._id);

                      const isOnline =
                        onlineParticipants.includes(participantId);

                      const participantIsHost =
                        String(room.host?._id || room.host) === participantId;

                      const isCurrentUser =
                        participantId === currentUserId;

                      const initial =
                        participant.username?.charAt(0).toUpperCase() || "?";

                      const isRemoving =
                        removingParticipantId === participantId;

                      return (
                        <div
                          key={participantId}
                          className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-800/40 p-3 transition hover:border-slate-700 hover:bg-slate-800/70"
                        >
                          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">
                            <span>{initial}</span>

                            {participant.avatar && (
                              <img
                                src={participant.avatar}
                                alt={`${participant.username}'s avatar`}
                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            )}

                            <span
                              className={`absolute bottom-0 right-0 z-10 h-3 w-3 rounded-full border-2 border-[#111827] ${isOnline
                                ? "bg-emerald-400"
                                : "bg-slate-500"
                                }`}
                              title={isOnline ? "Online" : "Offline"}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-slate-200">
                                {participant.username}
                              </p>

                              {isCurrentUser && (
                                <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
                                  YOU
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-1 text-[11px] ${isOnline
                                ? "text-emerald-400"
                                : "text-slate-500"
                                }`}
                            >
                              {isOnline ? "● Online" : "● Offline"}
                            </p>
                          </div>

                          {participantIsHost && (
                            <span className="shrink-0 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-blue-300">
                              Host
                            </span>
                          )}

                          {isHost && !isCurrentUser && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveParticipant(participant)
                              }
                              disabled={
                                !socketConnected ||
                                Boolean(removingParticipantId) ||
                                endingRoom
                              }
                              title={`Remove ${participant.username}`}
                              className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-2 text-[11px] font-semibold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isRemoving ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.07] px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15"
                >
                  <span>＋</span>
                  Invite more friends
                </button>
              </div>
            </section>

            <br />
            {/* Room information */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0D1425] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-lg">
                  ℹ️
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    Room Information
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Room details and access
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Room Name</p>
                  <p className="mt-1 break-words text-sm font-medium text-slate-200">
                    {room.name}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-xs text-slate-500">Room Code</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-bold tracking-widest text-blue-400">
                      {room.roomCode}
                    </p>

                    <button
                      type="button"
                      onClick={handleCopyRoomCode}
                      className="text-xs font-semibold text-slate-400 transition hover:text-blue-400"
                    >
                      {copiedCode ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-xs text-slate-500">Room Host</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {room.host?.username || "Unknown"}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <p className="text-xs text-slate-500">Connection</p>
                  <p
                    className={`mt-1 text-sm font-medium ${socketConnected
                      ? "text-emerald-400"
                      : "text-amber-400"
                      }`}
                  >
                    {socketConnected ? "● Connected" : "● Reconnecting"}
                  </p>
                </div>
              </div>
            </section>

            <br />
            {/* Invite card */}
            <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-violet-600/20 p-5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="relative">
                <div className="text-3xl">🍿</div>

                <h3 className="mt-4 text-lg font-bold text-white">
                  Better together
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Good movies are even better when shared. Bring your
                  friends into the room!
                </p>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {copiedLink ? "Invite Link Copied ✓" : "Share Room Link ↗"}
                </button>
              </div>
            </section>
            <br />
          </aside>
        </div>

        {/* ROOM SETTINGS MODAL */}
        {showSettings && isHost && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={(event) => {
              if (
                event.target === event.currentTarget &&
                !updatingRoom
              ) {
                setShowSettings(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="room-settings-title"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    id="room-settings-title"
                    className="text-xl font-bold text-white"
                  >
                    Room Settings
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Manage your room information.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={updatingRoom}
                  onClick={() => setShowSettings(false)}
                  className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  aria-label="Close settings"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateRoomName} className="mt-6">
                <label
                  htmlFor="roomName"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Room Name
                </label>

                <input
                  id="roomName"
                  type="text"
                  value={roomNameInput}
                  onChange={(event) => {
                    setRoomNameInput(event.target.value);
                    setSettingsError("");
                  }}
                  maxLength={100}
                  placeholder="Enter room name"
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <div className="mt-2 flex justify-between">
                  <span className="text-xs text-slate-500">
                    Maximum 100 characters
                  </span>

                  <span className="text-xs text-slate-500">
                    {roomNameInput.length}/100
                  </span>
                </div>

                {settingsError && (
                  <p role="alert" className="mt-3 text-sm text-red-400">
                    {settingsError}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    disabled={updatingRoom}
                    className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      updatingRoom ||
                      !roomNameInput.trim() ||
                      roomNameInput.trim() === room.name
                    }
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingRoom ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-white/[0.06] py-6 text-center">
          <p className="text-xs text-slate-600">
            SyncTogether · Enjoy together, from anywhere.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Room;
