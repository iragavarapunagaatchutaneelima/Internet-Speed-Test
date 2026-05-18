/**
 * Streaming platform quality requirements in Mbps (download).
 * Each platform entry lists quality tiers from highest to lowest.
 */
export const STREAMING_PLATFORMS = [
  {
    id: 'netflix',
    name: 'Netflix',
    icon: '🎬',
    tiers: [
      { label: '4K Ultra HD', mbps: 25 },
      { label: '1080p Full HD', mbps: 5 },
      { label: '720p HD', mbps: 3 },
      { label: 'SD', mbps: 1 },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    tiers: [
      { label: '4K (60fps)', mbps: 20 },
      { label: '1080p HD', mbps: 5 },
      { label: '720p HD', mbps: 2.5 },
      { label: '480p SD', mbps: 1.1 },
    ],
  },
  {
    id: 'zoom',
    name: 'Video Calls',
    icon: '📹',
    tiers: [
      { label: 'HD Group', mbps: 3 },
      { label: '720p 1-on-1', mbps: 1.8 },
      { label: 'Standard', mbps: 0.6 },
    ],
  },
  {
    id: 'gaming',
    name: 'Cloud Gaming',
    icon: '🎮',
    tiers: [
      { label: '4K 60fps', mbps: 45 },
      { label: '1080p 60fps', mbps: 20 },
      { label: '720p 60fps', mbps: 10 },
      { label: 'Standard', mbps: 5 },
    ],
  },
];

/**
 * Get the best supported quality tier for a platform given a download speed.
 * @param {object} platform
 * @param {number} downloadMbps
 * @returns {{ label: string, supported: boolean, tier: object|null }}
 */
export const getBestQuality = (platform, downloadMbps) => {
  const best = platform.tiers.find(t => downloadMbps >= t.mbps);
  return {
    label: best ? best.label : 'Not Supported',
    supported: !!best,
    tier: best || null,
  };
};

/**
 * Video resolution quality levels for the simple badge view.
 */
export const VIDEO_QUALITY_LEVELS = [
  { name: '480p SD',   reqMbps: 1.5 },
  { name: '720p HD',   reqMbps: 3.0 },
  { name: '1080p FHD', reqMbps: 5.0 },
  { name: '4K UHD',    reqMbps: 25.0 },
  { name: '8K',        reqMbps: 100.0 },
];
