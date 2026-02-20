"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PredictionResult = {
  prediction?: string;
  confidence?: number;
  [key: string]: unknown;
};

type HistoryItem = {
  _id?: string;
  text?: string;
  message?: string;
  prediction?: string;
  confidence?: number;
  createdAt?: string;
  [key: string]: unknown;
};

export default function Page() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "overview" | "history">("dashboard");
  const [hoveredSlice, setHoveredSlice] = useState<"ham" | "spam" | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Calculate spam/ham statistics
  const stats = useMemo(() => {
    const total = history.length;
    if (total === 0) return { spam: 0, ham: 0, spamPercent: 0, hamPercent: 0 };
    
    const spam = history.filter(item => 
      item.prediction?.toLowerCase() === "spam"
    ).length;
    const ham = total - spam;
    
    return {
      spam,
      ham,
      spamPercent: (spam / total) * 100,
      hamPercent: (ham / total) * 100
    };
  }, [history]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteOne = async (id?: string) => {
    if (!id || historyBusy) {
      return;
    }

    setHistoryBusy(true);
    setDeletingId(id);
    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchHistory();
      }
    } finally {
      setDeletingId(null);
      setHistoryBusy(false);
    }
  };

  const handleClearAll = async () => {
    if (historyBusy || history.length === 0) {
      return;
    }

    setHistoryBusy(true);
    try {
      const response = await fetch("/api/history?all=true", {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchHistory();
      }
    } finally {
      setHistoryBusy(false);
    }
  };

  const topResult = useMemo(() => {
    if (!result) {
      return null;
    }

    return {
      prediction:
        typeof result.prediction === "string" ? result.prediction : "Unknown",
      confidence:
        typeof result.confidence === "number" ? result.confidence : undefined,
    };
  }, [result]);

  const handlePredict = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!text.trim()) {
      setError("Please enter a message.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Prediction failed.");
        return;
      }

      const predictionResult = (data?.result ?? data) as PredictionResult;
      setResult(predictionResult);

      const historyPayload = {
        text,
        prediction:
          typeof predictionResult?.prediction === "string"
            ? predictionResult.prediction
            : undefined,
        confidence:
          typeof predictionResult?.confidence === "number"
            ? predictionResult.confidence
            : undefined,
      };

      const historyResponse = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(historyPayload),
      });

      if (historyResponse.ok) {
        await fetchHistory();
      }
    } catch {
      setError("Could not connect to prediction API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-teal-400/30 bg-teal-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-teal-400/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/logo.jpeg" alt="SpamZero Logo" className="h-8 w-8 rounded-full object-cover" width={32} height={32} />
                <div>
                  <h2 className="text-sm font-bold text-gray-800">SpamZero</h2>
                  <p className="text-xs text-teal-600">AI Detection</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-600 transition hover:text-teal-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Dashboard Button */}
            <button
              onClick={() => {
                setCurrentPage("dashboard");
                setSidebarOpen(false);
              }}
              className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                currentPage === "dashboard"
                  ? "bg-teal-400 text-white"
                  : "text-gray-700 hover:bg-teal-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </div>
            </button>

            {/* Overview Button */}
            <button
              onClick={() => {
                setCurrentPage("overview");
                setSidebarOpen(false);
              }}
              className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                currentPage === "overview"
                  ? "bg-teal-400 text-white"
                  : "text-gray-700 hover:bg-teal-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Overview</span>
              </div>
            </button>

            {/* History Button */}
            <button
              onClick={() => {
                setCurrentPage("history");
                setSidebarOpen(false);
              }}
              className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                currentPage === "history"
                  ? "bg-teal-400 text-white"
                  : "text-gray-700 hover:bg-teal-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>History</span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 border-b border-teal-400/30 shadow-lg" style={{ backgroundColor: '#F0EAD6' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-700 transition hover:text-teal-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3">
              <Image src="/logo.jpeg" alt="SpamZero Logo" className="h-8 w-8 rounded-full object-cover" width={32} height={32} />
              <div>
                <h1 className="text-lg font-bold text-gray-800">SpamZero</h1>
              </div>
            </div>
            
            <div className="w-6"></div>
          </div>
        </header>

        {/* Dashboard Page */}
        {currentPage === "dashboard" && (
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-6">
            <section className="rounded-2xl border-2 border-teal-400/50 bg-white p-6 shadow-lg shadow-teal-400/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Check Message</h2>
                <p className="mt-1 text-sm text-teal-600">
                  Enter a message to detect if it&apos;s spam or not
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={handlePredict} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-teal-600">
                      Message Text
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste or type your message here..."
                      rows={4}
                      className="w-full rounded-xl border-2 border-teal-400/40 bg-teal-50 p-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-teal-400 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-400/30 transition hover:bg-teal-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Analyzing..." : "Detect Spam"}
                  </button>

                  {error ? (
                    <div className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      {error}
                    </div>
                  ) : null}
                </form>

                {result ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-teal-400/40 bg-white p-6 shadow-lg">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-600">
                        Detection Result
                      </h3>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold uppercase ${
                            topResult?.prediction?.toLowerCase() === "spam"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}
                        >
                          {topResult?.prediction ?? "Unknown"}
                        </span>
                        {typeof topResult?.confidence === "number" ? (
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between text-xs font-semibold text-gray-800">
                              <span>Confidence</span>
                              <span>{(topResult.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full bg-teal-400 transition-all duration-500"
                                style={{ width: `${topResult.confidence * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <details className="group rounded-xl border-2 border-teal-400/40 bg-white">
                <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-600 transition hover:text-teal-700">
                  View Raw Response
                </summary>
                      <pre className="overflow-x-auto border-t-2 border-teal-400/40 p-4 text-xs text-gray-700">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-teal-400/40 bg-teal-50/50">
                    <p className="text-sm text-teal-600">Result will appear here</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        )}

        {/* Overview Page */}
        {currentPage === "overview" && (
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-6">
            <div className="rounded-2xl border-2 border-teal-400/50 bg-white p-6 shadow-lg shadow-teal-400/10">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Overview</h2>
                <p className="mt-2 text-sm text-teal-600">
                  Detection statistics and analytics
                </p>
              </div>

              {history.length === 0 ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-6xl opacity-50">📊</div>
                    <p className="text-lg text-gray-700">No data available yet</p>
                    <p className="mt-2 text-sm text-teal-600">
                      Start detecting messages to see your analytics
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Pie Chart */}
                  <div className="rounded-xl border border-teal-400/30 bg-teal-50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">Detection Distribution</h3>
                    <div 
                      className="relative flex items-center justify-center"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMousePosition({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        });
                      }}
                    >
                      <svg className="h-64 w-64" viewBox="0 0 100 100">
                        {/* Ham slice */}
                        <g 
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          style={{ pointerEvents: "all" }}
                          onMouseEnter={() => setHoveredSlice("ham")}
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#22c55e"
                            strokeWidth="20"
                            strokeDasharray={`${stats.hamPercent * 2.51} 251.2`}
                            transform="rotate(-90 50 50)"
                            style={{ pointerEvents: "stroke" }}
                          />
                        </g>
                        {/* Spam slice */}
                        <g 
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          style={{ pointerEvents: "all" }}
                          onMouseEnter={() => setHoveredSlice("spam")}
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth="20"
                            strokeDasharray={`${stats.spamPercent * 2.51} 251.2`}
                            strokeDashoffset={`-${stats.hamPercent * 2.51}`}
                            transform="rotate(-90 50 50)"
                            style={{ pointerEvents: "stroke" }}
                          />
                        </g>
                      </svg>
                      
                      {/* Tooltip that follows cursor */}
                      {hoveredSlice && (
                        <div
                          className="pointer-events-none absolute z-10 rounded-lg border-2 px-3 py-2 shadow-lg"
                          style={{
                            left: `${mousePosition.x + 10}px`,
                            top: `${mousePosition.y + 10}px`,
                            backgroundColor: hoveredSlice === "ham" ? "#22c55e" : "#ef4444",
                            borderColor: hoveredSlice === "ham" ? "#16a34a" : "#dc2626"
                          }}
                        >
                          <div className="text-lg font-bold text-white">
                            {hoveredSlice === "ham" ? `${stats.hamPercent.toFixed(1)}%` : `${stats.spamPercent.toFixed(1)}%`}
                          </div>
                        </div>
                      )}
                      
                      {/* Center text - shows count when not hovering */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {stats.ham} / {stats.spam}
                          </div>
                          <div className="text-xs text-teal-600">Ham / Spam</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Cards */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-teal-400/30 bg-teal-50 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-gray-800">Statistics</h3>
                      <div className="space-y-4">
                        {/* Total Scans */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-teal-600">Total Scans</span>
                          <span className="text-2xl font-bold text-gray-800">{history.length}</span>
                        </div>

                        {/* Ham Messages */}
                        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-full bg-green-500"></div>
                              <span className="font-medium text-gray-800">Ham (Safe)</span>
                            </div>
                            <span className="text-xl font-bold text-green-400">{stats.ham}</span>
                          </div>
                          <div className="mt-2 text-right text-sm text-green-300">
                            {stats.hamPercent.toFixed(1)}% of total
                          </div>
                        </div>

                        {/* Spam Messages */}
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-full bg-red-500"></div>
                              <span className="font-medium text-gray-800">Spam (Blocked)</span>
                            </div>
                            <span className="text-xl font-bold text-red-400">{stats.spam}</span>
                          </div>
                          <div className="mt-2 text-right text-sm text-red-300">
                            {stats.spamPercent.toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* History Page */}
        {currentPage === "history" && (
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-6">
            <div className="rounded-2xl border-2 border-teal-400/50 bg-white p-6 shadow-lg shadow-teal-400/10">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Detection History</h2>
                  <p className="mt-1 text-sm text-teal-600">
                    All your spam detection results
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border-2 border-teal-400/40 bg-teal-50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-teal-600">Total Scans</span>
                      <span className="text-lg font-bold text-gray-800">{history.length}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={historyBusy || history.length === 0}
                    className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-400/30 border-t-teal-400"></div>
                    <p className="text-sm text-teal-600">Loading history...</p>
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-6xl opacity-50">📭</div>
                    <p className="text-sm text-gray-700">No detection history yet</p>
                    <p className="mt-1 text-xs text-teal-600">
                      Start by checking a message above
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {history.map((item) => {
                    const itemText =
                      typeof item.text === "string"
                        ? item.text
                        : typeof item.message === "string"
                        ? item.message
                        : "-";

                    const isSpam = item.prediction?.toLowerCase() === "spam";

                    return (
                      <article
                        key={item._id || `${itemText}-${item.createdAt}`}
                      className="group rounded-xl border-2 border-teal-400/40 bg-teal-50 p-4 shadow-sm transition hover:border-teal-500 hover:shadow-md hover:shadow-teal-400/20"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                              isSpam
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-green-500/10 text-green-600 dark:text-green-400"
                            }`}
                          >
                            {isSpam ? "🚫 SPAM" : "✓ HAM"}
                          </span>
                          {typeof item.confidence === "number" ? (
                            <span className="text-xs font-semibold opacity-70">
                              {(item.confidence * 100).toFixed(1)}%
                            </span>
                          ) : null}
                        </div>
                        <p className="line-clamp-3 text-sm leading-relaxed text-gray-700">
                          {itemText}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          {item.createdAt ? (
                          <p className="text-xs text-teal-600/70">
                              {new Date(item.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          ) : (
                            <span></span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(item._id)}
                            disabled={historyBusy || !item._id}
                          className="rounded-lg border-2 border-red-500 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 opacity-0 transition hover:bg-red-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item._id ? "..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
