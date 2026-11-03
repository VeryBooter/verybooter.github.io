import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { projects } from "../docs/assets/js/catalogue.js";
import { buildCabinet } from "../docs/assets/js/models.js";
import { GalleryScene } from "../docs/assets/js/scene.js";
import { cameraPose } from "../docs/assets/js/camera.js";

test("desktop, tablet, and phone camera poses keep every exhibit selectable", () => {
  for (const [width, height] of [
    [1440, 900],
    [820, 1180],
    [390, 844],
  ]) {
    const mobile = width <= 1000;
    const world = new T.Scene();
    const collection = buildCabinet(world, projects);
    if (mobile) {
      collection.exhibits.get("drawing").position.set(4, 2.9, -0.4);
      collection.exhibits.get("lamp").position.x = -3.9;
    }
    const pose = cameraPose(1, mobile);
    const camera = new T.PerspectiveCamera(pose.fov, width / height, 0.1, 100);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    world.updateMatrixWorld(true);
    const raycaster = new T.Raycaster();
    for (const [id, object] of collection.exhibits) {
      let pickable = false;
      object.traverse((child) => {
        if (!child.isMesh) return;
        const point = new T.Box3()
          .setFromObject(child)
          .getCenter(new T.Vector3())
          .project(camera);
        if (Math.abs(point.x) > 0.98 || Math.abs(point.y) > 0.98) return;
        raycaster.setFromCamera(new T.Vector2(point.x, point.y), camera);
        const hit = raycaster.intersectObjects(
          [...collection.exhibits.values()],
          true,
        )[0];
        if (hit?.object.userData.projectId === id) pickable = true;
      });
      assert.ok(
        pickable,
        `${id} is in view and raycast-selectable at ${width}×${height}`,
      );
    }
  }
});

test("all thirteen animation paths run through their timeline and reset transforms", () => {
  const engine = Object.create(GalleryScene.prototype);
  engine.scene = new T.Scene();
  engine.collection = buildCabinet(engine.scene, projects);
  engine.particles = new T.InstancedMesh(
    new T.BoxGeometry(),
    new T.MeshBasicMaterial(),
    40,
  );
  engine.smoke = new T.InstancedMesh(
    new T.SphereGeometry(),
    new T.MeshBasicMaterial(),
    24,
  );
  engine.dummy = new T.Object3D();
  engine.onFrame = () => {};
  for (const project of projects) {
    engine.select(project.id);
    const object = engine.collection.exhibits.get(project.id);
    for (const elapsed of [0, 375, 750, 1125, 1500]) {
      engine.animate(engine.active.start + elapsed);
      engine.scene.updateMatrixWorld(true);
      object.traverse((child) => {
        assert.ok(
          child.matrixWorld.elements.every(Number.isFinite),
          `${project.id} produces finite transforms`,
        );
      });
    }
    engine.reset();
    assert.deepEqual(
      object.position.toArray(),
      object.userData.basePosition.toArray(),
    );
    assert.deepEqual(
      object.scale.toArray(),
      object.userData.baseScale.toArray(),
    );
    assert.equal(engine.active, null);
    assert.equal(engine.smoke.visible, false);
  }
});
