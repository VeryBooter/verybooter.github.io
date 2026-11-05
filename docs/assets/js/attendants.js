import * as T from "three";

export const attendantKinds = ["roman", "butler", "fox"];
export function buildAttendant(kind = "roman") {
  const root = new T.Group();
  root.name = `attendant-${kind}`;
  const materials = {};
  const mat = (color) =>
    (materials[color] ||= new T.MeshStandardMaterial({
      color,
      roughness: 0.65,
    }));
  const add = (geo, color, p, scale = [1, 1, 1], parent = root) => {
    const m = new T.Mesh(geo, mat(color));
    m.position.set(...p);
    m.scale.set(...scale);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const ball = (color, p, scale, parent) =>
    add(new T.SphereGeometry(1, 20, 16), color, p, scale, parent);
  const box = (color, p, scale, parent) =>
    add(new T.BoxGeometry(1, 1, 1), color, p, scale, parent);
  const skin = kind === "fox" ? "#f0c6a7" : "#d5a383";
  const cloth =
    kind === "roman" ? "#963b30" : kind === "fox" ? "#3a4e75" : "#222731";
  const joint = (name, parent, position) => {
    const pivot = new T.Group();
    pivot.name = name;
    pivot.position.set(...position);
    parent.add(pivot);
    return pivot;
  };
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = joint(`hip-${side}`, root, [side * 0.22, 1.22, 0]);
    ball(
      kind === "roman" ? skin : cloth,
      [0, -0.25, 0],
      [0.15, 0.3, 0.17],
      hip,
    );
    const knee = joint(`knee-${side}`, hip, [0, -0.51, 0]);
    ball(kind === "roman" ? skin : cloth, [0, 0, 0], [0.13, 0.13, 0.14], knee);
    ball(
      kind === "roman" ? skin : cloth,
      [0, -0.22, 0],
      [0.12, 0.24, 0.14],
      knee,
    );
    const ankle = joint(`ankle-${side}`, knee, [0, -0.47, 0]);
    ball("#302822", [0, -0.12, 0.09], [0.16, 0.12, 0.27], ankle);
    if (kind === "roman") {
      for (const y of [-0.1, -0.24, -0.37])
        add(
          new T.CylinderGeometry(0.135, 0.13, 0.045, 16),
          "#68442b",
          [0, y, 0],
          [1, 1, 1],
          knee,
        );
    }
    legs.push({ hip, knee, ankle });
  }
  ball(cloth, [0, 1.5, 0], [0.48, 0.65, 0.28]);
  box("#372b25", [0, 1.22, 0.03], [0.88, 0.12, 0.58]);
  box("#cba85f", [0, 1.22, 0.34], [0.15, 0.12, 0.035]);
  ball(skin, [0, 2.17, 0], [0.14, 0.21, 0.14]);
  ball(skin, [0, 2.54, 0], [0.3, 0.39, 0.28]);
  for (const side of [-1, 1]) {
    ball(skin, [side * 0.3, 2.54, 0], [0.065, 0.11, 0.06]);
    ball("#ece9dc", [side * 0.105, 2.59, 0.248], [0.065, 0.035, 0.025]);
    ball("#242222", [side * 0.105, 2.59, 0.27], [0.025, 0.028, 0.014]);
    box("#513728", [side * 0.105, 2.67, 0.254], [0.13, 0.025, 0.025]);
  }
  ball(skin, [0, 2.5, 0.29], [0.045, 0.075, 0.045]);
  box("#9a6359", [0, 2.38, 0.263], [0.12, 0.025, 0.02]);
  // Shoulder -> elbow -> wrist chains. Props remain attached to the hand.
  for (const side of [-1, 1]) {
    ball("#6d7252", [side * 0.105, 2.59, 0.275], [0.027, 0.029, 0.013]);
    ball("#202326", [side * 0.105, 2.59, 0.285], [0.012, 0.02, 0.007]);
    ball("#fff6de", [side * 0.098, 2.601, 0.292], [0.007, 0.008, 0.004]);
    ball(skin, [side * 0.165, 2.48, 0.23], [0.09, 0.065, 0.012]);
    ball("#ae7767", [side * 0.025, 2.47, 0.32], [0.014, 0.01, 0.008]);
  }
  ball("#bd8173", [0, 2.387, 0.276], [0.07, 0.015, 0.014]);
  ball(skin, [0, 2.32, 0.227], [0.105, 0.055, 0.009]);
  const arms = [],
    elbows = [],
    wrists = [];
  for (const side of [-1, 1]) {
    const arm = joint(`shoulder-${side}`, root, [side * 0.46, 1.94, 0]);
    ball(cloth, [0, -0.19, 0], [0.155, 0.25, 0.17], arm);
    const elbow = joint(`elbow-${side}`, arm, [0, -0.4, 0]);
    ball(
      kind === "roman" ? skin : cloth,
      [0, 0, 0],
      [0.115, 0.115, 0.12],
      elbow,
    );
    ball(
      kind === "roman" ? skin : cloth,
      [0, -0.18, 0],
      [0.1, 0.21, 0.115],
      elbow,
    );
    add(
      new T.CylinderGeometry(0.11, 0.105, 0.07, 16),
      kind === "roman" ? "#b69a5c" : "#eee6d7",
      [0, -0.32, 0],
      [1, 1, 1],
      elbow,
    );
    const wrist = joint(`wrist-${side}`, elbow, [0, -0.39, 0]);
    ball(skin, [0, -0.055, 0.02], [0.095, 0.12, 0.065], wrist);
    for (let i = 0; i < 4; i++)
      ball(
        skin,
        [-0.058 + i * 0.038, -0.15, 0.035],
        [0.019, 0.068, 0.024],
        wrist,
      );
    ball(skin, [side * 0.1, -0.04, 0.055], [0.035, 0.075, 0.035], wrist);
    arms.push(arm);
    elbows.push(elbow);
    wrists.push(wrist);
  }
  const hand = joint("presentation-hand", wrists[1], [0, -0.09, 0.1]);
  if (kind === "roman") {
    // Curved overlapping lorica bands with rivets and a leather underlayer.
    for (let row = 0; row < 5; row++) {
      const y = 1.37 + row * 0.12;
      add(
        new T.CylinderGeometry(0.45, 0.43, 0.105, 32, 1, true),
        "#9eaca9",
        [0, y, 0],
        [1, 1, 0.69],
      );
      for (const side of [-1, 1])
        ball("#d4b775", [side * 0.25, y, 0.255], [0.022, 0.022, 0.015]);
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++)
        ball(
          "#a5afac",
          [side * (0.43 + i * 0.035), 1.97 - i * 0.055, 0],
          [0.21, 0.07, 0.29],
        );
      const strap = box(
        "#6d392b",
        [side * 0.21, 1.91, 0.265],
        [0.07, 0.36, 0.035],
      );
      strap.rotation.z = side * 0.14;
      ball("#d4b775", [side * 0.21, 1.88, 0.295], [0.047, 0.047, 0.012]);
    }
    for (let i = 0; i < 11; i++) {
      const angle = (i / 11) * Math.PI * 2;
      const strip = box(
        "#703c27",
        [Math.sin(angle) * 0.37, 1.03, Math.cos(angle) * 0.25],
        [0.14, 0.36, 0.065],
      );
      strip.rotation.y = angle;
      ball(
        "#c5a66b",
        [Math.sin(angle) * 0.39, 0.88, Math.cos(angle) * 0.29],
        [0.025, 0.025, 0.025],
      );
    }
    ball("#aaada5", [0, 2.76, -0.025], [0.34, 0.26, 0.31]);
    box("#b39a61", [0, 2.73, 0.28], [0.68, 0.07, 0.09]);
    for (const x of [-0.29, 0.29])
      box("#a6a89e", [x, 2.49, 0.07], [0.09, 0.34, 0.3]);
    for (let i = 0; i < 12; i++)
      ball(
        "#a72e28",
        [0, 2.99 + Math.sin((i / 11) * Math.PI) * 0.13, -0.29 + i * 0.052],
        [0.075, 0.16, 0.06],
      );
    const shield = ball(
      "#923b31",
      [0, -0.15, 0.2],
      [0.31, 0.45, 0.07],
      elbows[0],
    );
    shield.name = "roman-shield";
    box("#d0ac61", [0, -0.15, 0.28], [0.055, 0.75, 0.035], elbows[0]);
    ball("#c6a568", [0, -0.15, 0.31], [0.1, 0.1, 0.05], elbows[0]);
  } else {
    ball(
      kind === "fox" ? "#b95c30" : "#33271f",
      [0, 2.69, -0.13],
      [0.32, 0.31, 0.28],
    );
    for (const side of [-1, 1]) {
      ball(
        kind === "fox" ? "#bc6036" : "#33271f",
        [side * 0.26, 2.31, -0.13],
        [0.12, 0.45, 0.13],
      );
      const lapel = box(
        "#f1eee3",
        [side * 0.13, 1.91, 0.24],
        [0.15, 0.38, 0.04],
      );
      lapel.rotation.z = side * 0.35;
    }
    ball("#20242b", [0, 2.01, 0.31], [0.12, 0.06, 0.04]);
    for (const y of [1.47, 1.63, 1.78])
      ball("#d6ba75", [0, y, 0.283], [0.027, 0.027, 0.02]);
    if (kind === "fox") {
      // A restrained midnight-blue dress, ivory inset and gold embroidery.
      add(
        new T.CylinderGeometry(0.34, 0.57, 0.76, 32, 1, true),
        cloth,
        [0, 0.94, 0],
        [1, 1, 0.72],
      );
      for (const y of [0.57, 0.63])
        add(
          new T.TorusGeometry(0.55, 0.014, 6, 40),
          "#c9ad70",
          [0, y, 0],
          [1, 0.72, 1],
        ).rotation.x = Math.PI / 2;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const pleat = ball(
          "#304164",
          [Math.sin(a) * 0.43, 0.9, Math.cos(a) * 0.31],
          [0.035, 0.32, 0.035],
        );
        pleat.rotation.z = -Math.sin(a) * 0.18;
      }
      ball("#efe4cc", [0, 1.82, 0.255], [0.18, 0.26, 0.035]);
      for (const side of [-1, 1])
        for (let i = 0; i < 5; i++)
          ball(
            "#c9ad70",
            [side * (0.2 + i * 0.025), 1.84 - i * 0.1, 0.28],
            [0.018, 0.035, 0.012],
          );
      ball("#68a59c", [0, 2.01, 0.34], [0.045, 0.065, 0.025]);
      for (let i = 0; i < 7; i++) {
        const lock = ball(
          "#9f4d2e",
          [-0.24 + i * 0.08, 2.78, 0.2],
          [0.065, 0.13, 0.07],
        );
        lock.rotation.z = -0.3 + i * 0.06;
      }

      for (const side of [-1, 1]) {
        const ear = add(new T.ConeGeometry(0.16, 0.43, 3), "#b65a32", [
          side * 0.23,
          2.99,
          -0.03,
        ]);
        ear.rotation.z = -side * 0.22;
        add(new T.ConeGeometry(0.09, 0.27, 3), "#f1ccae", [
          side * 0.23,
          3.01,
          0.035,
        ]);
      }
      const tail = ball("#bb6136", [-0.48, 0.9, -0.25], [0.25, 0.65, 0.24]);
      tail.rotation.z = -0.5;
      ball("#f1e8d6", [-0.77, 1.36, -0.25], [0.2, 0.25, 0.2]);
    } else {
      ball("#33271f", [0, 2.56, -0.32], [0.19, 0.19, 0.16]);
      box("#222731", [0, 1.04, -0.17], [0.7, 0.57, 0.15]);
    }
  }
  const gift = new T.Group();
  hand.add(gift);
  gift.visible = false;
  if (kind === "roman") {
    box("#e4d1a2", [0, 0, 0.12], [0.7, 0.65, 0.04], gift);
    for (const y of [-0.34, 0.34]) {
      const roll = add(
        new T.CylinderGeometry(0.065, 0.065, 0.82, 20),
        "#e4d1a2",
        [0, y, 0.12],
        [1, 1, 1],
        gift,
      );
      roll.rotation.z = Math.PI / 2;
    }
  } else if (kind === "butler") {
    box("#171c20", [0, 0, 0.13], [0.59, 0.79, 0.055], gift);
    box("#a8c6d6", [0, 0, 0.164], [0.51, 0.67, 0.008], gift);
  } else {
    // A compact leather codex with actual page edges, spine, corner fittings and clasp.
    box("#efe4c6", [0, 0, 0.1], [0.48, 0.61, 0.105], gift);
    for (const z of [0.025, 0.175])
      box("#343453", [0, 0, z], [0.55, 0.69, 0.035], gift);
    box("#25283f", [-0.26, 0, 0.1], [0.055, 0.69, 0.16], gift);
    for (let i = 0; i < 7; i++)
      box("#cdbf9c", [0.245, 0, 0.058 + i * 0.012], [0.006, 0.59, 0.003], gift);
    for (const x of [-0.21, 0.21])
      for (const y of [-0.28, 0.28]) {
        box("#bd9c5c", [x, y, 0.199], [0.08, 0.015, 0.012], gift);
        box("#bd9c5c", [x, y, 0.199], [0.015, 0.08, 0.012], gift);
      }
    const border = add(
      new T.TorusGeometry(0.125, 0.009, 6, 32),
      "#bd9c5c",
      [0, 0, 0.2],
      [1, 1.35, 1],
      gift,
    );
    border.rotation.z = Math.PI / 4;
    ball("#6baea4", [0, 0, 0.21], [0.042, 0.062, 0.018], gift);
    box("#bd9c5c", [0.245, 0, 0.2], [0.09, 0.065, 0.02], gift);
    box("#943d48", [0.12, -0.37, 0.1], [0.035, 0.14, 0.01], gift);
    for (const y of [-0.23, 0, 0.23])
      box("#bd9c5c", [-0.28, y, 0.1], [0.012, 0.025, 0.17], gift);
  }
  root.userData = { kind, arms, elbows, wrists, legs, hand, gift };
  return root;
}

