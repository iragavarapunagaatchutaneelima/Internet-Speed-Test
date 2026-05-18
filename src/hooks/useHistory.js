import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'orbitspeed_history';
const MAX_HISTORY  = 20;

/**
 * Custom hook for persistent test history via localStorage.
 * @returns {{ history: Array, addResult: Function, clearHistory: Function }}
 */
export const useHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn('Failed to persist history:', err);
    }
  }, [history]);

  /**
   * Add a new test result to history.
   * @param {{ ping: number, download: number, upload: number, isp: string, timestamp: string }} result
   */
  const addResult = useCallback((result) => {
    setHistory(prev => {
      const next = [
        { ...result, id: Date.now(), timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX_HISTORY);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear stored history:', err);
    }
  }, []);

  return { history, addResult, clearHistory };
};
