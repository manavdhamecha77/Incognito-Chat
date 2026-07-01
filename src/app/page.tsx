"use client";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useUsername } from "@/hooks/use-username";
import { useTheme } from "@/hooks/use-theme";
import { Suspense, useState } from "react";

const Page = () => {
  return (<Suspense>
    <Home/>
  </Suspense>
  )
}


function Home() {
  const { username } = useUsername();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const searchParams = useSearchParams()
  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [maxSize, setMaxSize] = useState(50);
  const [ttl, setTtl] = useState(600);
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmed = roomIdInput.trim();
    if (!trimmed) return;

    // Check if the user pasted a full URL and extract the Room ID
    const match = trimmed.match(/\/room\/([^/?#]+)/);
    if (match && match[1]) {
      trimmed = match[1];
    }

    router.push(`/room/${trimmed}`);
  };

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post({
        maxSize,
        ttl,
      });

      if (res.status == 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main
      className="theme-root flex min-h-screen flex-col items-center justify-center p-4"
      data-theme={theme}
      suppressHydrationWarning
    >
      <div className="w-full max-w-md space-y-8">
      
        {wasDestroyed && <div className="bg-red-300 border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black uppercase tracking-wider">ROOM DESTROYED</p>
          <p className="text-zinc-800 text-xs font-mono mt-1">All messages were permanently deleted</p>
        </div>}

        {error === "room-not-found" && <div className="bg-red-300 border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black uppercase tracking-wider">ROOM NOT FOUND</p>
          <p className="text-zinc-800 text-xs font-mono mt-1">This room may have expired or never existed</p>
        </div>}

        {error === "room-full" && <div className="bg-red-300 border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black uppercase tracking-wider">ROOM FULL</p>
          <p className="text-zinc-800 text-xs font-mono mt-1">This room is at maximum capacity</p>
        </div>}
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-black uppercase">
            <button
              type="button"
              onClick={toggleTheme}
              className="cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-current"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {">"}Incognito
            </button>
          </h1>
          <p className="text-black text-xs font-mono uppercase tracking-wider">
            A private, self-destrucive chat-room.
          </p>
        </div>

        <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          {/* Top-Right Toggle Switcher */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase transition-all cursor-pointer rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                activeTab === "create"
                  ? "bg-black text-white"
                  : "bg-white text-zinc-500 hover:text-zinc-800"
              }`}
            >
              CREATE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("join")}
              className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase transition-all cursor-pointer rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                activeTab === "join"
                  ? "bg-black text-white"
                  : "bg-white text-zinc-500 hover:text-zinc-800"
              }`}
            >
              JOIN
            </button>
          </div>

          {/* Your Identity */}
          <div className="space-y-2">
            <label className="flex items-center text-black font-black uppercase tracking-wider text-xs font-mono">
              Your Identity
            </label>
            <div className="bg-yellow-100 border-3 border-black p-3 text-sm text-black font-mono truncate shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {username}
            </div>
          </div>

          {activeTab === "create" ? (
            <div className="space-y-4 pt-2">
              {/* Room Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-black font-black uppercase tracking-wider text-[10px] font-mono">
                    Max Capacity
                  </label>
                  <select
                    value={maxSize}
                    onChange={(e) => setMaxSize(Number(e.target.value))}
                    className="w-full bg-white border-3 border-black p-2.5 text-xs text-black font-mono focus:outline-none focus:bg-yellow-50 rounded-none shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <option value={2}>2 Members</option>
                    <option value={5}>5 Members</option>
                    <option value={10}>10 Members</option>
                    <option value={20}>20 Members</option>
                    <option value={50}>50 Members</option>
                    <option value={100}>100 Members</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-black font-black uppercase tracking-wider text-[10px] font-mono">
                    Expiration (TTL)
                  </label>
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(Number(e.target.value))}
                    className="w-full bg-white border-3 border-black p-2.5 text-xs text-black font-mono focus:outline-none focus:bg-yellow-50 rounded-none shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    <option value={300}>5 Minutes</option>
                    <option value={600}>10 Minutes</option>
                    <option value={1800}>30 Minutes</option>
                    <option value={3600}>1 Hour</option>
                    <option value={14400}>4 Hours</option>
                    <option value={86400}>24 Hours</option>
                  </select>
                </div>
              </div>

              <div className="text-black text-xs font-mono leading-relaxed">
                Create a secure, temporary chat room with automatic deletion.
              </div>

              <button
                onClick={() => createRoom()}
                disabled={isPending}
                className="w-full bg-lime-400 text-black border-4 border-black p-4 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    CREATING SECURE ROOM...
                  </>
                ) : (
                  "CREATE SECURE ROOM"
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="flex items-center text-black font-black uppercase tracking-wider text-xs font-mono">
                  Room ID or URL
                </label>
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  className="w-full bg-white border-3 border-black p-3 text-sm text-black font-mono focus:outline-none focus:bg-yellow-50 placeholder:text-zinc-500 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!roomIdInput.trim() || isPending}
                className="w-full bg-cyan-400 text-black border-4 border-black p-4 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                JOIN ROOM
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}


export default Page
