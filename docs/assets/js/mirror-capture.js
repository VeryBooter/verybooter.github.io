import * as T from "three";

// Render at most one cube face per frame. Publish only complete cubes so the
// convex surface never mixes the last finished capture with a partial update.
export function createMirrorCapture(scene, frame, mirror, size = 256) {
  const targets = [
    new T.WebGLCubeRenderTarget(size),
    new T.WebGLCubeRenderTarget(size),
  ];
  let front = targets[0],
    back = targets[1],
    face = 0;
  const camera = new T.CubeCamera(0.1, 90, back);
  const origin = new T.Vector3();
  const stats = {
    baked: false,
    dirty: true,
    facesRendered: 0,
    captures: 0,
    pendingFace: 0,
    lastFaceMs: 0,
    lastReason: "entrance",
  };
  mirror.material.envMap = front.texture;
  mirror.visible = false;
  const invalidate = (reason = "scene", restart = false) => {
    stats.dirty = true;
    stats.lastReason = reason;
    if (restart) face = stats.pendingFace = 0;
  };
  const capture = (renderer, ready = true) => {
    if (!ready || !frame.visible || (stats.baked && !stats.dirty && face === 0))
      return 0;
    if (face === 0) {
      stats.dirty = false;
      frame.getWorldPosition(origin);
      camera.position.copy(origin);
      if (camera.coordinateSystem !== renderer.coordinateSystem) {
        camera.coordinateSystem = renderer.coordinateSystem;
        camera.updateCoordinateSystem();
      }
      camera.updateMatrixWorld(true);
    }
    const previous = {
      target: renderer.getRenderTarget(),
      face: renderer.getActiveCubeFace(),
      mip: renderer.getActiveMipmapLevel(),
      shadows: renderer.shadowMap.autoUpdate,
      shadowDirty: renderer.shadowMap.needsUpdate,
      xr: renderer.xr.enabled,
      visible: frame.visible,
    };
    const started = performance.now();
    try {
      frame.visible = false;
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = false;
      renderer.setRenderTarget(back, face, 0);
      renderer.render(scene, camera.children[face]);
    } catch (error) {
      invalidate("capture-retry");
      throw error;
    } finally {
      renderer.setRenderTarget(previous.target, previous.face, previous.mip);
      renderer.shadowMap.autoUpdate = previous.shadows;
      renderer.shadowMap.needsUpdate = previous.shadowDirty;
      renderer.xr.enabled = previous.xr;
      frame.visible = previous.visible;
      stats.lastFaceMs = performance.now() - started;
    }
    stats.facesRendered++;
    face++;
    if (face === 6) {
      [front, back] = [back, front];
      front.texture.needsPMREMUpdate = true;
      mirror.material.envMap = front.texture;
      mirror.visible = true;
      stats.baked = true;
      stats.captures++;
      face = 0;
    }
    stats.pendingFace = face;
    return 1;
  };
  const dispose = () => targets.forEach((target) => target.dispose());
  return { capture, invalidate, stats, dispose };
}
