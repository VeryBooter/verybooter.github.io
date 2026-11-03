export function cameraPose(progress, mobile, motion = true) {
  const p = motion ? 1 - (1 - progress) ** 3 : progress > 0.3 ? 1 : 0;
  const start = mobile ? [9, 6, 23] : [10, 5.3, 19];
  const end = mobile ? [2.5, 5.4, 28] : [7, 5.2, 17];
  const startTarget = mobile ? [3.7, 9.6, 0] : [-0.8, 3.4, 0];
  const endTarget = mobile ? [-2.2, 5.4, -1] : [1.5, 4.5, -1];
  const mix = (a, b) => a.map((value, index) => value + (b[index] - value) * p);
  return {
    position: mix(start, end),
    target: mix(startTarget, endTarget),
    fov: mobile ? 42 : 38,
  };
}
