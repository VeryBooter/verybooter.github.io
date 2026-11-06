import { buildAttendant } from "./attendants.js";
import * as T from "three";
import { box, cylinder, sphere, mesh } from "./models.js";

export { spaces } from "./space-catalogue.js";

const colored = (color, extra = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.72, ...extra });
const materials = {
  blue: colored("#728c9a"),
  ivory: colored("#e8dcc2"),
  sage: colored("#70816b"),
  clay: colored("#ae745c"),
  glass: colored("#aad6dc", {
    transparent: true,
    opacity: 0.5,
    metalness: 0.2,
    roughness: 0.12,
  }),
};
function label(parent, text, position, width = 2.4, color = "#e7ddc5") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 128;
  const c = canvas.getContext("2d");
  c.fillStyle = color;
  c.fillRect(0, 0, 768, 128);
  c.fillStyle = "#263e34";
  c.font = "500 40px Georgia";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 384, 64, 720);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const m = new T.Mesh(
    new T.PlaneGeometry(width, width / 6),
    new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }),
  );
  m.position.set(...position);
  parent.add(m);
  return m;
}
function object(root, name, position, build) {
  const g = new T.Group();
  g.position.set(...position);
  g.name = name;
  g.userData.exhibitTitle = name;
  root.add(g);
  build(g);
  label(g, name, [0, -0.3, 1.1], 2.3);
  return g;
}
function table(root, x, z, w = 5) {
  box(root, w, 0.18, 2, "wood", [x, 1.9, z]);
  for (const dx of [-w / 2 + 0.2, w / 2 - 0.2])
    for (const dz of [-0.8, 0.8])
      box(root, 0.12, 1.9, 0.12, "trim", [x + dx, 0.85, z + dz]);
}
function pot(root, x, y, z, r = 0.45) {
  cylinder(root, r, r * 0.85, 0.55, "brass", [x, y, z]);
  for (const sign of [-1, 1])
    box(root, 0.3, 0.08, 0.12, "black", [x + sign * r, y + 0.15, z]);
  cylinder(root, r * 1.02, r * 1.02, 0.06, "black", [x, y + 0.29, z]);
  sphere(root, 0.07, "wood", [x, y + 0.38, z]);
}
function cabinet(root, x, z, name, w = 1.4, h = 2) {
  return object(root, name, [x, h / 2, z], (g) => {
    box(g, w, h, 0.08, materials.ivory, [0, 0, -0.6]);
    for (const x of [-w / 2, w / 2])
      box(g, 0.08, h, 1.25, materials.ivory, [x, 0, 0]);
    for (const y of [-h / 2, h / 2, 0])
      box(g, w, 0.08, 1.25, materials.ivory, [0, y, 0]);
    for (let i = 0; i < 3; i++)
      cylinder(g, 0.12, 0.12, 0.35, ["blue", "cream", "green"][i], [
        -w * 0.25 + i * w * 0.25,
        0.22,
        0,
      ]);
    const hinge = new T.Group();
    hinge.position.set(-w / 2, 0, 0.66);
    g.add(hinge);
    box(hinge, w - 0.08, h - 0.08, 0.08, materials.sage, [w / 2, 0, 0]);
    box(hinge, 0.06, h * 0.45, 0.08, "brass", [w - 0.18, 0.1, 0.08]);
    g.userData.action = () => {
      g.userData.open = !g.userData.open;
    };
    g.userData.tick = (now, dt) => {
      const t = g.userData.open ? -1.6 : 0;
      hinge.rotation.y = T.MathUtils.damp(hinge.rotation.y, t, 12, dt);
    };
  });
}
function painting(root, x, y, z, index = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const c = canvas.getContext("2d");
  c.fillStyle = ["#d6c9a7", "#ccd4c8", "#c4d5d8"][index % 3];
  c.fillRect(0, 0, 512, 384);
  for (let layer = 0; layer < 4; layer++) {
    c.fillStyle = ["#9da995", "#6d8b80", "#567469", "#355a51"][layer];
    c.beginPath();
    c.moveTo(0, 384);
    for (let i = 0; i <= 12; i++)
      c.lineTo(
        i * 44,
        190 + layer * 38 - Math.sin(i * 1.4 + index + layer) * 55,
      );
    c.lineTo(512, 384);
    c.fill();
  }
  c.fillStyle = "#f5e5b8";
  c.beginPath();
  c.arc(390, 80, 29, 0, Math.PI * 2);
  c.fill();
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const g = new T.Group();
  g.position.set(x, y, z);
  root.add(g);
  box(g, 2.7, 2.1, 0.15, "wood");
  mesh(
    g,
    new T.PlaneGeometry(2.5, 1.9),
    new T.MeshBasicMaterial({ map: tex }),
    [0, 0, 0.09],
  );
  return g;
}
function shell(root, outdoor = false) {
  const theatre = root.name === "space-cinema";
  const wall = theatre ? colored("#332c35") : "edge";
  box(
    root,
    outdoor ? 70 : 23,
    0.2,
    outdoor ? 70 : 24,
    outdoor ? "green" : colored(theatre ? "#292731" : "#baa78a"),
    [0, -0.2, 0],
  );
  if (!outdoor) {
    box(root, 23, 0.2, 24, theatre ? colored("#222127") : "cream", [0, 8, 0]);
    for (let x = -11; x <= 11; x += 1.1)
      box(root, 0.015, 0.01, 24, "wood", [x, -0.09, 0]);
    for (const x of [-11.35, 11.35])
      box(root, 0.1, 0.25, 18, "wood", [x, 0.05, 1]);
    box(root, 23, 0.25, 0.1, "wood", [0, 0.05, -7.8]);
    box(root, 23, 8, 0.2, wall, [0, 3.8, -8]);
    box(root, 0.2, 8, 18, wall, [-11.5, 3.8, 1]);
    box(root, 0.2, 8, 18, wall, [11.5, 3.8, 1]);
    if (!theatre)
      for (const x of [-8, 8]) {
        box(root, 3.5, 3, 0.1, materials.blue, [x, 4.7, -7.85]);
        for (const dx of [-1.7, 0, 1.7])
          box(root, 0.07, 3.1, 0.12, "cream", [x + dx, 4.7, -7.75]);
        box(root, 3.5, 0.08, 0.12, "cream", [x, 4.7, -7.74]);
      }
    for (const x of [-5, 5]) {
      cylinder(root, 0.75, 0.9, 0.18, "brass", [x, 7.2, -1]);
    }
  }
  const door = box(root, 1.7, 3, 0.2, "green", [-9.3, 1.4, -7.7]);
  door.userData.destination = "cabinet";
  label(root, "GALLERY ←", [-9.3, 3.2, -7.5], 1.8);
}
function kitchen(root) {
  cabinet(root, -8, -5, "Fridge", 1.8, 3.6);
  cabinet(root, -5.7, -5, "Oven", 1.8, 2);
  table(root, 0, -5, 8);
  table(root, 2, 1, 9);
  object(root, "Microwave", [-3.1, 2.5, -5], (g) => {
    box(g, 1.6, 0.95, 1, "cream");
    box(g, 1.2, 0.65, 0.03, "black", [-0.12, 0, 0.52]);
    for (let i = 0; i < 3; i++)
      sphere(g, 0.04, "brass", [0.66, -0.2 + i * 0.2, 0.56]);
  });
  object(root, "Pressure cooker", [-0.8, 2.3, -5], (g) => {
    pot(g, 0, 0, 0, 0.52);
    cylinder(g, 0.04, 0.04, 0.13, "black", [0, 0.48, 0]);
  });
  object(root, "Air fryer", [1.2, 2.6, -5], (g) => {
    box(g, 1.1, 1.3, 1, "black");
    box(g, 0.8, 0.45, 0.07, "wood", [0, -0.28, 0.54]);
    box(g, 0.4, 0.06, 0.1, "brass", [0, -0.12, 0.62]);
  });
  object(root, "Hot water brewer", [3.2, 2.5, -5], (g) => {
    cylinder(g, 0.43, 0.42, 0.95, "brass");
    mesh(
      g,
      new T.TorusGeometry(0.32, 0.05, 8, 16, Math.PI),
      "black",
      [0.42, 0, 0],
      [0, 0, -Math.PI / 2],
    );
  });
  object(root, "Blender", [-1, 2.5, 1], (g) => {
    box(g, 0.65, 0.35, 0.65, "blue", [0, -0.35, 0]);
    cylinder(g, 0.32, 0.24, 0.85, materials.glass, [0, 0.25, 0]);
    cylinder(g, 0.33, 0.33, 0.06, "black", [0, 0.7, 0]);
  });
  object(root, "Dough mixer", [1.2, 2.4, 1], (g) => {
    box(g, 0.9, 0.2, 0.8, "red", [0, -0.25, 0]);
    box(g, 0.3, 1.05, 0.55, "red", [-0.3, 0.2, 0]);
    box(g, 0.9, 0.3, 0.55, "red", [0, 0.65, 0]);
    pot(g, 0.2, 0, 0, 0.32);
  });
  object(root, "Vacuum sealer", [3.5, 2.1, 1], (g) => {
    box(g, 1.45, 0.23, 0.7, "black");
    box(g, 1.2, 0.01, 0.6, materials.glass, [0, -0.1, 0.7]);
  });
  object(root, "Board & knife", [5.5, 2.05, 1], (g) => {
    box(g, 1.5, 0.08, 0.9, "wood");
    box(g, 0.7, 0.025, 0.2, "cream", [0, 0.06, 0]);
    box(g, 0.42, 0.06, 0.12, "black", [0.53, 0.07, 0]);
  });
  object(root, "Moka pot", [5.1, 2.4, -5], (g) => {
    cylinder(g, 0.3, 0.38, 0.4, "brass", [0, -0.15, 0], undefined, 6);
    cylinder(g, 0.39, 0.26, 0.45, "brass", [0, 0.28, 0], undefined, 6);
    box(g, 0.1, 0.4, 0.1, "black", [0.48, 0.25, 0]);
  });
  object(root, "Pan · pot · sauté pan", [-6, 2.1, 1], (g) => {
    for (let i = 0; i < 3; i++) {
      cylinder(g, 0.38, 0.33, 0.15, "black", [i * 0.9 - 0.9, 0, 0]);
      box(g, 0.08, 0.07, 0.6, "wood", [i * 0.9 - 0.9, 0, 0.55]);
    }
  });
  object(root, "Stove & pot", [-5.7, 2.15, -5], (g) => {
    for (const x of [-0.4, 0.4])
      for (const z of [-0.3, 0.3])
        cylinder(g, 0.2, 0.2, 0.04, "black", [x, 0, z]);
    pot(g, 0, 0.35, 0, 0.35);
  });
  painting(root, 0, 5.7, -7.8, 2);
}
function library(root) {
  for (const x of [-7, -3, 1, 5, 9]) {
    box(root, 2.8, 5.8, 0.9, "wood", [x, 2.8, -6.8]);
    for (let shelf = 0; shelf < 4; shelf++) {
      box(root, 2.6, 0.1, 0.95, "cream", [x, 0.6 + shelf * 1.35, -6.6]);
      for (let j = 0; j < 7; j++)
        box(
          root,
          0.25,
          0.7 + (j % 3) * 0.13,
          0.6,
          ["green", "blue", "red", "cream"][j % 4],
          [x - 1 + j * 0.32, 1.1 + shelf * 1.35, -6.3],
        );
    }
  }
  table(root, 0, 1, 7);
  object(root, "Pen & paper", [-1.8, 2.05, 1], (g) => {
    box(g, 1.2, 0.015, 0.85, "cream");
    cylinder(
      g,
      0.025,
      0.025,
      0.8,
      "black",
      [0.3, 0.04, 0],
      [0, 0, Math.PI / 2],
    );
  });
  object(root, "Chinese calligraphy", [1, 2.05, 1], (g) => {
    box(g, 1.5, 0.02, 0.8, "cream");
    box(g, 0.45, 0.06, 0.35, "black", [-0.65, 0.05, 0]);
    for (let i = 0; i < 3; i++)
      cylinder(
        g,
        0.025,
        0.025,
        0.9,
        "wood",
        [0.3 + i * 0.1, 0.07, 0],
        [0, 0, Math.PI / 2],
      );
    cylinder(g, 0.13, 0.13, 0.3, "brass", [0.7, 0.2, -0.25]);
  });
  object(root, "Reading light", [2.9, 2.1, 1], (g) => {
    cylinder(g, 0.3, 0.3, 0.06, "brass");
    cylinder(g, 0.03, 0.03, 1.1, "brass", [0, 0.55, 0]);
    cylinder(g, 0.14, 0.42, 0.3, "green", [0, 1.2, 0]);
  });
  label(root, "PHYSICS · COMPUTING · LITERATURE", [0, 6.6, -7.7], 7);
}
function workshop(root, boat = false) {
  table(root, -4, -4, 6);
  table(root, 4, -4, 6);
  box(root, 6, 2.8, 0.15, "wood", [-4, 4.3, -7.6]);
  for (let i = 0; i < 8; i++) {
    cylinder(root, 0.055, 0.055, 0.8, "black", [-6.5 + i * 0.65, 4.3, -7.4]);
    box(root, 0.12, 0.3, 0.12, "red", [-6.5 + i * 0.65, 4.9, -7.4]);
  }
  object(root, "Soldering station", [-4, 2.2, -4], (g) => {
    box(g, 0.9, 0.35, 0.8, "blue");
    cylinder(g, 0.04, 0.04, 0.9, "black", [0.7, 0.25, 0], [0, 0, -0.6]);
    mesh(
      g,
      new T.TorusGeometry(0.18, 0.025, 6, 12, Math.PI),
      "brass",
      [0.7, 0.12, 0],
    );
  });
  object(root, "Screws & tools", [-1.8, 2.1, -4], (g) => {
    box(g, 1.5, 0.1, 1, "wood");
    for (let i = 0; i < 8; i++)
      cylinder(g, 0.04, 0.04, 0.25, "brass", [
        -0.5 + (i % 4) * 0.3,
        0.17,
        Math.floor(i / 4) * 0.35 - 0.2,
      ]);
  });
  object(root, "Electronics bench", [4, 2.2, -4], (g) => {
    box(g, 1.7, 0.05, 1, "green");
    for (let i = 0; i < 5; i++)
      box(g, 0.15, 0.12, 0.3, "black", [-0.6 + i * 0.3, 0.1, 0]);
    box(g, 1.4, 0.9, 0.2, "black", [0, 0.65, -0.4]);
    box(g, 1.2, 0.7, 0.03, "blue", [0, 0.65, -0.28]);
  });
  if (boat) {
    table(root, 0, 1, 6);
    object(root, "SailBot", [0, 2.7, 1], (g) => {
      sphere(g, 1, "cream", [0, 0, 0], [0.8, 0.35, 2.5]);
      cylinder(g, 0.045, 0.045, 3.5, "wood", [0, 1.6, 0]);
      const sh = new T.Shape();
      sh.moveTo(0, 0);
      sh.lineTo(0, 3);
      sh.lineTo(1.6, 0.3);
      sh.closePath();
      mesh(
        g,
        new T.ShapeGeometry(sh),
        new T.MeshStandardMaterial({ color: "#ede6ce", side: T.DoubleSide }),
        [0.04, 0.15, 0],
      );
      box(g, 0.8, 0.12, 0.6, "blue", [0, 0.3, 1]);
    });
    label(root, "AUTONOMOUS SAILING · PITT SAILBOT", [0, 6.8, -7.7], 8);
  } else
    object(root, "Mechanical vise", [0, 1, 2], (g) => {
      box(g, 3, 1.7, 2, "wood");
      box(g, 1.1, 0.3, 0.7, "blue", [0, 1, 0]);
      cylinder(g, 0.06, 0.06, 1.6, "brass", [0, 1.1, 0.5], [0, 0, Math.PI / 2]);
    });
}
function sculpture(root, x, z, kind) {
  object(root, kind, [x, 0.55, z], (g) => {
    box(g, 2.1, 0.65, 2.1, "stone", [0, -0.35, 0]);
    if (kind === "Minecraft figure") {
      box(g, 1, 1.25, 0.55, "blue", [0, 1.55, 0]);
      box(g, 0.75, 0.75, 0.75, "cream", [0, 2.6, 0]);
      for (const side of [-1, 1]) {
        box(g, 0.4, 1.1, 0.4, "black", [side * 0.28, 0.5, 0]);
        box(g, 0.35, 1.2, 0.45, "green", [side * 0.7, 1.55, 0]);
        box(g, 0.08, 0.08, 0.04, "black", [side * 0.15, 2.67, 0.4]);
      }
    } else {
      const person = buildAttendant("roman");
      person.scale.setScalar(1.35);
      g.add(person);
      person.userData.gift.visible = false;
      if (kind.includes("infantry"))
        person.traverse((child) => {
          if (child.material) {
            child.material = child.material.clone();
            child.material.color?.set("#465753");
          }
        });
      person.userData.arms.forEach(
        (arm, i) => (arm.rotation.x = i ? -0.2 : -0.1),
      );
      if (kind.includes("infantry")) {
        box(g, 0.8, 0.8, 0.2, "black", [0, 1.8, 0.35]);
        box(g, 0.65, 0.18, 0.15, "blue", [0, 2.7, 0.35]);
      }
    }
  });
}
function museum(root) {
  const flow = new T.Group();
  root.add(flow);
  for (let i = 0; i < 6; i++) {
    const p = painting(flow, i * 3.1 - 8, 5.7, -7.7, i);
    p.userData.offset = i * 3.1;
  }
  flow.userData.tick = (now) =>
    flow.children.forEach(
      (p) => (p.position.x = ((now * 0.00065 + p.userData.offset) % 19) - 9.5),
    );
  sculpture(root, -7, -4, "Minecraft figure");
  sculpture(root, -3, -4, "Knight");
  sculpture(root, 1, -4, "Armored infantry concept");
  object(root, "Armored vehicle concept", [-6, 1, 2], (g) => {
    box(g, 2, 0.5, 1.3, "green");
    box(g, 1, 0.4, 0.8, "green", [0, 0.45, 0]);
    cylinder(g, 0.07, 0.07, 1.4, "black", [0, 0.5, 1], [Math.PI / 2, 0, 0]);
    for (const x of [-0.9, 0.9])
      for (let z = -0.5; z <= 0.5; z += 0.33)
        cylinder(g, 0.2, 0.2, 0.15, "black", [x, -0.2, z], [0, 0, Math.PI / 2]);
  });
  object(root, "Radar studies", [-2, 1, 2], (g) => {
    cylinder(g, 0.4, 0.55, 0.3, "stone");
    const antenna = new T.Group();
    antenna.position.y = 0.8;
    g.add(antenna);
    box(antenna, 1.4, 0.9, 0.1, "green");
    for (let x = 0; x < 6; x++)
      for (let y = 0; y < 4; y++)
        sphere(antenna, 0.035, "brass", [
          -0.55 + x * 0.22,
          -0.3 + y * 0.2,
          0.07,
        ]);
    g.userData.tick = (now) => (antenna.rotation.y = now * 0.0005);
  });
  object(root, "Drone & aircraft concepts", [2, 1.3, 2], (g) => {
    box(g, 0.4, 0.25, 2, "cream");
    box(g, 2, 0.08, 0.5, "blue");
    for (const x of [-0.8, 0.8])
      for (const z of [-0.6, 0.6]) {
        cylinder(g, 0.025, 0.025, 0.25, "black", [x, 0.15, z]);
        box(g, 0.65, 0.025, 0.08, "black", [x, 0.29, z]);
      }
  });
  object(root, "Ceramics · enamel · ding", [6, 1.1, 1], (g) => {
    for (let i = 0; i < 3; i++) {
      cylinder(g, 0.3, 0.2, 0.7, ["cream", "blue", "brass"][i], [
        i * 0.8 - 0.8,
        0,
        0,
      ]);
      for (const x of [-0.12, 0.12])
        box(g, 0.06, 0.3, 0.06, "brass", [i * 0.8 - 0.8 + x, -0.45, 0]);
    }
  });
  object(root, "Turbine & piston", [6, 1, -4], (g) => {
    const rotor = new T.Group();
    g.add(rotor);
    mesh(rotor, new T.TorusGeometry(0.65, 0.12, 8, 24), "brass");
    for (let i = 0; i < 10; i++) {
      const blade = box(rotor, 0.08, 0.55, 0.12, "blue", [
        Math.cos(i * 0.628) * 0.35,
        Math.sin(i * 0.628) * 0.35,
        0,
      ]);
      blade.rotation.z = i * 0.628;
    }
    const piston = cylinder(g, 0.18, 0.18, 0.5, "cream", [1, 0.1, 0]);
    cylinder(g, 0.06, 0.06, 1.2, "brass", [1, -0.3, 0]);
    g.userData.tick = (now) => {
      rotor.rotation.z = now * 0.002;
      piston.position.y = 0.1 + Math.sin(now * 0.003) * 0.35;
    };
  });
  object(root, "Artillery model", [-7, 1, 5], (g) => {
    box(g, 1.2, 0.3, 1, "green");
    for (const x of [-0.7, 0.7])
      cylinder(g, 0.35, 0.35, 0.18, "black", [x, -0.2, 0], [0, 0, Math.PI / 2]);
    cylinder(
      g,
      0.08,
      0.12,
      1.7,
      "green",
      [0, 0.4, 0.7],
      [Math.PI / 2 - 0.3, 0, 0],
    );
  });
  object(root, "Aircraft · long-range drone", [-2.5, 1.2, 5], (g) => {
    sphere(g, 1, "cream", [0, 0, 0], [0.16, 0.14, 1.3]);
    const wing = new T.Shape();
    wing.moveTo(0, 0.8);
    wing.lineTo(1.5, -0.5);
    wing.lineTo(-1.5, -0.5);
    wing.closePath();
    mesh(
      g,
      new T.ShapeGeometry(wing),
      new T.MeshStandardMaterial({ color: "#617b88", side: T.DoubleSide }),
      [0, 0, 0],
      [-Math.PI / 2, 0, 0],
    );
    box(g, 0.6, 0.05, 0.25, "green", [0, 0.08, -1]);
  });
  object(root, "Fleet studies", [2, 1, 5], (g) => {
    for (let i = 0; i < 3; i++) {
      sphere(g, 0.8, "blue", [i * 0.7 - 0.7, 0, 0], [0.3, 0.2, 1]);
      box(g, 0.2, 0.18, 0.5, "cream", [i * 0.7 - 0.7, 0.15, 0]);
      cylinder(g, 0.015, 0.015, 0.5, "black", [i * 0.7 - 0.7, 0.45, 0]);
    }
  });
  object(root, "Solar · grid · motor", [6.5, 1, 5], (g) => {
    const panel = box(g, 1.2, 0.07, 1.1, "blue", [-0.5, 0.3, 0]);
    panel.rotation.x = 0.25;
    for (let i = 0; i < 4; i++)
      box(g, 0.01, 0.01, 1, "cream", [-1 + i * 0.3, 0.41, 0]);
    mesh(g, new T.TorusGeometry(0.3, 0.08, 8, 24), "brass", [0.8, 0.4, 0]);
    for (const x of [-0.9, -0.3]) {
      cylinder(g, 0.025, 0.025, 1.3, "wood", [x, 0.65, -0.7]);
      box(g, 0.6, 0.03, 0.03, "black", [x, 1.1, -0.7]);
    }
    const vane = new T.Group();
    vane.position.set(0.8, 1.5, 0);
    g.add(vane);
    for (let i = 0; i < 3; i++) {
      const blade = box(vane, 0.08, 0.65, 0.04, "cream", [
        Math.sin(i * 2.094) * 0.3,
        Math.cos(i * 2.094) * 0.3,
        0,
      ]);
      blade.rotation.z = -i * 2.094;
    }
    g.userData.tick = (now) => (vane.rotation.z = now * 0.002);
  });
}

