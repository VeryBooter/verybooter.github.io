import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { projects } from "../docs/assets/js/catalogue.js";
import {
  buildCabinet,
  buildRoom,
  positionRobot,
} from "../docs/assets/js/models.js";
import { GalleryScene } from "../docs/assets/js/scene.js";
import { drawingPosition } from "../docs/assets/js/exhibit-layout.js";
import { cameraPose } from "../docs/assets/js/camera.js";

test("revised architecture has two columns, a visible pediment, and a carved frame", () => {
  const room = buildRoom(new T.Scene());
  assert.equal(
    room.children.filter((child) => child.name === "outer-column").length,
    2,
  );
  assert.ok(room.getObjectByName("triangular-pediment"));
  assert.ok(room.getObjectByName("ornate-gilt-portrait-frame"));
  for (const compact of [false, true]) {
    const pose = cameraPose(0, compact),
      camera = new T.PerspectiveCamera(
        pose.fov,
        compact ? 390 / 844 : 1440 / 900,
        0.1,
        100,
      );
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    const peak = new T.Vector3(0, 11.3, -3.8).project(camera);
    assert.ok(
      Math.abs(peak.x) < 1 && Math.abs(peak.y) < 0.85,
      "triangle peak is inside the introductory view",
    );
  }
});

test("robot gripper reaches shelf objects and the launch plinth", () => {
  const collection = buildCabinet(new T.Scene(), projects);
  for (const target of [
    new T.Vector3(0, 4.94, 0.12),
    new T.Vector3(2.1, 4.94, 0.12),
    new T.Vector3(3.4, 0.4, 2.8),
  ])
    assert.ok(positionRobot(collection, target).distanceTo(target) < 1e-8);
});

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
      collection.exhibits.get("drawing").position.set(...drawingPosition(true));
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

test("all twelve animation paths run through their timeline and reset transforms", () => {
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

test("camera crosses the open entrance before turning toward the interior shelf", () => {
  for (const compact of [false, true]) {
    const threshold = cameraPose(0.65, compact);
    assert.ok(threshold.position[2] < -5);
    assert.ok(Math.abs(threshold.position[0]) < 2.8);
    assert.ok(threshold.position[1] < 5.8);
    const inside = cameraPose(1, compact);
    const world = new T.Scene();
    const room = buildRoom(world);
    const collection = buildCabinet(world, projects);
    assert.equal(room.userData.entranceDoors.length, 2);
    assert.ok(collection.cabinet.position.z < inside.position[2]);
    assert.ok(
      room.getObjectByName("interior-rear-wall").position.z <
        collection.cabinet.position.z,
    );
    assert.ok(
      room.getObjectByName("triangle-exclusive-logo").position.y >
        room.getObjectByName("rectangular-roof-bar").position.y,
    );
  }
});

test("TNT flashes twice in pure white before black debris, and exhaust follows the nozzle", () => {
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
  let frame;
  engine.onFrame = (value) => {
    frame = value;
  };
  engine.select("voxelcraft");
  for (const [p, effect, strength] of [
    [0.32, "tnt-white", 1],
    [0.4, null, 0],
    [0.5, "tnt-white", 1],
    [0.7, "tnt-black", null],
  ]) {
    engine.animate(engine.active.start + p * 1500);
    assert.equal(frame.effect, effect);
    if (strength !== null) assert.equal(frame.strength, strength);
  }
  engine.select("rocket");
  engine.animate(engine.active.start + 1125);
  assert.ok(engine.smoke.visible);
  assert.ok(engine.nozzleWorld.distanceTo(engine.smokeOrigin) < 1e-8);
  const nozzle = engine.collection.exhibits
    .get("rocket")
    .userData.parts.nozzle.getWorldPosition(new T.Vector3());
  assert.ok(engine.smokeOrigin.distanceTo(nozzle) < 1e-8);
});

test("MIPS blueprint scan precedes wall assembly, chip insertion, and final roof", () => {
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
  engine.select("house", true, 9000);
  const item = engine.collection.exhibits.get("house"),
    parts = item.userData.parts;
  const at = (p) => engine.animate(engine.active.start + p * 9000);
  at(0.25);
  assert.ok(parts.blueprint.visible && parts.scan.visible);
  assert.ok(!parts.house.visible && !parts.roof.visible);
  const laserStart = parts.scan.position.y;
  at(0.34);
  assert.ok(parts.scan.position.y < laserStart);
  at(0.45);
  assert.ok(!parts.blueprint.visible && parts.house.visible);
  assert.ok(
    parts.components.some((c) => c.visible) &&
      parts.components.some((c) => !c.visible),
  );
  at(0.65);
  assert.ok(parts.chip.visible && !parts.roof.visible);
  const chipStart = parts.chip.getWorldPosition(new T.Vector3());
  at(0.8);
  const chipInHand = parts.chip.getWorldPosition(new T.Vector3());
  const grip = engine.collection.grip.getWorldPosition(new T.Vector3());
  assert.ok(chipInHand.distanceTo(chipStart) > 0.2);
  assert.ok(grip.distanceTo(chipInHand) < 1e-7);
  assert.ok(!parts.roof.visible);
  at(0.86);
  assert.ok(parts.chip.position.distanceTo(new T.Vector3(0, 0.24, 0)) < 1e-7);
  at(1);
  assert.ok(parts.roof.visible && parts.components.every((c) => c.visible));
  assert.equal(engine.houseStage, "complete");
  engine.reset();
  assert.ok(
    parts.blueprint.visible && !parts.chip.visible && !parts.scan.visible,
  );
});

test("mug replaces cooking pot and steam rises while remaining finite", () => {
  const world = new T.Scene(),
    collection = buildCabinet(world, projects);
  const item = collection.exhibits.get("cooking");
  assert.ok(item.userData.parts.mug && item.userData.parts.water);
  assert.equal(item.userData.parts.ingredient, undefined);
  const engine = Object.create(GalleryScene.prototype);
  engine.animateSteam(item, 100, true);
  const first = item.userData.parts.steam.children[0].position.y;
  engine.animateSteam(item, 600, true);
  assert.ok(item.userData.parts.steam.children[0].position.y > first);
  engine.animateSteam(item, 900, false);
  assert.ok(
    item.userData.parts.steam.children.every((c) =>
      c.position.toArray().every(Number.isFinite),
    ),
  );
});
