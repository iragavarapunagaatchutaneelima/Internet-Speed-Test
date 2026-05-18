import { useState, useCallback, useRef } from 'react';
import { measurePing, measureDownload, measureUpload, fetchConnectionInfo } from '../utils/speedtest';

/**
 * Custom hook for speed test state + logic.
 * Supports start, stop (abort), and reset.
 */
export const useSpeedTest = () => {
  const [phase, setPhase]               = useState('IDLE');
  const [ping, setPing]                 = useState(null);
  const [download, setDownload]         = useState(null);
  const [upload, setUpload]             = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [error, setError]               = useState(null);

  const abortRef = useRef(false);
  const testRunning = useRef(false);
  const controllerRef = useRef(null);

  const isTesting = ['CONNECTING', 'PING', 'DOWNLOAD', 'UPLOAD'].includes(phase);

  const startTest = useCallback(async () => {
    if (testRunning.current) return; // prevent double-start
    testRunning.current = true;
    abortRef.current = false;
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    setPhase('CONNECTING');
    setPing(null);
    setDownload(null);
    setUpload(null);
    setCurrentSpeed(0);
    setError(null);

    try {
      const [connInfo] = await Promise.all([fetchConnectionInfo(signal)]);
      setConnectionInfo(connInfo);
      if (abortRef.current) { testRunning.current = false; return; }

      // PING
      setPhase('PING');
      const pingResult = await measurePing(signal);
      if (abortRef.current) { testRunning.current = false; return; }
      setPing(pingResult);

      // DOWNLOAD
      setPhase('DOWNLOAD');
      setCurrentSpeed(0);
      const dlResult = await measureDownload((live) => {
        if (!abortRef.current) { setCurrentSpeed(live); setDownload(live); }
      }, signal);
      if (abortRef.current) { testRunning.current = false; return; }
      setDownload(dlResult);
      setCurrentSpeed(0);

      // UPLOAD
      setPhase('UPLOAD');
      const ulResult = await measureUpload((live) => {
        if (!abortRef.current) { setCurrentSpeed(live); setUpload(live); }
      }, signal);
      if (abortRef.current) { testRunning.current = false; return; }
      setUpload(ulResult);
      setCurrentSpeed(ulResult);

      setPhase('DONE');
    } catch (err) {
      if (!abortRef.current) {
        console.error('Speed test error:', err);
        setError(err.message || 'An unexpected error occurred');
        setPhase('ERROR');
      }
    } finally {
      testRunning.current = false;
    }
  }, []);

  /**
   * Immediately stop the running test.
   * Sets abort flag, resets gauge to 0, transitions to IDLE.
   * Does NOT clear partial results (ping/download) so user can see what was measured.
   */
  const stopTest = useCallback(() => {
    abortRef.current = true;
    testRunning.current = false;
    controllerRef.current?.abort();
    setCurrentSpeed(0);
    setPhase('IDLE');
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    testRunning.current = false;
    controllerRef.current?.abort();
    setPhase('IDLE');
    setPing(null);
    setDownload(null);
    setUpload(null);
    setCurrentSpeed(0);
    setError(null);
  }, []);

  return {
    phase, ping, download, upload,
    currentSpeed, connectionInfo,
    error, isTesting,
    startTest, stopTest, reset,
  };
};
