import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HEXAGRAMS, type HexagramData } from "@/data/hexagrams";
import { type ChatMessage, type Focus } from "@/lib/iching";
import { useOnlineStatus } from "@/lib/hooks";

interface Props {
  hexagramNumber: number;
  changingLine: number | null;
  transformedNumber: number | null;
  question: string;
  noChangingLines: boolean;
  darkMode: boolean;
}

const FOCUS_LABELS: Record<Focus, string> = {
  body: "body sensations",
  emotions: "emotions/feelings",
  thoughts: "what comes to mind",
};

export default function PresenceSession({
  hexagramNumber,
  changingLine,
  question,
  noChangingLines,
  darkMode,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const online = useOnlineStatus();
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focus, setFocus] = useState<Focus>("body");
  const completedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearTypingTimer = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  // Two-step gentle progression: body -> emotions -> thoughts.
  const advanceFocus = () => {
    if (focus === "body") {
      setFocus("emotions");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "What emotions or feelings are present right now?" },
      ]);
    } else if (focus === "emotions") {
      const hex = HEXAGRAMS[hexagramNumber];
      setFocus("thoughts");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `What comes to mind in relation to ${hex.name}?` },
      ]);
    }
  };

  const scheduleAutoPrompt = () => {
    clearTypingTimer();
    if (focus !== "thoughts") {
      typingTimerRef.current = setTimeout(() => {
        if (!isLoading) advanceFocus();
      }, 20000);
    }
  };

  useEffect(() => {
    if (started && !isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      scheduleAutoPrompt();
    }
    return () => {
      clearTypingTimer();
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading, started, focus]);

  const startSession = async () => {
    if (started) return;
    setStarted(true);
    setTimeout(() => {
      sessionStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    setIsLoading(true);
    completionTimerRef.current = setTimeout(() => {
      const hex = HEXAGRAMS[hexagramNumber];
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Thank you for this practice. May the wisdom of ${hex.name} guide you forward.`,
        },
      ]);
    }, 600000);
    completedRef.current = true;

    const hex = HEXAGRAMS[hexagramNumber];
    const offlineMessage = `${hex.name}. What sensations are present in your body right now?`;

    let prompt: string;
    if (noChangingLines) {
      prompt = `You are a wise Yi Jing guide offering presence-based reflection.

The seeker has received:
- Hexagram #${hexagramNumber}: ${hex.name}
- "${hex.subtitle}"
- No changing lines - the hexagram stands complete and stable

Your role: Guide them through presence practice based on the overall wisdom of this hexagram.

First message: Very brief - one sentence about the hexagram's essence/meaning, then immediately ask about body sensations.

Keep your response to 1-3 sentences maximum. Be conversational and gentle. Focus on the overall wisdom of the hexagram.`;
    } else {
      const lineText = hex.lines?.[String(changingLine)] ?? "";
      prompt = `You are a wise Yi Jing guide offering presence-based reflection.

The seeker has received:
- Hexagram #${hexagramNumber}: ${hex.name}
- "${hex.subtitle}"
- Changing Line: Line ${changingLine}
- Line text: "${lineText}"
- Question: ${question || "General guidance"}

Your role: Guide them through presence practice based on the wisdom of this specific changing line.

First message: Very brief - one sentence about the changing line's essence/meaning, then immediately ask about body sensations.

Keep responses to 1-3 sentences maximum. Be conversational and gentle. Focus on the changing line's specific wisdom.

Begin with one sentence about the essence of Line ${changingLine} in Hexagram ${hexagramNumber} (${hex.name}), then immediately ask: "What sensations are present in your body right now?"`;
    }

    if (!online) {
      setMessages([{ role: "assistant", content: offlineMessage }]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { response: string };
      setMessages([{ role: "assistant", content: data.response || offlineMessage }]);
    } catch {
      setMessages([{ role: "assistant", content: offlineMessage }]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (hexagramNumber && (changingLine || noChangingLines) && !started) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexagramNumber, changingLine, noChangingLines]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    clearTypingTimer();
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setIsLoading(true);
    const hex: HexagramData = HEXAGRAMS[hexagramNumber];
    const transcript = history
      .map((m) => `${m.role === "user" ? "Seeker" : "Guide"}: ${m.content}`)
      .join("\n");

    let prompt: string;
    if (noChangingLines) {
      prompt = `You are a wise Yi Jing guide in conversation with a seeker.

Their reading:
- Hexagram #${hexagramNumber}: ${hex.name} (${hex.subtitle})
- No changing lines - the hexagram stands complete
- Question: ${question || "General guidance"}

Conversation so far:
${transcript}

Current focus: ${FOCUS_LABELS[focus]}

Guide them through presence practice based on the overall wisdom of Hexagram ${hexagramNumber}. Keep your response to 1-3 SHORT sentences. Be conversational and gentle. Acknowledge what they shared and ${
        focus === "thoughts"
          ? "help them explore connections to the hexagram's teaching"
          : "gently guide them deeper into " + FOCUS_LABELS[focus]
      }.`;
    } else {
      prompt = `You are a wise Yi Jing guide in conversation with a seeker.

Their reading:
- Hexagram #${hexagramNumber}: ${hex.name}
- Changing Line: Line ${changingLine}
- Question: ${question || "General guidance"}

Conversation so far:
${transcript}

Current focus: ${FOCUS_LABELS[focus]}

Guide them through presence practice based on the wisdom of CHANGING LINE ${changingLine}. Keep your response to 1-3 SHORT sentences. Be conversational and gentle. Acknowledge what they shared and ${
        focus === "thoughts"
          ? "help them explore connections to the changing line's specific teaching"
          : "gently guide them deeper into " + FOCUS_LABELS[focus]
      }.`;
    }

    if (!online) {
      setMessages([...history, { role: "assistant", content: "What arises in this moment?" }]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { response: string };
      setMessages([...history, { role: "assistant", content: data.response || "What arises in this moment?" }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "What arises in this moment?" }]);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      ref={sessionStartRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}
    >
      {!online && (
        <div className="px-6 pt-4 pb-0">
          <div className="text-xs text-center rounded-lg px-3 py-2 bg-yellow-100 text-yellow-800">
            You're offline — the practice continues with simplified responses
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 p-6 pb-4">
        <BookOpen className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-700"}`} />
        <h3 className={`text-xl ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Presence Session</h3>
      </div>
      <div className="p-6 space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {messages.map((message, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                message.role === "user"
                  ? darkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                  : darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
              }`}
            >
              <p>{message.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl">
              <Loader2 className={`w-5 h-5 animate-spin ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-6 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share what you notice..."
            className={
              darkMode
                ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500"
                : "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
            }
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={
              darkMode
                ? "bg-gray-600 hover:bg-gray-500 text-gray-100"
                : "bg-gray-800 hover:bg-gray-900 text-white"
            }
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        <p className="mt-2 text-center italic text-gray-500">
          This session invites you to explore present-moment awareness
        </p>
      </div>
    </motion.div>
  );
}
