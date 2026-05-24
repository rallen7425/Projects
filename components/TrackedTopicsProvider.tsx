"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type TrackedTopic, loadTopics, persistTopics } from "@/lib/trackedTopics";

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

  useEffect(() => {
    setTopics(loadTopics());
  }, []);

  const save = useCallback((updated: TrackedTopic[]) => {
    setTopics(updated);
    persistTopics(updated);
  }, []);

  const hasTopic = useCallback(
    (name: string) => topics.some((t) => t.name.toLowerCase() === name.toLowerCase()),
    [topics]
  );

  const addTopic = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (topics.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
      save([{ id: `topic-${Date.now()}`, name: trimmed, addedAt: Date.now() }, ...topics]);
    },
    [topics, save]
  );

  const removeTopic = useCallback(
    (id: string) => save(topics.filter((t) => t.id !== id)),
    [topics, save]
  );

  const updateTopic = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      save(topics.map((t) => (t.id === id ? { ...t, name: trimmed } : t)));
    },
    [topics, save]
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