export function poseAttendant(root, p) {
  const { arms, elbows, wrists, legs, gift } = root.userData;
  const smooth = T.MathUtils.smoothstep;
  const walking =
    p < 0.28
      ? Math.sin((Math.PI * p) / 0.28)
      : p > 0.54 && p < 0.82
        ? Math.sin((Math.PI * (p - 0.54)) / 0.28)
        : 0;
  const stride = Math.sin(p * Math.PI * 16) * walking;
  legs.forEach(({ hip, knee, ankle }, i) => {
    const phase = i ? stride : -stride;
    hip.rotation.x = phase * 0.44;
    knee.rotation.x = Math.max(0, -phase) * 0.65;
    ankle.rotation.x = -hip.rotation.x * 0.3 - knee.rotation.x * 0.4;
  });
  const reach = smooth(p, 0.28, 0.39) * (1 - smooth(p, 0.48, 0.58));
  const carry = smooth(p, 0.44, 0.57);
  const present = smooth(p, 0.82, 0.97);
  arms.forEach((arm, i) => {
    arm.rotation.set(
      (i ? -stride : stride) * 0.28 -
        (i ? reach * 1.15 + carry * 0.34 : carry * 0.16),
      0,
      (i ? -1 : 1) * 0.08,
    );
    elbows[i].rotation.x = -0.12 - carry * (i ? 1.12 : 0.42) - present * 0.12;
    wrists[i].rotation.x = carry * 0.2;
  });
  root.rotation.z = stride * 0.012;
  gift.visible = p >= 0.48;
  gift.rotation.set(0, 0, 0);
  // Keep the front cover upright as the elbow lifts it toward the viewer.
  gift.rotation.x = -(
    arms[1].rotation.x +
    elbows[1].rotation.x +
    wrists[1].rotation.x
  );
  root.userData.stage =
    p < 0.28
      ? "walking-to-cabinet"
      : p < 0.48
        ? "reaching"
        : p < 0.54
          ? "picking-up"
          : p < 0.82
            ? "returning"
            : "presenting";
}