function optics(root) {
  table(root, 0, 0, 8);
  for (let i = 0; i < 5; i++)
    object(
      root,
      ["Convex lens", "Concave lens", "Prism", "Glassware", "Jewelry study"][i],
      [-6 + i * 3, 2.3, -1],
      (g) => {
        cylinder(g, 0.45, 0.55, 0.15, "wood", [0, -0.4, 0]);
        if (i === 2)
          mesh(
            g,
            new T.CylinderGeometry(0.55, 0.55, 1, 3),
            materials.glass,
            [0, 0.2, 0],
          );
        else sphere(g, 0.7, materials.glass, [0, 0.3, 0], [0.9, 1, 0.25]);
      },
    );
  const lens = new T.Group();
  lens.position.set(0, 5, -6.8);
  root.add(lens);
  sphere(lens, 0.8, "black");
  for (let i = 0; i < 3; i++) {
    const ring = mesh(
      lens,
      new T.TorusGeometry(1.3 + i * 0.3, 0.035, 8, 80),
      new T.MeshBasicMaterial({ color: ["#d3a251", "#88c4cf", "#efe0ae"][i] }),
    );
    ring.rotation.x = i * 0.5;
  }
  lens.userData.tick = (now) => (lens.rotation.z = now * 0.0004);
  label(root, "GRAVITATIONAL LENSING · A VISUAL STUDY", [0, 7, -7.7], 8);
}
function garden(root, farm = false) {
  if (farm) {
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        box(root, 3, 0.3, 2.4, "wood", [-6 + col * 5, 0, -5 + row * 5]);
        box(root, 2.8, 0.1, 2.2, "trim", [-6 + col * 5, 0.2, -5 + row * 5]);
        for (let j = 0; j < 6; j++) {
          const x = -7 + col * 5 + (j % 3),
            z = -5.5 + row * 5 + Math.floor(j / 3);
          cylinder(root, 0.035, 0.035, 0.6, "green", [x, 0.55, z]);
          sphere(root, 0.3, "green", [x, 0.8, z], [1, 0.6, 1]);
        }
      }
    object(root, "Watering can", [7, 0.5, 2], (g) => {
      cylinder(g, 0.45, 0.4, 0.7, "green");
      cylinder(g, 0.07, 0.12, 0.8, "brass", [0.5, 0.3, 0], [0, 0, -0.9]);
      g.userData.action = () => {
        g.rotation.z = g.rotation.z ? 0 : -0.6;
      };
    });
    return;
  }
  cylinder(root, 4, 4, 0.08, materials.blue, [0, -0.02, 1], undefined, 48);
  for (let i = 0; i < 11; i++) {
    const x = Math.sin(i * 2.4) * 8,
      z = -5 - Math.cos(i) * 2;
    const h = 3 + (i % 4) * 1.5;
    const rock = new T.CylinderGeometry(0.6, 1.1, h, 9, 8);
    const vertices = rock.attributes.position;
    for (let j = 0; j < vertices.count; j++) {
      const y = vertices.getY(j),
        ripple = 1 + 0.15 * Math.sin(y * 3.1 + i) + 0.1 * Math.cos(j * 2.7);
      vertices.setX(j, vertices.getX(j) * ripple);
      vertices.setZ(j, vertices.getZ(j) * ripple);
    }
    rock.computeVertexNormals();
    mesh(root, rock, colored(i % 2 ? "#85907c" : "#a2a28c"), [x, h / 2, z]);
    for (let tree = 0; tree < 3; tree++) {
      const dx = Math.sin(tree * 2 + i) * 0.35,
        dz = Math.cos(tree * 2 + i) * 0.35;
      cylinder(root, 0.035, 0.05, 0.5, "wood", [x + dx, h + 0.2, z + dz]);
      sphere(root, 0.35, "green", [x + dx, h + 0.5, z + dz], [1, 0.8, 1]);
    }
  }
  for (let i = 0; i < 5; i++)
    box(root, 4 - i * 0.5, 0.5, 2, "red", [7, i * 0.5, -3]);
  mesh(root, new T.TorusGeometry(2, 0.3, 10, 48), "cream", [-7, 2, -1]);
  for (let i = 0; i < 7; i++)
    box(root, 1, 0.2, 2, "wood", [
      -3 + i,
      Math.sin((i / 6) * Math.PI) * 0.6 + 0.25,
      2,
    ]);
  const fountain = new T.Group();
  fountain.position.set(1, 0, -1);
  root.add(fountain);
  cylinder(fountain, 1.1, 1.3, 0.3, "stone");
  cylinder(fountain, 0.16, 0.28, 1.2, "stone", [0, 0.6, 0]);
  for (let i = 0; i < 16; i++) {
    const drop = sphere(fountain, 0.07, materials.glass, [0, 1.5, 0]);
    drop.userData.i = i;
  }
  fountain.userData.tick = (now) =>
    fountain.children
      .filter((c) => c.userData.i !== undefined)
      .forEach((c) => {
        const t = (now * 0.0005 + c.userData.i / 16) % 1,
          a = c.userData.i * 2.4;
        c.position.set(
          Math.cos(a) * t,
          1.6 + Math.sin(t * Math.PI) * 1.2 - t * 1.3,
          Math.sin(a) * t,
        );
      });
  const pavilion = new T.Group();
  pavilion.position.set(-7, 0, 5);
  root.add(pavilion);
  for (const x of [-1.3, 1.3])
    for (const z of [-1.1, 1.1])
      cylinder(pavilion, 0.09, 0.1, 2.8, "wood", [x, 1.4, z]);
  const roof = mesh(
    pavilion,
    new T.ConeGeometry(2.5, 1, 4),
    "trim",
    [0, 3.3, 0],
  );
  roof.rotation.y = Math.PI / 4;
  box(pavilion, 3, 0.15, 2.7, "stone", [0, 0.05, 0]);
  for (let i = 0; i < 9; i++)
    box(root, 0.7, 0.035, 0.6, "stone", [
      -7 + i * 0.7,
      -0.04,
      4 + Math.sin(i) * 0.2,
    ]);
  label(root, "MOUNTAIN LAKE · MOON GATE · CANYON STUDY", [0, 7, -7], 9);
}
function cinema(root) {
  box(root, 10, 5, 0.2, "black", [0, 4.5, -7.6]);
  const screen = mesh(
    root,
    new T.PlaneGeometry(9.6, 4.6),
    new T.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
    [0, 4.5, -7.45],
  );
  screen.name = "cinema-screen";
  for (let r = 0; r < 3; r++)
    for (let seat = 0; seat < 5; seat++) {
      const x = seat * 1.6 - 3.2,
        z = -2 + r * 3;
      box(root, 1.2, 0.3, 1.2, "red", [x, 0.6, z]);
      box(root, 1.2, 1.4, 0.22, "red", [x, 1.3, z + 0.55]);
    }
  box(root, 13, 0.4, 3, "wood", [0, 0.1, -5.8]);
  label(root, "LENS DWELLERS", [0, 7.4, -7.4], 6);
  for (const x of [-6, 6]) box(root, 0.8, 6, 0.6, "red", [x, 4, -7.2]);
}
function music(root) {
  table(root, 0, -3, 7);
  object(root, "Keyboard", [0, 2.1, -3], (g) => {
    box(g, 5, 0.25, 1, "black");
    for (let i = 0; i < 24; i++) {
      box(g, 0.19, 0.05, 0.8, "cream", [-2.3 + i * 0.2, 0.15, 0.05]);
      if (i % 7 !== 2 && i % 7 !== 6)
        box(g, 0.1, 0.07, 0.45, "black", [-2.2 + i * 0.2, 0.2, -0.12]);
    }
  });
  object(root, "Mixing console", [0, 1.1, 2], (g) => {
    box(g, 3, 0.3, 2, "black");
    for (let i = 0; i < 8; i++) {
      box(g, 0.04, 0.02, 0.8, "cream", [-1.1 + i * 0.3, 0.17, 0]);
      box(g, 0.18, 0.08, 0.12, "brass", [
        -1.1 + i * 0.3,
        0.2,
        Math.sin(i) * 0.3,
      ]);
    }
  });
  for (const x of [-5, 5])
    object(root, "Studio monitor", [x, 2, -4], (g) => {
      box(g, 1.7, 2.7, 1.3, "black");
      for (const y of [-0.55, 0.55])
        cylinder(
          g,
          0.48,
          0.48,
          0.06,
          "trim",
          [0, y, 0.69],
          [Math.PI / 2, 0, 0],
        );
    });
  label(root, "MUSIC PRODUCTION", [0, 6, -7.7], 6);
}
function closet(root) {
  for (const x of [-7, 7]) {
    cabinet(root, x, -5, "Wardrobe", 4, 5.5);
    cylinder(root, 0.04, 0.04, 3.5, "brass", [x, 4.6, -3], [0, 0, Math.PI / 2]);
    for (let i = 0; i < 5; i++) {
      const color = ["blue", "green", "red", "cream", "black"][i];
      box(root, 0.55, 1.5, 0.2, color, [x - 1.3 + i * 0.65, 3.6, -3]);
      box(root, 0.85, 0.25, 0.2, color, [x - 1.3 + i * 0.65, 4.3, -3]);
    }
  }
  object(root, "Draped form", [0, 1.5, 0], (g) => {
    cylinder(g, 0.2, 0.6, 1.7, "cream");
    sphere(g, 0.3, "cream", [0, 1.3, 0]);
    cylinder(g, 0.35, 0.6, 0.1, "brass", [0, -1.4, 0]);
  });
  label(root, "FASHION · SHAPE · MATERIAL", [0, 6.8, -7.7], 7);
}
function campus(root, bellefield = false) {
  const floors = bellefield ? 13 : 10;
  for (let section = 0; section < (bellefield ? 3 : 1); section++) {
    const w = bellefield ? 8 - section * 1.5 : 12,
      h = bellefield ? 4 : 12,
      y = bellefield ? 2 + section * 4 : 6;
    box(root, w, h, 5, bellefield ? "wood" : "stone", [0, y, -3]);
    for (let f = 0; f < (bellefield ? 4 : floors); f++)
      for (let col = 0; col < 8; col++)
        box(root, 0.48, 0.65, 0.05, "blue", [
          -w / 2 + 0.55 + (col * (w - 1.1)) / 7,
          y - h / 2 + 0.7 + f * (h / (bellefield ? 4 : floors)),
          -0.46,
        ]);
  }
  box(root, 14, 0.5, 8, "stone", [0, 0.1, -2]);
  const door = box(root, 2.3, 2.6, 0.1, "green", [0, 1.6, 2.1]);
  door.name = "campus-entry";
  door.userData.destination = bellefield ? "library" : "sailbot";
  if (!bellefield) {
    for (const x of [-1.45, 1.45]) box(root, 0.15, 3, 3, "edge", [x, 1.6, 0.8]);
    box(root, 3, 0.15, 3, "stone", [0, 3.1, 0.8]);
    label(root, "SAILBOT →", [0, 2.1, -0.35], 1.8);
  }
  for (const x of [-1.2, 1.2])
    box(root, 0.15, 2.9, 0.4, "brass", [x, 1.6, 2.1]);
  label(
    root,
    bellefield ? "BELLEFIELD · PITT SCI" : "BENEDUM HALL",
    [0, 3.6, 2.2],
    7,
  );
  label(
    root,
    bellefield ? "COMPUTING & INFORMATION" : "ENTER → SAILBOT WORKSHOP",
    [0, 0.6, 2.3],
    5,
  );
}

export function buildSpace(id) {
  const root = new T.Group();
  root.name = `space-${id}`;
  root.position.x = 120;
  const outdoor = ["garden", "farmland", "benedum", "bellefield"].includes(id);
  shell(root, outdoor);
  ({
    kitchen,
    library,
    workshop,
    museum,
    optics,
    garden,
    farmland: (r) => garden(r, true),
    cinema,
    music,
    closet,
    benedum: (r) => campus(r),
    bellefield: (r) => campus(r, true),
    sailbot: (r) => workshop(r, true),
  })[id]?.(root);
  return root;
}
export function animateSpace(root, now, delta, motion) {
  if (!root || !motion) return;
  root.traverse((item) => item.userData.tick?.(now, delta));
}
