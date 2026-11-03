import * as T from "three";
import { ornateFrame } from "./ornaments.js";
import { drawingPosition } from "./exhibit-layout.js";

export const palette = {
  stone: new T.MeshStandardMaterial({ color: "#d9d0bb", roughness: 0.88 }),
  edge: new T.MeshStandardMaterial({ color: "#e7ddc7", roughness: 0.8 }),
  wood: new T.MeshStandardMaterial({ color: "#614635", roughness: 0.7 }),
  trim: new T.MeshStandardMaterial({ color: "#362b24", roughness: 0.6 }),
  brass: new T.MeshStandardMaterial({
    color: "#b08a4f",
    metalness: 0.65,
    roughness: 0.35,
  }),
  cream: new T.MeshStandardMaterial({ color: "#eee4cc", roughness: 0.8 }),
  green: new T.MeshStandardMaterial({ color: "#47645a", roughness: 0.6 }),
  blue: new T.MeshStandardMaterial({ color: "#466b83", roughness: 0.5 }),
  red: new T.MeshStandardMaterial({ color: "#ab6048", roughness: 0.6 }),
  orange: new T.MeshStandardMaterial({ color: "#ec923c", roughness: 0.65 }),
  stripe: new T.MeshStandardMaterial({ color: "#b95421", roughness: 0.7 }),
  vest: new T.MeshStandardMaterial({ color: "#334c76", roughness: 0.7 }),
  black: new T.MeshStandardMaterial({ color: "#29312e", roughness: 0.55 }),
};
const geometries = new Map();
function geometry(key, factory) {
  if (!geometries.has(key)) geometries.set(key, factory());
  return geometries.get(key);
}
export function mesh(
  parent,
  geo,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
) {
  const item = new T.Mesh(
    geo,
    typeof material === "string" ? palette[material] : material,
  );
  item.position.set(...position);
  item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}
