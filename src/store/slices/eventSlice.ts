import type { GameEvent } from '../../types';

interface EventSlice {
  eventQueue: GameEvent[];
  triggeredEvents: Set<string>;
  eventHistory: any[];
  enqueueEvent: (event: GameEvent) => void;
  dequeueAndTrigger: () => any;
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
    // 留空，阶段2B实现
    return null;
  },
  markTriggered: (eventId) => set((s: EventSlice) => ({
    triggeredEvents: new Set([...s.triggeredEvents, eventId]),
  })),
});