// Analytic two-bone reach, blended into the authored gait without stretching limbs.
export function reachAttendant(root, worldTarget, weight) {
  if (weight <= 0) return;
  root.updateWorldMatrix(true, true);
  const { arms, elbows, wrists } = root.userData;
  const shoulder = arms[1],
    elbow = elbows[1];
  const offset = root.worldToLocal(worldTarget.clone()).sub(shoulder.position);
  const upperLength = 0.4,
    lowerLength = Math.hypot(0.48, 0.1);
  const distance = T.MathUtils.clamp(
    offset.length(),
    0.08,
    upperLength + lowerLength - 0.002,
  );
  const direction = offset.normalize();
  const bend = new T.Vector3(1, 0, 0)
    .addScaledVector(direction, -direction.x)
    .normalize();
  const cosine = T.MathUtils.clamp(
    (upperLength * upperLength +
      distance * distance -
      lowerLength * lowerLength) /
      (2 * upperLength * distance),
    -1,
    1,
  );
  const upper = direction
    .clone()
    .multiplyScalar(cosine)
    .addScaledVector(bend, Math.sqrt(1 - cosine * cosine));
  const lower = direction
    .clone()
    .multiplyScalar(distance)
    .addScaledVector(upper, -upperLength)
    .normalize();
  const q = new T.Quaternion().setFromUnitVectors(
    new T.Vector3(0, -1, 0),
    upper,
  );
  const localLower = lower.applyQuaternion(q.clone().invert());
  const e = new T.Quaternion().setFromUnitVectors(
    new T.Vector3(0, -0.48, 0.1).normalize(),
    localLower,
  );
  shoulder.quaternion.slerp(q, weight);
  elbow.quaternion.slerp(e, weight);
  wrists[1].rotation.x *= 1 - weight;
}

// Fold both legs while lowering the pelvis by the same amount, keeping the boots on the floor.
export function crouchAttendant(root, amount) {
  const angle = 1.25 * amount;
  if (angle <= 0) return;
  for (const { hip, knee, ankle } of root.userData.legs) {
    hip.rotation.x = -angle;
    knee.rotation.x = 2 * angle;
    ankle.rotation.x = -angle;
  }
  root.position.y -= (0.51 + 0.47) * (1 - Math.cos(angle)) * root.scale.y;
}