export function box(parent, x, y, z, mat, p, r) {
  return mesh(
    parent,
    geometry(`b${x},${y},${z}`, () => new T.BoxGeometry(x, y, z)),
    mat,
    p,
    r,
  );
}
export function cylinder(
  parent,
  top,
  bottom,
  height,
  mat,
  p,
  r,
  segments = 24,
) {
  return mesh(
    parent,
    geometry(
      `c${top},${bottom},${height},${segments}`,
      () => new T.CylinderGeometry(top, bottom, height, segments),
    ),
    mat,
    p,
    r,
  );
}
export function sphere(parent, radius, mat, p, scale) {
  const item = mesh(
    parent,
    geometry(`s${radius}`, () => new T.SphereGeometry(radius, 20, 14)),
    mat,
    p,
  );
  if (scale) item.scale.set(...scale);
  return item;
}
export function tube(parent, points, radius, mat) {
  return mesh(
    parent,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      30,
      radius,
      6,
      false,
    ),
    mat,
  );
}
function group(parent, position = [0, 0, 0]) {
  const g = new T.Group();
  g.position.set(...position);
  parent.add(g);
  return g;
}
function frame(parent, w, h, mat, z = 0) {
  for (const x of [-w / 2, w / 2]) box(parent, 0.09, h, 0.13, mat, [x, 0, z]);
  for (const y of [-h / 2, h / 2]) box(parent, w, 0.09, 0.13, mat, [0, y, z]);
}
export function buildObject(id) {
  const root = new T.Group();
  const parts = {};
  switch (id) {
    case "sailbot": {
      sphere(root, 0.56, "green", [0, 0.18, 0], [1, 0.33, 0.5]);
      cylinder(root, 0.025, 0.025, 1.45, "brass", [0, 0.86, 0]);
      const sail = new T.Shape();
      sail.moveTo(0.05, 0.3);
      sail.lineTo(0.05, 1.5);
      sail.lineTo(0.68, 0.35);
      sail.closePath();
      mesh(
        root,
        new T.ShapeGeometry(sail),
        new T.MeshStandardMaterial({ color: "#e8dec4", side: T.DoubleSide }),
        [0, 0, 0],
      );
      box(root, 0.2, 0.1, 0.25, "red", [0, 0.3, 0.05]);
      cylinder(root, 0.025, 0.025, 0.55, "brass", [0, -0.15, 0]);
      sphere(root, 0.12, "green", [0, -0.43, 0], [1.5, 0.4, 0.7]);
      break;
    }
    case "rocket":
      cylinder(root, 0.13, 0.13, 0.9, "cream", [0, 0.65, 0]);
      cylinder(root, 0, 0.13, 0.35, "red", [0, 1.27, 0]);
      cylinder(root, 0.09, 0.14, 0.12, "black", [0, 0.14, 0]);
      for (let i = 0; i < 3; i++) {
        const fin = group(root);
        fin.rotation.y = (i * Math.PI * 2) / 3;
        box(fin, 0.09, 0.35, 0.35, "red", [0, 0.25, 0.16], [0, 0, -0.2]);
      }
      parts.flame = sphere(root, 0.16, "brass", [0, -0.1, 0], [0.6, 2.2, 0.6]);
      parts.flame.visible = false;
      break;
    case "house": {
      parts.house = group(root);
      box(parts.house, 0.9, 0.65, 0.7, "cream", [0, 0.38, 0]);
      cylinder(
        parts.house,
        0,
        0.72,
        0.45,
        "red",
        [0, 0.93, 0],
        [0, Math.PI / 4, 0],
        4,
      );
      box(parts.house, 0.19, 0.34, 0.02, "wood", [0, 0.25, 0.36]);
      for (const x of [-0.28, 0.28])
        box(parts.house, 0.16, 0.17, 0.025, "blue", [x, 0.5, 0.36]);
      parts.blueprint = group(root, [0, 0.6, 0.05]);
      box(parts.blueprint, 0.85, 1.05, 0.025, "blue");
      for (const y of [-0.55, 0.55])
        cylinder(
          parts.blueprint,
          0.075,
          0.075,
          0.98,
          "cream",
          [0, y, 0],
          [0, 0, Math.PI / 2],
        );
      for (let i = 0; i < 4; i++)
        box(parts.blueprint, 0.65, 0.012, 0.008, "cream", [
          0,
          -0.3 + i * 0.2,
          0.025,
        ]);
      parts.scan = box(
        parts.blueprint,
        0.8,
        0.035,
        0.04,
        "brass",
        [0, 0.5, 0.04],
      );
      parts.chip = group(root, [0, 0.5, 0]);
      box(parts.chip, 1.1, 0.09, 0.85, "green");
      box(parts.chip, 0.55, 0.16, 0.5, "blue", [0, 0.12, 0]);
      for (let i = 0; i < 7; i++)
        for (const side of [-1, 1]) {
          box(parts.chip, 0.04, 0.05, 0.17, "brass", [
            -0.42 + i * 0.14,
            0.1,
            side * 0.45,
          ]);
          box(parts.chip, 0.16, 0.05, 0.04, "brass", [
            side * 0.56,
            0.1,
            -0.3 + i * 0.1,
          ]);
        }
      parts.house.visible = false;
      parts.chip.visible = false;
      break;
    }
    case "drone":
      sphere(root, 0.24, "cream", [0, 0.3, 0], [1, 0.5, 1]);
      parts.propellers = [];
      for (const x of [-0.4, 0.4])
        for (const z of [-0.33, 0.33]) {
          tube(
            root,
            [
              [0, 0.3, 0],
              [x, 0.3, z],
            ],
            0.035,
            "black",
          );
          const prop = group(root, [x, 0.35, z]);
          box(prop, 0.4, 0.015, 0.055, "brass");
          parts.propellers.push(prop);
          cylinder(root, 0.05, 0.05, 0.1, "black", [x, 0.3, z]);
        }
      break;
    case "cooking":
      cylinder(root, 0.43, 0.37, 0.5, "black", [0, 0.35, 0]);
      cylinder(root, 0.44, 0.44, 0.035, "brass", [0, 0.6, 0]);
      for (const x of [-0.52, 0.52])
        box(root, 0.22, 0.08, 0.15, "wood", [x, 0.43, 0]);
      parts.ingredient = sphere(
        root,
        0.16,
        "cream",
        [0, 0.65, 0],
        [1, 0.25, 1],
      );
      sphere(parts.ingredient, 0.065, "brass", [0, 0.035, 0], [1, 0.4, 1]);
      break;
    case "voxelcraft":
      box(root, 0.7, 0.7, 0.7, "red", [0, 0.4, 0]);
      box(root, 0.71, 0.22, 0.71, "cream", [0, 0.4, 0]);
      for (const x of [-0.2, 0, 0.2])
        box(root, 0.06, 0.13, 0.015, "black", [x, 0.4, 0.365]);
      cylinder(root, 0.025, 0.025, 0.19, "black", [0, 0.82, 0], [0, 0, -0.4]);
      break;
    case "hackathon": {
      // A procedural abstraction of the supplied orange archer-cat mascot.
      sphere(root, 0.32, "vest", [0, 0.38, 0], [0.9, 1.05, 0.72]);
      sphere(root, 0.34, "orange", [0, 0.86, 0], [1, 0.95, 0.8]);
      for (const x of [-0.22, 0.22]) {
        cylinder(root, 0, 0.14, 0.28, "orange", [x, 1.16, 0], undefined, 3);
        sphere(root, 0.095, "cream", [x * 0.66, 0.91, 0.25], [1, 1.25, 0.45]);
        sphere(root, 0.048, "black", [x * 0.6, 0.91, 0.29], [1, 1.2, 0.5]);
        sphere(root, 0.08, "orange", [x, 0.1, 0.1], [1.4, 0.7, 1]);
        for (let i = 0; i < 2; i++)
          box(
            root,
            0.12,
            0.035,
            0.025,
            "stripe",
            [x, 0.73 - i * 0.1, 0.23],
            [0, 0, x > 0 ? -0.35 : 0.35],
          );
      }
      sphere(root, 0.1, "cream", [0, 0.74, 0.26], [1.4, 0.65, 0.4]);
      sphere(root, 0.035, "red", [0, 0.81, 0.31]);
      for (let i = 0; i < 3; i++)
        box(
          root,
          0.04,
          0.12,
          0.025,
          "stripe",
          [-0.1 + i * 0.1, 1.09, 0.2],
          [0, 0, 0.3],
        );
      tube(
        root,
        [
          [0.2, 0.1, 0],
          [0.5, 0.25, 0],
          [0.5, 0.55, 0],
        ],
        0.075,
        "orange",
      );
      tube(
        root,
        [
          [0.34, 0.16, 0.25],
          [0.52, 0.56, 0.25],
          [0.35, 1.05, 0.25],
        ],
        0.025,
        "brass",
      );
      tube(
        root,
        [
          [0.34, 0.16, 0.25],
          [0.35, 1.05, 0.25],
        ],
        0.008,
        "cream",
      );
      sphere(root, 0.08, "cream", [0.45, 0.55, 0.27]);
      parts.arrow = group(root, [0, 0.6, 0.3]);
      cylinder(
        parts.arrow,
        0.016,
        0.016,
        0.8,
        "brass",
        [0.3, 0, 0],
        [0, 0, Math.PI / 2],
      );
      cylinder(
        parts.arrow,
        0,
        0.07,
        0.16,
        "green",
        [0.75, 0, 0],
        [0, 0, -Math.PI / 2],
      );
      break;
    }
    case "photography":
      box(root, 0.85, 0.5, 0.35, "black", [0, 0.35, 0]);
      box(root, 0.25, 0.13, 0.26, "black", [0, 0.66, 0]);
      cylinder(
        root,
        0.22,
        0.24,
        0.28,
        "brass",
        [0, 0.35, 0.28],
        [Math.PI / 2, 0, 0],
      );
      cylinder(
        root,
        0.16,
        0.16,
        0.3,
        "blue",
        [0, 0.35, 0.3],
        [Math.PI / 2, 0, 0],
      );
      box(root, 0.13, 0.06, 0.14, "brass", [0.26, 0.64, 0]);
      break;
    case "lamp": {
      cylinder(root, 0.33, 0.37, 0.1, "black", [0, 0.1, 0]);
      parts.neck = group(root, [0, 0.15, 0]);
      tube(
        parts.neck,
        [
          [0, 0, 0],
          [-0.4, 0.9, 0],
          [0.2, 1.65, 0],
        ],
        0.055,
        "brass",
      );
      cylinder(
        parts.neck,
        0.14,
        0.31,
        0.28,
        "green",
        [0.2, 1.56, 0],
        [0, 0, -0.35],
      );
      parts.light = new T.PointLight("#ffe3a0", 0, 7, 2);
      parts.light.position.set(0.2, 1.4, 0);
      root.add(parts.light);
      break;
    }
    case "satellite": {
      sphere(root, 0.5, "blue", [0, 0.6, 0]);
      for (const a of [-0.7, 0, 0.7]) {
        const ring = mesh(
          root,
          new T.TorusGeometry(0.505, 0.008, 4, 48),
          "brass",
          [0, 0.6, 0],
        );
        ring.rotation.y = a;
      }
      cylinder(root, 0.16, 0.3, 0.18, "brass", [0, 0.03, 0]);
      cylinder(root, 0.035, 0.035, 0.25, "brass", [0, 0.2, 0]);
      parts.satellite = group(root, [0.75, 0.95, 0]);
      box(parts.satellite, 0.17, 0.17, 0.17, "brass");
      for (const x of [-0.3, 0.3]) {
        box(parts.satellite, 0.36, 0.18, 0.025, "blue", [x, 0, 0]);
        for (const dx of [-0.08, 0.08])
          box(parts.satellite, 0.008, 0.18, 0.03, "cream", [x + dx, 0, 0]);
      }
      break;
    }
    case "drawing": {
      box(root, 1.1, 1.4, 0.06, "cream", [0, 0.7, 0]);
      const f = group(root, [0, 0.7, 0.05]);
      frame(f, 1.15, 1.45, "brass");
      parts.lines = group(root);
      parts.artwork = mesh(
        root,
        new T.PlaneGeometry(1.04, 1.34),
        new T.MeshBasicMaterial({ color: "#fffdf5" }),
        [0, 0.7, 0.1],
      );
      parts.artwork.name = "original-face-drawing";
      break;
    }
    case "games": {
      sphere(root, 0.49, "cream", [0, 0.4, 0], [1.2, 0.52, 0.5]);
      for (const x of [-0.36, 0.36])
        sphere(root, 0.22, "black", [x, 0.2, 0], [0.75, 1.45, 1]);
      box(root, 0.2, 0.065, 0.04, "black", [-0.3, 0.45, 0.23]);
      box(root, 0.065, 0.2, 0.04, "black", [-0.3, 0.45, 0.23]);
      for (const x of [-0.14, 0.14]) {
        cylinder(
          root,
          0.09,
          0.1,
          0.05,
          "black",
          [x, 0.29, 0.25],
          [Math.PI / 2, 0, 0],
        );
        sphere(root, 0.055, "green", [x, 0.29, 0.3]);
      }
      parts.buttons = [];
      for (const [i, x, y, color] of [
        [0, 0.28, 0.53, "green"],
        [1, 0.38, 0.43, "red"],
        [2, 0.28, 0.33, "blue"],
        [3, 0.18, 0.43, "brass"],
      ]) {
        const button = sphere(root, 0.048, color, [x, y, 0.26], [1, 1, 0.6]);
        button.userData.buttonIndex = i;
        button.userData.restZ = 0.26;
        parts.buttons.push(button);
      }
      break;
    }
  }
  root.userData.parts = parts;
  return root;
}

