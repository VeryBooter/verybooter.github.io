import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  buildAttendant,
  poseAttendant,
  reachAttendant,
  crouchAttendant,
} from "../docs/assets/js/attendants.js";

test("all attendants run with bending knees, then reach a shelf without detaching the hand", () => {
  for (const kind of ["roman", "butler", "fox"]) {
    const actor = buildAttendant(kind);
    poseAttendant(actor, 0.11);
    assert.ok(actor.userData.legs.some((leg) => leg.knee.rotation.x > 0.1));
    assert.equal(actor.userData.gift.visible, false);
    for (const shelfY of [4.94, 3.59, 0.89]) {
      actor.position.set(-1.2, 0, shelfY < 2 ? 0.85 : 1.1);
      actor.rotation.set(0, Math.PI, 0);
      actor.scale.setScalar(1.9);
      poseAttendant(actor, 0.44);
      if (shelfY < 2) crouchAttendant(actor, 1);
      const target = new T.Vector3(-2.1, shelfY + 0.15, 0.22);
      reachAttendant(actor, target, 1);
      actor.updateWorldMatrix(true, true);
      const hand = actor.userData.hand.getWorldPosition(new T.Vector3());
      assert.ok(
        hand.distanceTo(target) < 0.025,
        `${kind} shelf ${shelfY}: hand misses by ${hand.distanceTo(target)}`,
      );
      for (const { ankle } of actor.userData.legs) {
        const foot = new T.Box3().setFromObject(ankle);
        assert.ok(
          Math.abs(foot.min.y) < 0.01,
          `${kind}: foot not on floor: ${foot.min.y}`,
        );
      }
    }
    poseAttendant(actor, 0.95);
    assert.equal(actor.userData.stage, "throwing");
    assert.equal(actor.userData.gift.visible, true);
    assert.equal(actor.userData.gift.parent, actor.userData.hand);
    assert.ok(actor.userData.elbows[1].rotation.x < -1);
  }
});
