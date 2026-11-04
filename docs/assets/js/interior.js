import * as T from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

// One bounded planar reflection, rather than a recursive room of mirrors.
export function buildInteriorFeatures(scene) {
  const mirror = new Reflector(new T.PlaneGeometry(2.1, 2.6), {
    color: 0xb8c4c7,
    textureWidth: 512,
    textureHeight: 512,
    clipBias: 0.003,
    multisample: 0,
  });
  mirror.name = "gallery-wall-mirror";
  mirror.position.set(3.3, 7.6, -32.7);
  scene.add(mirror);
  const brass = new T.MeshStandardMaterial({
    color: 0xb78d47,
    metalness: 0.72,
    roughness: 0.25,
  });
  for (const [w, h, x, y] of [
    [2.4, 0.16, 0, 1.38],
    [2.4, 0.16, 0, -1.38],
    [0.16, 2.6, -1.12, 0],
    [0.16, 2.6, 1.12, 0],
  ]) {
    const edge = new T.Mesh(new T.BoxGeometry(w, h, 0.15), brass);
    edge.position.set(3.3 + x, 7.6 + y, -32.6);
    scene.add(edge);
  }
  return mirror;
}