export function buildRoom(scene) {
  const room = new T.Group();
  scene.add(room);
  const floor = box(room, 80, 0.2, 60, "stone", [0, -0.22, 0]);
  floor.receiveShadow = true;
  box(room, 32, 13, 0.25, "edge", [0, 5.8, -5]);
  for (const x of [-12.5, 12.5]) {
    const column = cylinder(room, 0.46, 0.5, 9, "stone", [x, 4.3, -3.3]);
    column.name = "outer-column";
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI * 2;
      cylinder(
        room,
        0.035,
        0.035,
        8.45,
        "edge",
        [x + Math.cos(a) * 0.47, 4.25, -3.3 + Math.sin(a) * 0.47],
        undefined,
        6,
      );
    }
    for (const y of [0, 8.6]) {
      box(room, 1.25, 0.22, 1.25, "stone", [x, y, -3.3]);
      cylinder(room, 0.68, 0.62, 0.25, "edge", [x, y + 0.2, -3.3]);
    }
  }
  box(room, 26, 0.45, 1.5, "stone", [0, 9, -3.3]);
  const pediment = new T.Shape();
  pediment.moveTo(-13, 0);
  pediment.lineTo(0, 2);
  pediment.lineTo(13, 0);
  pediment.closePath();
  const roof = mesh(
    room,
    new T.ExtrudeGeometry(pediment, { depth: 0.4, bevelEnabled: false }),
    "edge",
    [0, 9.3, -3.8],
  );
  roof.name = "triangular-pediment";
  const insignia = group(room, [0, 10.2, -3.23]);
  for (const angle of [0, Math.PI])
    mesh(
      insignia,
      new T.TorusGeometry(0.29, 0.017, 5, 28, Math.PI - 0.35),
      "brass",
      [0, 0, 0],
      [0, 0, angle + 0.175],
    );
  mesh(insignia, new T.TorusGeometry(0.105, 0.012, 5, 24), "brass");
  box(insignia, 0.21, 0.016, 0.02, "brass");
  box(insignia, 0.02, 0.15, 0.02, "brass", [0, 0.36, 0]);
  for (const [from, to] of [
    [
      [-13, 9.3, -3.3],
      [0, 11.3, -3.3],
    ],
    [
      [0, 11.3, -3.3],
      [13, 9.3, -3.3],
    ],
  ]) {
    const a = new T.Vector3(...from),
      b = new T.Vector3(...to),
      direction = b.clone().sub(a);
    const trim = cylinder(
      room,
      0.055,
      0.055,
      direction.length(),
      "stone",
      a.clone().add(b).multiplyScalar(0.5).toArray(),
    );
    trim.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      direction.normalize(),
    );
  }
  for (const z of [-1, 4, 9, 14])
    box(room, 38, 0.006, 0.018, "brass", [0, -0.11, z]);
  for (const x of [-12, -6, 0, 6, 12])
    box(room, 0.018, 0.006, 35, "brass", [x, -0.11, 7]);
  // The portrait remains an original, explicitly labelled placeholder.
  const portrait = group(room, [2.1, 4.2, -3.7]);
  box(portrait, 3.2, 4.1, 0.12, "green");
  ornateFrame(portrait, 3.5, 4.4);
  const bust = group(portrait, [0, -0.45, 0.3]);
  sphere(bust, 0.65, "cream", [0, 0.7, 0], [0.78, 1.15, 0.5]);
  cylinder(bust, 0.26, 0.35, 0.65, "cream", [0, -0.15, 0]);
  sphere(bust, 0.9, "cream", [0, -0.65, 0], [1.1, 0.55, 0.5]);
  box(bust, 1.8, 0.18, 0.6, "stone", [0, -1.12, 0]);
  room.userData.portrait = portrait;
  return room;
}

