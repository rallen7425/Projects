"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { type TrackedTopic, loadTopics, persistTopics } from "@/lib/trackedTopics";
import { getClientId } from "@/lib/clientId";

type TrackedCtx = {
  topics: TrackedTopic[];
  hasTopic: (name: string) => boolean;
  addTopic: (name: string) => void;
  removeTopic: (id: string) => void;
  updateTopic: (id: string, name: string) => void;
};

const Ctx = createContext<TrackedCtx>({
  topics: [],
  hasTopic: () => false,
  addTopic: () => {},
  removeTopic: () => {},
  updateTopic: () => {},
});

export function TrackedTopicsProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<TrackedTopic[]>([]);
  const clientIdRef = useRef("");

  useEffect(() => {
    const clientId = getClientId();
    clientIdRef.current = clientId;
    const local = loadTopics();
    setTopics(local);

    // Merge with server copy (handles other devices / cleared browser)
    fetch(`/api/prefs?clientId=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((data) => {
        const serverTopics: TrackedTopic[] = data.tracked ?? [];
        if (!serverTopics.length) return;
        const merged = [...local];
        for (const t of serverTopics) {
          if (!merged.some((m) => m.id === t.id)) merged.push(t);
        }
        merged.sort((a, b) => b.addedAt - a.addedAt);
        setTopics(merged);
        persistTopics(merged);
      })
      .catch(() => {});
  }, []);

  const pushToServer = useCallback((updated: TrackedTopic[]) => {
    const clientId = clientIdRef.current;
    if (!clientId) return;
    fetch(`/api/prefs?clientId=${encodeURIComponent(clientId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saved: JSON.parse(localStorage.getItem("distilled-saved-stories") ?? "[]"),
        tracked: updated,
      }),
    }).catch(() => {});
  }, []);

  const persist = useCallback((updated: TrackedTopic[]) => {
    setTopics(updated);
    persistTopics(updated);
    pushToServer(updated);
  }, [pushToServer]);

  const hasTopic = useCallback(
    (name: string) => topics.some((t) => t.name.toLowerCase() === name.toLowerCase()),
    [topics]
  );

  const addTopic = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (topics.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
      persist([{ id: `topic-${Date.now()}`, name: trimmed, addedAt: Date.now() }, ...topics]);
    },
    [topics, persist]
  );

  const removeTopic = useCallback(
    (id: string) => persist(topics.filter((t) => t.id !== id)),
    [topics, persist]
  );

  const updateTopic = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      persist(topics.map((t) => (t.id === id ? { ...t, name: trimmed } : t)));
    },
    [topics, persist]
  );

  return (
    <Ctx.Provider value={{ topics, hasTopic, addTopic, removeTopic, updateTopic }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTrackedTopics() {
  return useContext(Ctx);
}
