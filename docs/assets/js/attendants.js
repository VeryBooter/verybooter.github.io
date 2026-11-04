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
  // Articulated silhouette: boots, calves, fitted torso, neck, hands and face.
  for (const side of [-1, 1]) {
    box("#252725", [side * 0.22, 0.12, 0.12], [0.29, 0.23, 0.52]);
    ball(
      kind === "roman" ? skin : cloth,
      [side * 0.22, 0.68, 0],
      [0.16, 0.54, 0.18],
    );
    if (kind === "roman")
      for (const y of [0.35, 0.5, 0.65])
        box("#68442b", [side * 0.22, y, 0.15], [0.28, 0.035, 0.035]);
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
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(side * 0.47, 1.92, 0);
    root.add(arm);
    ball(cloth, [0, -0.23, 0], [0.16, 0.32, 0.17], arm);
    ball(
      kind === "roman" ? skin : "#f0ede3",
      [0, -0.58, 0.03],
      [0.12, 0.18, 0.13],
      arm,
    );
    ball(skin, [0, -0.8, 0.04], [0.12, 0.16, 0.1], arm);
    arms.push(arm);
  }
  const hand = new T.Group();
  hand.position.set(0, -0.82, 0.08);
  arms[1].add(hand);
  if (kind === "roman") {
    for (const y of [1.45, 1.62, 1.79])
      box("#9eaca9", [0, y, 0.25], [0.82, 0.14, 0.16]);
    for (const x of [-0.34, -0.17, 0, 0.17, 0.34])
      box("#703c27", [x, 1, 0.07], [0.14, 0.43, 0.5]);
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
      [0, -0.45, 0.24],
      [0.42, 0.6, 0.07],
      arms[0],
    );
    shield.name = "roman-shield";
    box("#d0ac61", [0, -0.45, 0.32], [0.08, 1, 0.035], arms[0]);
    ball("#c6a568", [0, -0.45, 0.35], [0.13, 0.13, 0.05], arms[0]);
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
    box("#433361", [0, 0, 0.12], [0.66, 0.8, 0.14], gift);
    box("#d2b978", [0, 0, 0.2], [0.52, 0.66, 0.02], gift);
    ball("#75ded1", [0, 0, 0.23], [0.1, 0.14, 0.025], gift);
  }
  root.userData = { kind, arms, hand, gift };
  return root;
}

export function poseAttendant(root, p) {
  const { arms, gift } = root.userData;
  arms[0].rotation.x = -Math.sin(Math.min(1, p / 0.45) * Math.PI) * 1.3;
  arms[1].rotation.x = -T.MathUtils.smoothstep(p, 0.25, 0.55) * 1.5;
  arms[1].rotation.z = -0.15;
  gift.visible = p > 0.65;
  gift.rotation.x = -arms[1].rotation.x;
  gift.rotation.y = Math.sin(p * Math.PI) * 0.2;
}