export function buildCabinet(scene, projects) {
  const cabinet = group(scene, [-2.2, 0, -1.7]);
  box(cabinet, 6.5, 6.25, 0.17, "wood", [0, 3.2, -0.75]);
  for (const x of [-3.35, 3.35])
    box(cabinet, 0.2, 6.5, 1.7, "wood", [x, 3.1, 0]);
  for (const y of [0.15, 0.8, 2.15, 3.5, 4.85, 6.35])
    box(cabinet, 6.9, 0.17, 1.8, y === 6.35 ? "trim" : "wood", [0, y, 0]);
  for (const x of [-2.9, 2.9])
    for (const z of [-0.55, 0.6])
      box(cabinet, 0.19, 0.4, 0.19, "trim", [x, -0.02, z]);
  const doors = [];
  const glass = new T.MeshPhysicalMaterial({
    color: "#dce3d4",
    transparent: true,
    opacity: 0.11,
    roughness: 0.15,
    depthWrite: false,
  });
  for (const sign of [-1, 1]) {
    const hinge = group(cabinet, [sign * 3.3, 3.5, 0.95]);
    const panel = group(hinge, [-sign * 1.65, 0, 0]);
    box(panel, 3.3, 5.55, 0.045, glass);
    frame(panel, 3.3, 5.55, "wood");
    for (const y of [-1.35, 0, 1.35])
      box(panel, 3.3, 0.06, 0.09, "brass", [0, y, 0]);
    box(panel, 0.06, 5.5, 0.09, "brass", [0, 0, 0]);
    cylinder(panel, 0.035, 0.035, 0.35, "brass", [-sign * 1.4, -0.1, 0.1]);
    doors.push({ hinge, sign });
  }
  const exhibits = new Map();
  const shelfIds = projects.filter(
    (p) => !["lamp", "drawing", "satellite"].includes(p.id),
  );
  shelfIds.forEach((p, i) => {
    const item = buildObject(p.id);
    item.position.set(
      [-2.1, 0, 2.1][i % 3],
      [4.94, 3.59, 2.24, 0.89][Math.floor(i / 3)],
      0.12,
    );
    item.scale.setScalar(0.85);
    cabinet.add(item);
    exhibits.set(p.id, item);
  });
  for (const [id, p, s] of [
    ["lamp", [-4.5, 0.6, 0.4], 1.2],
    ["drawing", drawingPosition(false), 1.4],
    ["satellite", [0, 6.5, 0], 1],
  ]) {
    const object = buildObject(id);
    object.position.set(...p);
    object.scale.setScalar(s);
    cabinet.add(object);
    exhibits.set(id, object);
    if (id === "lamp")
      cylinder(cabinet, 0.65, 0.65, 0.65, "stone", [-4.5, 0.2, 0.4]);
  }
  const arm = group(cabinet, [4, 0, 1]);
  cylinder(arm, 0.35, 0.5, 0.25, "black", [0, 0.1, 0]);
  const shoulder = group(arm, [0, 0.25, 0]);
  sphere(shoulder, 0.15, "brass");
  const upper = box(shoulder, 0.17, 1.2, 0.17, "cream", [0, 0.6, 0]);
  const elbow = group(shoulder, [0, 1.2, 0]);
  sphere(elbow, 0.15, "brass");
  const lower = box(elbow, 0.18, 1.05, 0.18, "cream", [0, 0.525, 0]);
  const grip = group(elbow, [0, 1.05, 0]);
  sphere(grip, 0.12, "brass");
  for (const x of [-0.12, 0.12])
    box(grip, 0.06, 0.25, 0.12, "black", [x, 0.1, 0]);
  const thumbsUp = group(grip, [0, 0.2, 0]);
  thumbsUp.visible = false;
  sphere(thumbsUp, 0.14, "cream", [0, 0, 0], [1, 0.8, 0.7]);
  for (let i = 0; i < 4; i++)
    sphere(
      thumbsUp,
      0.055,
      "cream",
      [-0.1 + i * 0.06, 0.08, 0.08],
      [0.65, 1, 0.7],
    );
  cylinder(
    thumbsUp,
    0.045,
    0.055,
    0.25,
    "cream",
    [0.15, 0.16, 0],
    [0, 0, -0.3],
  );
  const beam = new T.Mesh(
    new T.ConeGeometry(0.9, 2, 24, 1, true),
    new T.MeshBasicMaterial({
      color: "#ffdf8a",
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  beam.position.set(-4.3, 1.1, 0.4);
  cabinet.add(beam);
  beam.visible = false;
  for (const [id, item] of exhibits) {
    item.traverse((child) => {
      child.userData.projectId = id;
    });
    item.userData.basePosition = item.position.clone();
    item.userData.baseRotation = item.rotation.clone();
    item.userData.baseScale = item.scale.clone();
  }
  const pad = group(cabinet, [3.4, 0.2, 2.8]);
  cylinder(pad, 0.48, 0.6, 0.2, "stone");
  pad.visible = false;
  return {
    cabinet,
    exhibits,
    doors,
    arm,
    shoulder,
    elbow,
    grip,
    upper,
    lower,
    beam,
    pad,
    thumbsUp,
  };
}

// A telescoping two-link arm reaches the actual object before carrying it to the plinth.
export function positionRobot(collection, target) {
  const { arm, shoulder, elbow, grip, upper, lower } = collection;
  const dx = target.x - arm.position.x,
    dy = target.y - arm.position.y - 0.25,
    dz = target.z - arm.position.z;
  const horizontal = Math.hypot(dx, dz),
    distance = Math.max(0.2, Math.hypot(horizontal, dy));
  const length = Math.max(1.15, distance * 0.54);
  arm.rotation.y = -Math.atan2(dz, dx);
  const bend = Math.acos(T.MathUtils.clamp(distance / (2 * length), -1, 1));
  shoulder.rotation.z = Math.atan2(dy, horizontal) - bend - Math.PI / 2;
  elbow.rotation.z = 2 * bend;
  upper.scale.y = length / 1.2;
  upper.position.set(0, length / 2, 0);
  elbow.position.set(0, length, 0);
  lower.scale.y = length / 1.05;
  lower.position.set(0, length / 2, 0);
  grip.position.set(0, length, 0);
  collection.cabinet.updateWorldMatrix(true, true);
  return collection.cabinet.worldToLocal(
    grip.getWorldPosition(new T.Vector3()),
  );
}
