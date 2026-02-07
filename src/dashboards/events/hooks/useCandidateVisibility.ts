import { useState, useCallback, useMemo } from "react";

interface UseCandidateVisibilityReturn {
  hiddenCandidates: Set<string>;
  toggleCandidateVisibility: (candidate: string) => void;
  filteredPoints: <T extends { candidate?: string | null }>(points: T[]) => T[];
}

export const useCandidateVisibility = (): UseCandidateVisibilityReturn => {
  const [hiddenCandidates, setHiddenCandidates] = useState<Set<string>>(() => new Set());

  const toggleCandidateVisibility = useCallback((candidate: string) => {
    setHiddenCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidate)) {
        newSet.delete(candidate);
      } else {
        newSet.add(candidate);
      }
      return newSet;
    });
  }, []);

  // Crear una copia estable del hiddenCandidates para evitar problemas de renderizado
  const stableHiddenCandidates = useMemo(() => 
    new Set(hiddenCandidates), 
    [hiddenCandidates]
  );

  const filteredPoints = useCallback(<T extends { candidate?: string | null }>(points: T[]) => {
    return points.filter(point => 
      point.candidate && !stableHiddenCandidates.has(point.candidate)
    );
  }, [stableHiddenCandidates]);

  return {
    hiddenCandidates: stableHiddenCandidates,
    toggleCandidateVisibility,
    filteredPoints,
  };
};
