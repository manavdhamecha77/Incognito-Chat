"use client";

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { useRealtime } from "@/lib/realtime-client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const { username } = useUsername()
  const [input,setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [copyStatus, setCopyStatus] = useState("COPY");
  const [timeReamining, setTimeRemaining] = useState<number | null>(null);

  const { data: ttlData} = useQuery({
    queryKey: ["ttl",roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({
        query: { roomId } })
        return res.data
    }
  }) 

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  useEffect(() => {
    if(timeReamining === null || timeReamining < 0 ) return

    if(timeReamining === 0) {
      router.push("/?destroyed=true")
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if(prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev-1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeReamining, router])

  const { data:messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({query: {roomId}})
      return res.data
    }
  })

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if(event === "chat.message") {
        refetch()
      }

      if(event === "chat.destroy") {
        router.push("/?destroyed=true")
      }
    }
  })
  

  const { mutate: sendMessage, isPending} = useMutation({
    mutationFn: async({text}: {text: string}) => {
      await client.messages.post({ sender:username, text }, {query: { roomId }})
    }
  })

  const { mutate: destroyRoom} = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId }})
    },
  })

  const copyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  return (
    <main
      className="theme-root flex flex-col h-screen max-h-screen overflow-hidden"
      data-theme={theme}
      suppressHydrationWarning
    >
      <header className="border-b-4 border-black p-3 sm:p-4 flex items-center justify-between bg-white gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4 shrink overflow-hidden">
          <div className="flex flex-col shrink overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-black font-black uppercase tracking-wider font-mono">Room Id</span>
            <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
              <span className="text-xs sm:text-sm font-black text-black truncate min-w-0 max-w-[80px] sm:max-w-none bg-yellow-100 px-2 py-0.5 border-2 border-black font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{roomId}</span>
              <button
                onClick={() => copyLink()}
                className="text-[9px] font-mono font-black uppercase shrink-0 bg-white border-2 border-black hover:bg-black hover:text-white px-2 py-1 transition-all rounded-none text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                {copyStatus === "COPIED!" ? "COPIED" : copyStatus}
              </button>
            </div>
          </div>
          <div className="theme-divider h-8 w-1 bg-black shrink-0" />
          <div className="flex flex-col shrink-0">
            <span className="text-[9px] sm:text-[10px] text-black font-black uppercase tracking-wider font-mono">
              Self-Destruct
            </span>
            <span
              className={`text-xs sm:text-sm font-black font-mono border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${timeReamining != null && timeReamining < 60 ? "bg-red-300 text-black" : "bg-orange-300 text-black"}`}
            >
              {timeReamining != null
                ? formatTimeRemaining(timeReamining)
                : "--:--"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="bg-white border-2 border-black px-2 py-1.5 text-[9px] sm:text-xs text-black font-black font-mono uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer rounded-none"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button
          onClick={() => destroyRoom()}
          title="Destroy Now"
          className="shrink-0 text-xs sm:text-sm bg-red-400 hover:bg-red-500 border-3 border-black px-3 py-1.5 text-black font-black uppercase tracking-wider transition-all group flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-none"
        >
          <span className="text-base sm:text-sm group-hover:animate-pulse">💣</span>
          <span className="hidden sm:inline">Destroy Now</span>
          </button>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages?.messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-700 text-xs sm:text-sm font-black font-mono text-center uppercase tracking-wide border-2 border-dashed border-zinc-400 p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages?.messages.map((msg) => (
          <div className={`flex flex-col ${msg.sender === username ? "items-end" : "items-start"}`} key={msg.id}>
            <div className="max-w-[85%] sm:max-w-[70%] space-y-1.5">
              <div className={`flex items-center gap-2 ${msg.sender === username ? "justify-end" : "justify-start"}`}>
                <span className={`text-[9px] font-black uppercase tracking-wider border-2 border-black px-1.5 py-0.5 font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${msg.sender === username ? "bg-lime-200 text-black" : "bg-cyan-200 text-black"}`}>
                  {msg.sender === username ? "YOU" : msg.sender}
                </span>
                <span className="theme-timestamp text-[9px] text-zinc-700 font-mono">{format(msg.timestamp, "HH:mm")}</span>
              </div>
              <div className="bg-white border-3 border-black p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <p className="text-xs sm:text-sm text-black leading-relaxed break-all font-mono font-medium">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div> 

      <div className="p-3 sm:p-4 border-t-4 border-black bg-white">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black font-black font-mono">
              {">"}
            </span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Type message..."
              value={input}
              onKeyDown={(e) => {
                if(e.key === "Enter" && input.trim()) {
                    sendMessage({text: input})
                    setInput("")
                    inputRef.current?.focus()
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              className="theme-message-input w-full bg-white border-3 border-black focus:bg-yellow-50 focus:outline-none transition-colors text-black placeholder:text-zinc-500 py-3 pl-8 pr-3 text-xs sm:text-sm rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
          <button
            onClick={()=>{
              sendMessage({text:input})
              setInput("")
              inputRef.current?.focus()  
            }} 
            disabled={!input.trim() || isPending}
            className="bg-lime-400 text-black border-3 border-black px-4 sm:px-6 text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-lime-500 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap rounded-none"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;
