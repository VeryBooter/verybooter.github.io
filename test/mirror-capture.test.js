import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { createMirrorCapture } from "../docs/assets/js/mirror-capture.js";

function setup() {
  const scene = new T.Scene(),
    frame = new T.Group();
  const mirror = new T.Mesh(new T.SphereGeometry(), new T.MeshBasicMaterial());
  scene.add(frame);
  frame.add(mirror);
  frame.position.set(3, 7, -31);
  const capture = createMirrorCapture(scene, frame, mirror);
  const savedTarget = {},
    calls = [];
  let target = savedTarget,
    face = 3,
    mip = 2;
  const renderer = {
    coordinateSystem: T.WebGLCoordinateSystem,
    shadowMap: { autoUpdate: true, needsUpdate: true },
    xr: { enabled: true },
    getRenderTarget: () => target,
    getActiveCubeFace: () => face,
    getActiveMipmapLevel: () => mip,
    setRenderTarget(t, f, m) {
      target = t;
      face = f;
      mip = m;
    },
    render(s, camera) {
      assert.equal(frame.visible, false);
      assert.equal(this.shadowMap.autoUpdate, false);
      assert.equal(this.shadowMap.needsUpdate, false);
      assert.equal(this.xr.enabled, false);
      calls.push({
        face,
        camera,
        position: camera.getWorldPosition(new T.Vector3()),
      });
    },
  };
  return { capture, renderer, mirror, frame, calls, savedTarget };
}

test("mirror bakes one face per tick, publishes a whole cube and stays idle", () => {
  const { capture, renderer, mirror, calls } = setup();
  const initial = mirror.material.envMap;
  assert.equal(capture.capture(renderer, false), 0);
  for (let i = 0; i < 6; i++) {
    assert.equal(mirror.material.envMap, initial);
    assert.equal(capture.capture(renderer), 1);
    assert.equal(calls.length, i + 1);
  }
  assert.notEqual(mirror.material.envMap, initial);
  assert.equal(mirror.visible, true);
  assert.deepEqual(
    calls.map((c) => c.face),
    [0, 1, 2, 3, 4, 5],
  );
  assert.ok(calls.every((c) => c.position.equals(new T.Vector3(3, 7, -31))));
  for (let i = 0; i < 180; i++) assert.equal(capture.capture(renderer), 0);
  assert.equal(calls.length, 6);
  capture.dispose();
});

test("motion during a bake schedules a final update and resize restarts the cube", () => {
  const { capture, renderer, calls, frame } = setup();
  capture.capture(renderer);
  capture.invalidate("door");
  for (let i = 0; i < 11; i++) capture.capture(renderer);
  assert.equal(capture.stats.captures, 2);
  assert.equal(capture.capture(renderer), 0);
  capture.invalidate("door");
  capture.capture(renderer);
  frame.position.x = 8;
  capture.invalidate("resize", true);
  for (let i = 0; i < 6; i++) capture.capture(renderer);
  assert.deepEqual(
    calls.slice(-6).map((c) => c.face),
    [0, 1, 2, 3, 4, 5],
  );
  assert.ok(calls.slice(-6).every((c) => c.position.x === 8));
  capture.dispose();
});

test("capture restores renderer state after success and failure", () => {
  const { capture, renderer, frame, savedTarget } = setup();
  const check = () => {
    assert.equal(frame.visible, true);
    assert.equal(renderer.getRenderTarget(), savedTarget);
    assert.equal(renderer.getActiveCubeFace(), 3);
    assert.equal(renderer.getActiveMipmapLevel(), 2);
    assert.deepEqual(renderer.shadowMap, {
      autoUpdate: true,
      needsUpdate: true,
    });
    assert.equal(renderer.xr.enabled, true);
  };
  capture.capture(renderer);
  check();
  renderer.render = () => {
    throw new Error("GPU failure");
  };
  assert.throws(() => capture.capture(renderer), /GPU failure/);
  check();
  assert.equal(capture.stats.dirty, true);
  assert.equal(capture.stats.facesRendered, 1);
  capture.dispose();
});
