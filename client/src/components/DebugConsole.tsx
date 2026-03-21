import { useEffect, useRef, useState } from "react";

interface LogEntry {
  id: number;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
}

const COLORS: Record<string, string> = {
  log: "#e0e0e0",
  info: "#64b5f6",
  warn: "#ffd54f",
  error: "#ef5350",
};

let logId = 0;

/**
 * Floating debug console — captures all console.log/warn/error/info
 * and displays them in an overlay. Tap the 🐛 button to toggle.
 *
 * Drop this component anywhere in your tree (e.g. App.tsx).
 * Remove it before shipping to production!
 */
export default function DebugConsole() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origInfo = console.info;

    function addEntry(type: LogEntry["type"], args: any[]) {
      const message = args
        .map((a) => {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a, null, 2);
          } catch {
            return String(a);
          }
        })
        .join(" ");

      const now = new Date();
      const timestamp = now.toLocaleTimeString("en-US", { hour12: false }) +
        "." + String(now.getMilliseconds()).padStart(3, "0");

      setLogs((prev) => {
        const next = [...prev, { id: logId++, type, message, timestamp }];
        // Keep last 500 entries to avoid memory issues
        return next.length > 500 ? next.slice(-500) : next;
      });
    }

    console.log = (...args: any[]) => {
      origLog.apply(console, args);
      addEntry("log", args);
    };
    console.warn = (...args: any[]) => {
      origWarn.apply(console, args);
      addEntry("warn", args);
    };
    console.error = (...args: any[]) => {
      origError.apply(console, args);
      addEntry("error", args);
    };
    console.info = (...args: any[]) => {
      origInfo.apply(console, args);
      addEntry("info", args);
    };

    return () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      console.info = origInfo;
    };
  }, []);

  // Auto-scroll to bottom when new logs come in and panel is open
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, open]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 90,
          right: 16,
          zIndex: 99999,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: open ? "#ef5350" : "#333",
          color: "#fff",
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
          cursor: "pointer",
          opacity: 0.85,
        }}
      >
        {open ? "✕" : "🐛"}
      </button>

      {/* Console panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99998,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "monospace" }}>
              Debug Console ({logs.length})
            </span>
            <button
              onClick={() => setLogs([])}
              style={{
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              Clear
            </button>
          </div>

          {/* Logs */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 12px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {logs.length === 0 && (
              <div style={{ color: "#666", fontFamily: "monospace", fontSize: 12, textAlign: "center", marginTop: 40 }}>
                No logs yet...
              </div>
            )}
            {logs.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: "4px 0",
                  borderBottom: "1px solid #1a1a1a",
                  fontFamily: "monospace",
                  fontSize: 11,
                  lineHeight: 1.4,
                  wordBreak: "break-all",
                }}
              >
                <span style={{ color: "#888", marginRight: 8 }}>{entry.timestamp}</span>
                <span
                  style={{
                    color: "#000",
                    background: COLORS[entry.type],
                    borderRadius: 3,
                    padding: "1px 4px",
                    fontSize: 9,
                    fontWeight: 700,
                    marginRight: 8,
                    textTransform: "uppercase",
                  }}
                >
                  {entry.type}
                </span>
                <span style={{ color: COLORS[entry.type] }}>{entry.message}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </>
  );
}
