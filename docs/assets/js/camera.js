const blend = (a, b, t) =>
  a.map((value, index) => value + (b[index] - value) * t);
const ease = (t) => t * t * (3 - 2 * t);

// The middle segment passes through the physical doorway before the camera turns toward the shelf.
export function cameraPose(progress, compact, motion = true, narrow = false) {
  const p = motion
    ? Math.max(0, Math.min(1, progress))
    : progress > 0.3
      ? 1
      : 0;
  const stops = [
    {
      p: 0,
      position: compact ? [0, 7, narrow ? 49 : 38] : [0, 6.5, 22],
      target: compact ? [0, 7, 0] : [0, 6.5, 0],
      fov: compact ? 55 : 38,
    },
    {
      p: 0.45,
      position: [0, 3.8, 1],
      target: [0, 3.8, -12],
      fov: compact ? 52 : 40,
    },
    {
      p: 0.7,
      position: [0, 3.8, -7.5],
      target: [0, 3.8, -25],
      fov: compact ? 60 : 40,
    },
    {
      p: 1,
      position: compact ? [2.5, 5.4, -9] : [7, 5.2, -9],
      target: compact ? [-2.2, 5.4, -27] : [1.5, 4.5, -27],
      fov: compact ? 62 : 38,
    },
  ];
  const index = stops.findIndex((stop, i) => i > 0 && p <= stop.p);
  const a = stops[Math.max(0, index - 1)],
    b = stops[index < 0 ? stops.length - 1 : index];
  const t = ease(Math.max(0, Math.min(1, (p - a.p) / (b.p - a.p || 1))));
  return {
    position: blend(a.position, b.position, t),
    target: blend(a.target, b.target, t),
    fov: a.fov + (b.fov - a.fov) * t,
  };
}
