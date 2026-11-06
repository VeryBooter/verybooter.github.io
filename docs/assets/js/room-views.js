export function roomViewPose(view, compact, narrow = false) {
  if (view === "presentation")
    return {
      position: [6.8, 4.8, -18],
      target: [6.8, 4.8, -5.5],
      fov: narrow ? 65 : 48,
    };
  if (view === "bulletin")
    return {
      position: [8.5, 4.8, -22],
      target: [8.5, 4.8, -32.4],
      fov: narrow ? 68 : 48,
    };
  return {
    position: compact ? [0, 5.4, -9] : [0, 4.9, -14],
    target: [0, 4.5, -32],
    fov: narrow ? 76 : compact ? 64 : 58,
  };
}
