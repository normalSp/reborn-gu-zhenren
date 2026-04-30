import type { GameEvent } from '../../types';

interface EventSlice {
  eventQueue: GameEvent[];
  triggeredEvents: Set<string>;
  eventHistory: { event: GameEvent; triggeredAt: number }[];
  enqueueEvent: (event: GameEvent) => void;
  dequeueAndTrigger: () => GameEvent | null;
  markTriggered: (eventId: string) => void;
}

export const createEventSlice = (set: any, get: any): EventSlice => ({
  eventQueue: [],
  triggeredEvents: new Set(),
  eventHistory: [],
  enqueueEvent: (event) => set((s: EventSlice) => ({
    eventQueue: [...s.eventQueue, event],
  })),
  dequeueAndTrigger: () => {
    const state = get() as EventSlice;
    if (state.eventQueue.length === 0) return null;
    const [next, ...rest] = state.eventQueue;
    set({
      eventQueue: rest,
      eventHistory: [...state.eventHistory, { event: next, triggeredAt: Date.now() }],
      triggeredEvents: new Set([...state.triggeredEvents, next.id]),
    });
    return next;
  },
  markTriggered: (eventId) => set((s: EventSlice) => ({
    triggeredEvents: new Set([...s.triggeredEvents, eventId]),
  })),
});
