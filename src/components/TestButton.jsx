
import { Zap, RotateCcw, Square } from 'lucide-react';

const LABELS = {
  CONNECTING: 'Connecting…',
  PING:       'Testing Ping…',
  DOWNLOAD:   'Measuring Download…',
  UPLOAD:     'Measuring Upload…',
};

/**
 * TestButton — Start, Stop, and Reset controls.
 *
 * During testing:   [spinner + phase label]  [■ Stop]
 * After done:       [⚡ Run Again]            [↺ Reset]
 * Idle/Error:       [⚡ Start Speed Test]
 */
const TestButton = ({ phase, isTesting, onStart, onStop, onReset }) => {
  const isDone  = phase === 'DONE';
  const isError = phase === 'ERROR';
  const label   = isTesting ? (LABELS[phase] || 'Testing…')
                : isDone    ? 'Run Again'
                : isError   ? 'Retry Test'
                :             'Start Speed Test';

  return (
    <div className="test-btn-wrap">
      <button
        id="start-speed-test"
        className="test-btn"
        onClick={isTesting ? undefined : onStart}
        disabled={isTesting}
        aria-busy={isTesting}
        aria-label={label}
      >
        {isTesting
          ? <><span className="test-btn__spinner" aria-hidden="true"/>{label}</>
          : <><Zap size={18} aria-hidden="true"/>{label}</>
        }
      </button>

      {/* Stop button — only visible during active test */}
      {isTesting && (
        <button
          className="test-btn-stop"
          onClick={onStop}
          aria-label="Stop speed test"
          title="Stop test"
        >
          <Square size={14} fill="currentColor" />
        </button>
      )}

      {/* Reset button — only visible after completion */}
      {isDone && (
        <button className="test-btn-reset" onClick={onReset} aria-label="Reset results">
          <RotateCcw size={15}/>
        </button>
      )}
    </div>
  );
};

export default TestButton;
