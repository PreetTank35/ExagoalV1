"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, RefreshCw, BookOpen, Target, Zap } from "lucide-react";

type Message = { role: "user" | "guru"; content: string; time: string };

const INITIAL_MESSAGES: Message[] = [
  {
    role: "guru",
    content:
      "Namaste! 🙏 I am your AI Guru — your personal guide through your academic journey. I've analysed your Learning State and I'm ready to help.\n\nYou can ask me anything — study plans, exam strategies, career guidance, or just about concepts you're struggling with. What would you like to explore today?",
    time: "Now",
  },
];

const SUGGESTIONS = [
  "Create a 2-week DSA revision plan for me",
  "What should I focus on for my next semester?",
  "Help me understand my weak areas",
  "Suggest activities based on my hobbies",
  "What career paths match my Learning State?",
  "How can I improve my state score to 90?",
];

const GURU_RESPONSES: Record<string, string> = {
  default:
    "Based on your Learning State, I can see you have strong foundations in Web Development and Data Structures. Here's my suggestion:\n\n**Priority 1**: Strengthen your Machine Learning basics — it's at 45% which is your weakest area, and it's highly relevant to your goal of ML research.\n\n**Priority 2**: Get your Database Management verified — it's at 68% claimed. Upload your project work and get it verified by your institute.\n\nShall I create a detailed 30-day plan for this?",
};

export default function GuruPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const content = text ?? input.trim();
    if (!content) return;
    setInput("");

    const userMsg: Message = { role: "user", content, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const response = GURU_RESPONSES.default;
      setMessages((m) => [
        ...m,
        { role: "guru", content: response, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[calc(100vh-130px)]">
      {/* Chat Area */}
      <div className="h-[500px] lg:h-auto lg:flex-1 flex flex-col bg-white rounded-none border border-[#172033] border-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#172033] border-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-none flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">AI Guru</h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none inline-block" />
                Online · Connected to your Learning State
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="p-2 rounded-none hover:bg-[#EFF6FF] transition-colors"
            title="Reset chat"
          >
            <RefreshCw className="w-4 h-4 text-[#718096]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0 ${
                  msg.role === "guru"
                    ? "bg-[#2563EB]"
                    : "bg-[#DBEAFE]"
                }`}
              >
                {msg.role === "guru" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-[#2563EB]" />
                )}
              </div>
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-3 rounded-none text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "guru"
                      ? "bg-[#EFF6FF] border border-[#172033] border-2 text-[#172033]"
                      : "bg-[#2563EB] text-white border-2 border-[#172033] shadow-[3px_3px_0_0_#172033]"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
                <span className="text-[10px] text-[#718096]">{msg.time}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[#2563EB] rounded-none flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#EFF6FF] border border-[#172033] border-2 px-4 py-3 rounded-none flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-[#60A5FA] rounded-none animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#718096]">Guru is thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 bg-[#EFF6FF] border border-[#172033] border-2 rounded-none p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask your Guru anything…"
              className="flex-1 px-3 py-2 bg-transparent text-sm text-[#172033] placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-none flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        {/* Quick questions */}
        <div className="bg-white rounded-none border border-[#172033] border-2 p-4">
          <h4 className="text-sm font-bold text-[#172033] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2563EB]" /> Quick Questions
          </h4>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs text-[#4B5A73] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] px-3 py-2 rounded-none transition-all duration-150 font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div className="bg-white rounded-none border border-[#172033] border-2 p-4">
          <h4 className="text-sm font-bold text-[#172033] mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2563EB]" /> Guru's Context
          </h4>
          <div className="space-y-2">
            {[
              { label: "Your State Score", value: "84 / 100" },
              { label: "Weakest Area", value: "Machine Learning" },
              { label: "Strongest Area", value: "Web Development" },
              { label: "Next Exam", value: "Semester 4 · Dec 2024" },
              { label: "Goals Due", value: "3 this week" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-[#718096]">{label}</span>
                <span className="font-semibold text-[#172033]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-[#EFF6FF] border border-[#172033] border-2 rounded-none p-4">
          <h4 className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> What Guru Can Do
          </h4>
          <ul className="space-y-1.5 text-xs text-[#1D4ED8]">
            {[
              "Personalised study plans",
              "Exam strategies for your state",
              "Career & goal guidance",
              "Concept explanations",
              "Activity suggestions",
              "Dashboard navigation help",
            ].map((c) => (
              <li key={c} className="flex items-center gap-1.5">
                <span className="text-[#2563EB]">✓</span> {c}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-[#2563EB] mt-3 font-medium">
            Coming soon: Guru will take actions on your behalf
          </p>
        </div>
      </div>
    </div>
  );
}
