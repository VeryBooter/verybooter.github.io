import * as T from "three";
const smooth = (p, a, b) => T.MathUtils.smoothstep(p, a, b);
export const HOUSE_DURATION = 9000;
export function houseStage(p) {
  return p < 0.18
    ? "grabbing-blueprint"
    : p < 0.36
      ? "laser-scanning"
      : p < 0.42
        ? "blueprint-dissolving"
        : p < 0.62
          ? "assembling-walls"
          : p < 0.72
            ? "chip-emerging"
            : p < 0.86
              ? "installing-chip"
              : p < 0.98
                ? "placing-roof"
                : "complete";
}
// All moving parts use model-local coordinates; the robot works in cabinet coordinates.
export function animateHouse(engine, item, p, phase = "assembly") {
  if (phase === "chip") p = 1;
  const parts = item.userData.parts;
  const base = item.userData.basePosition;
  const target = engine.presentationTarget();
  target.y -= 1.4;
  item.position.lerpVectors(base, target, smooth(p, 0.06, 0.18));
  item.scale
    .copy(item.userData.baseScale)
    .multiplyScalar(1 + smooth(p, 0.06, 0.18) * 1.6);
  parts.house.visible = p >= 0.42;
  parts.blueprint.visible = p < 0.42;
  parts.blueprint.scale.setScalar(Math.max(0.001, 1 - smooth(p, 0.36, 0.42)));
  parts.blueprint.position.set(0, 0.65, 0.2);
  parts.scan.visible = p >= 0.18 && p < 0.36;
  parts.scan.position.y = 0.45 - smooth(p, 0.18, 0.36) * 0.9;
  parts.scanLight.intensity = parts.scan.visible ? 2 : 0;
  for (let i = 0; i < parts.components.length; i++) {
    const component = parts.components[i];
    const start = 0.42 + i * 0.014;
    const amount = smooth(p, start, start + 0.06);
    component.visible = amount > 0;
    component.scale.setScalar(Math.max(0.001, amount));
    component.position.copy(component.userData.home);
    component.position.y += (1 - amount) * 0.6;
  }
  const roofAmount = smooth(p, 0.86, 0.98);
  parts.roof.visible = roofAmount > 0;
  parts.roof.scale.setScalar(Math.max(0.001, roofAmount));
  parts.roof.position.set(0, 0.955 + (1 - roofAmount) * 1.4, 0);
  parts.chip.visible = p >= 0.62;
  parts.chip.scale.setScalar(0.34);
  item.updateWorldMatrix(true, true);
  const shelf = item.worldToLocal(
    engine.collection.cabinet.localToWorld(
      base.clone().add(new T.Vector3(1.05, 0.12, 0.05)),
    ),
  );
  const pickup = shelf.clone().add(new T.Vector3(0, 0.6, 0));
  const installed = new T.Vector3(0, 0.24, 0);
  parts.chip.position.copy(shelf).lerp(pickup, smooth(p, 0.62, 0.69));
  if (p >= 0.72) {
    const t = smooth(p, 0.72, 0.86);
    parts.chip.position.lerpVectors(pickup, installed, t);
    parts.chip.position.y += Math.sin(t * Math.PI) * 0.55;
  }
  if (phase === "chip") {
    parts.house.visible = false;
    parts.roof.visible = false;
    parts.blueprint.visible = false;
    parts.chip.visible = true;
    parts.chip.scale.setScalar(1.2);
    parts.chip.position.set(0, 0.65, 0.4);
  }
  const handLocal =
    p < 0.42
      ? new T.Vector3(0, 0.12, 0.24)
      : parts.chip.visible && p < 0.87
        ? parts.chip.position.clone()
        : new T.Vector3(1.3, 0, 0);
  item.updateWorldMatrix(true, true);
  const handTarget = engine.collection.cabinet.worldToLocal(
    item.localToWorld(handLocal),
  );
  if (p < 0.06)
    handTarget.lerpVectors(
      engine.collection.arm.position.clone().add(new T.Vector3(0, 1, 0)),
      handTarget.clone(),
      smooth(p, 0, 0.06),
    );
  engine.positionHouseHand(handTarget);
  engine.houseStage = phase === "chip" ? "inspecting-chip" : houseStage(p);
  engine.houseHandTarget = handTarget;
}
