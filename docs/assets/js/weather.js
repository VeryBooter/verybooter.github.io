import * as T from "three";

// Opaque rounded lobes avoid transparent-plane sorting and noisy cloud edges.
export function buildCartoonClouds(scene) {
  const root = new T.Group();
  root.name = "drifting-cartoon-clouds";
  const geometry = new T.SphereGeometry(1, 12, 8);
  const material = new T.MeshToonMaterial({ color: "#edf3ed" });
  for (let i = 0; i < 9; i++) {
    const cloud = new T.Group();
    cloud.userData.offset = i * 13.7;
    cloud.position.set(
      (i % 3) * 30 - 30,
      17 + (i % 3) * 3,
      -18 - Math.floor(i / 3) * 18,
    );
    for (let j = 0; j < 5; j++) {
      const lobe = new T.Mesh(geometry, material);
      lobe.position.set(
        (j - 2) * 1.7,
        Math.sin((j * Math.PI) / 4) * 1.4,
        (j % 2) * 0.6,
      );
      lobe.scale.set(2.2, 1.3 + (j % 3) * 0.35, 1.6);
      cloud.add(lobe);
    }
    root.add(cloud);
  }
  scene.add(root);
  return root;
}
export function animateClouds(root, now, motion) {
  if (!motion) return;
  for (const cloud of root.children) {
    cloud.position.x = ((now * 0.003 + cloud.userData.offset) % 130) - 65;
  }
}
