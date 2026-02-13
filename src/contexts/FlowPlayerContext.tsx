"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type EnrichedScreen } from "@/data/helpers";
import { FlowPlayer } from "@/components/FlowPlayer";

interface FlowPlayerContextValue {
  isOpen: boolean;
  openPlayer: (screens: EnrichedScreen[], initialIndex?: number) => void;
  closePlayer: () => void;
}

const FlowPlayerContext = createContext<FlowPlayerContextValue>({
  isOpen: false,
  openPlayer: () => {},
  closePlayer: () => {},
});

export function FlowPlayerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [screens, setScreens] = useState<EnrichedScreen[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  const openPlayer = useCallback((screens: EnrichedScreen[], index = 0) => {
    setScreens(screens);
    setInitialIndex(index);
    setIsOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FlowPlayerContext.Provider value={{ isOpen, openPlayer, closePlayer }}>
      {children}
      {isOpen && (
        <FlowPlayer
          screens={screens}
          initialIndex={initialIndex}
          onClose={closePlayer}
        />
      )}
    </FlowPlayerContext.Provider>
  );
}

export function useFlowPlayer() {
  return useContext(FlowPlayerContext);
}
