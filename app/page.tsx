"use client";

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
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-5">
        <section className="md:col-span-3 rounded-2xl border border-black/15 bg-background/70 p-6 backdrop-blur dark:border-white/15">
          <h1 className="text-3xl font-semibold tracking-tight">Spam Detector</h1>
          <p className="mt-2 text-sm opacity-80">
            Drop a message, run a prediction, and track your recent checks.
          </p>

          <form onSubmit={handlePredict} className="mt-6 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message here..."
              rows={7}
              className="w-full rounded-xl border border-black/20 bg-transparent p-4 outline-none transition focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-black/25 px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25"
            >
              {loading ? "Predicting..." : "Predict"}
            </button>
          </form>

          {error ? (
            <div className="mt-5 rounded-xl border border-black/20 px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          {result ? (
            <section className="mt-6 space-y-3 rounded-xl border border-black/20 p-4 dark:border-white/20">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                Latest Result
              </h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-black/25 px-3 py-1 text-xs font-semibold uppercase dark:border-white/25">
                  {topResult?.prediction ?? "Unknown"}
                </span>
                {typeof topResult?.confidence === "number" ? (
                  <span className="text-sm opacity-80">
                    Confidence: {(topResult.confidence * 100).toFixed(2)}%
                  </span>
                ) : null}
              </div>
              <pre className="overflow-x-auto rounded-lg border border-black/15 p-3 text-xs dark:border-white/15">
                {JSON.stringify(result, null, 2)}
              </pre>
            </section>
          ) : null}
        </section>

        <aside className="md:col-span-2 rounded-2xl border border-black/15 bg-background/70 p-6 backdrop-blur dark:border-white/15">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent History</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">{history.length} items</span>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={historyBusy || history.length === 0}
                className="rounded-lg border border-black/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
              >
                Clear All
              </button>
            </div>
          </div>

          {historyLoading ? (
            <p className="mt-4 text-sm opacity-70">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="mt-4 text-sm opacity-70">No history yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {history.slice(0, 10).map((item) => {
                const itemText =
                  typeof item.text === "string"
                    ? item.text
                    : typeof item.message === "string"
                    ? item.message
                    : "-";

                return (
                  <article
                    key={item._id || `${itemText}-${item.createdAt}`}
                    className="rounded-xl border border-black/15 p-3 dark:border-white/15"
                  >
                    <p className="line-clamp-2 text-sm">{itemText}</p>
                    <div className="mt-2 flex items-center justify-between text-xs opacity-75">
                      <span className="uppercase">{item.prediction || "Unknown"}</span>
                      <span>
                        {typeof item.confidence === "number"
                          ? `${(item.confidence * 100).toFixed(1)}%`
                          : "--"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteOne(item._id)}
                        disabled={historyBusy || !item._id}
                        className="rounded-md border border-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20"
                      >
                        {deletingId === item._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                    {item.createdAt ? (
                      <p className="mt-1 text-[11px] opacity-60">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
