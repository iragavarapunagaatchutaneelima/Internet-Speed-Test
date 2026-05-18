/**
 * Convert a speed in Mbps to the selected display unit.
 * @param {number} speedMbps - Speed in megabits per second
 * @param {'mbps'|'mbs'|'kbs'} unit
 * @returns {string}
 */
export const formatSpeed = (speedMbps, unit) => {
  if (!speedMbps || speedMbps < 0) return '0.00';
  switch (unit) {
    case 'mbs': return (speedMbps / 8).toFixed(2);
    case 'kbs': return ((speedMbps * 1000) / 8).toFixed(0);
    case 'mbps':
    default:    return speedMbps.toFixed(2);
  }
};

/**
 * Get the label string for the selected unit.
 * @param {'mbps'|'mbs'|'kbs'} unit
 * @returns {string}
 */
export const getUnitLabel = (unit) => {
  switch (unit) {
    case 'mbs': return 'MB/s';
    case 'kbs': return 'KB/s';
    case 'mbps':
    default:    return 'Mbps';
  }
};

/**
 * Calculate an A–F connection quality grade.
 * Score is a weighted average of download (40%), upload (30%), ping (30%).
 * @param {number} download - Mbps
 * @param {number} upload - Mbps
 * @param {number} ping - ms
 * @returns {{ grade: string, label: string, color: string, score: number }}
 */
export const calculateQualityScore = (download, upload, ping) => {
  if (!download && !upload && !ping) return null;

  // Download score (0-100): excellent = 100 Mbps+
  const dlScore = Math.min(100, (download / 100) * 100);
  // Upload score (0-100): excellent = 50 Mbps+
  const ulScore = Math.min(100, (upload / 50) * 100);
  // Ping score (0-100): lower is better; excellent = <20ms
  const pingScore = ping === 0 ? 0 : Math.max(0, 100 - (ping / 200) * 100);

  const weighted = dlScore * 0.4 + ulScore * 0.3 + pingScore * 0.3;
  const score = Math.round(weighted);

  if (score >= 90) return { grade: 'A+', label: 'Excellent',  color: '#10B981', score };
  if (score >= 80) return { grade: 'A',  label: 'Great',      color: '#10B981', score };
  if (score >= 70) return { grade: 'B',  label: 'Good',       color: '#38BDF8', score };
  if (score >= 55) return { grade: 'C',  label: 'Fair',       color: '#F59E0B', score };
  if (score >= 35) return { grade: 'D',  label: 'Poor',       color: '#F97316', score };
  return               { grade: 'F',  label: 'Very Poor',  color: '#EF4444', score };
};

/**
 * Get a color for ping quality.
 * @param {number} ping - ms
 * @returns {string} CSS color
 */
export const getPingColor = (ping) => {
  if (ping === 0) return 'var(--color-text-muted)';
  if (ping < 20)  return '#10B981'; // green — excellent
  if (ping < 50)  return '#38BDF8'; // blue — good
  if (ping < 100) return '#F59E0B'; // amber — fair
  return '#EF4444';                 // red — poor
};

/**
 * Format a Date object to a human-readable string.
 * @param {Date|string} date
 * @returns {string}
 */
export const formatTimestamp = (date) => {
  const d = new Date(date);
  return d.toLocaleString(undefined, {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
};
