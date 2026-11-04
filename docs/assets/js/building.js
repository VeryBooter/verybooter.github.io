import * as T from "three";

export const entranceThreshold = -5;
export const shelfDepth = -27.7;

export function buildBuilding(
  scene,
  { box, cylinder, mesh, sphere, ornateFrame },
) {
  const building = new T.Group();
  building.name = "walk-in-gallery-building";
  scene.add(building);
  box(building, 80, 0.2, 90, "stone", [0, -0.22, -12]);
  // An actual enclosed interior behind an open front portal, not a backdrop plane.
  box(building, 0.3, 9.5, 28, "edge", [-13, 4.6, -19]);
  box(building, 0.3, 9.5, 28, "edge", [13, 4.6, -19]);
  const rear = box(building, 26, 9.5, 0.3, "edge", [0, 4.6, -33]);
  rear.name = "interior-rear-wall";
  box(building, 26, 0.25, 28, "stone", [0, 9.4, -19]);
  for (const x of [-7.9, 7.9])
    box(building, 10.2, 9, 0.45, "edge", [x, 4.4, -5]);
  box(building, 26, 3.2, 0.45, "edge", [0, 7.4, -5]);
  const portal = new T.Group();
  portal.name = "open-entrance-portal";
  building.add(portal);
  for (const x of [-3.05, 3.05])
    box(portal, 0.35, 6.2, 0.65, "stone", [x, 3, -4.85]);
  box(portal, 6.45, 0.3, 0.65, "stone", [0, 6.2, -4.85]);
  box(portal, 6.4, 0.12, 1.8, "stone", [0, -0.05, -4.5]);
  const entranceDoors = [];
  for (const sign of [-1, 1]) {
    const hinge = new T.Group();
    hinge.position.set(sign * 2.8, 2.85, -4.9);
    portal.add(hinge);
    const leaf = new T.Group();
    leaf.position.x = -sign * 1.4;
    hinge.add(leaf);
    const panel = box(leaf, 2.8, 5.7, 0.16, "wood");
    panel.userData.entranceDoor = true;
    for (const y of [-1.65, 0, 1.65])
      box(leaf, 2.6, 0.075, 0.06, "brass", [0, y, 0.12]);
    for (const x of [-1.18, 1.18])
      box(leaf, 0.065, 5.4, 0.06, "brass", [x, 0, 0.12]);
    sphere(leaf, 0.075, "brass", [-sign * 1.1, -0.1, 0.19]);
    entranceDoors.push({ hinge, sign });
  }
  for (const x of [-12.5, 12.5]) {
    const column = cylinder(building, 0.46, 0.5, 9, "stone", [x, 4.3, -3.3]);
    column.name = "outer-column";
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI * 2;
      cylinder(
        building,
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
      box(building, 1.25, 0.22, 1.25, "stone", [x, y, -3.3]);
      cylinder(building, 0.68, 0.62, 0.25, "edge", [x, y + 0.2, -3.3]);
    }
  }
  const roofBar = box(building, 26, 1, 1.5, "stone", [0, 9, -3.3]);
  roofBar.name = "rectangular-roof-bar";
  const shape = new T.Shape();
  shape.moveTo(-13, 0);
  shape.lineTo(0, 2);
  shape.lineTo(13, 0);
  shape.closePath();
  const pediment = mesh(
    building,
    new T.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false }),
    "edge",
    [0, 9.55, -3.8],
  );
  pediment.name = "triangular-pediment";
  for (const [from, to] of [
    [
      [-13, 9.55, -3.3],
      [0, 11.55, -3.3],
    ],
    [
      [0, 11.55, -3.3],
      [13, 9.55, -3.3],
    ],
  ]) {
    const a = new T.Vector3(...from),
      b = new T.Vector3(...to),
      direction = b.clone().sub(a);
    const trim = cylinder(
      building,
      0.055,
      0.055,
      direction.length(),
      "stone",
      a.clone().add(b).multiplyScalar(0.5).toArray(),
    );
    trim.name = "pediment-slope";
    trim.userData.baseY = trim.position.y;
    trim.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      direction.normalize(),
    );
  }
  const logo = new T.Group();
  logo.name = "triangle-exclusive-logo";
  logo.position.set(0, 10.35, -3.23);
  building.add(logo);
  for (const angle of [0, Math.PI])
    mesh(
      logo,
      new T.TorusGeometry(0.29, 0.017, 5, 28, Math.PI - 0.35),
      "brass",
      [0, 0, 0],
      [0, 0, angle + 0.175],
    );
  mesh(logo, new T.TorusGeometry(0.105, 0.012, 5, 24), "brass");
  box(logo, 0.21, 0.016, 0.02, "brass");
  box(logo, 0.02, 0.15, 0.02, "brass", [0, 0.36, 0]);
  for (const z of [-1, 4, -10, -16, -22, -28])
    box(building, 26, 0.006, 0.018, "brass", [0, -0.11, z]);
  for (const x of [-12, -6, 0, 6, 12])
    box(building, 0.018, 0.006, 52, "brass", [x, -0.11, -10]);
  const portrait = new T.Group();
  portrait.position.set(7.2, 4.2, -4.65);
  building.add(portrait);
  box(portrait, 3.2, 4.1, 0.12, "green");
  ornateFrame(portrait, 3.5, 4.4);
  const portraitImage = new T.Mesh(
    new T.PlaneGeometry(2.7333, 4.1),
    new T.MeshBasicMaterial({ color: 0xffffff }),
  );
  portraitImage.name = "supplied-oil-portrait";
  portraitImage.position.z = 0.08;
  portrait.add(portraitImage);
  const interiorLight = new T.PointLight("#ffe6ba", 120, 35, 2);
  interiorLight.position.set(0, 8, -20);
  building.add(interiorLight);
  for (const z of [-12, -23]) {
    cylinder(building, 0.6, 0.6, 0.08, "brass", [0, 9.15, z]);
  }
  building.userData = {
    portrait,
    entranceDoors,
    roofBar,
    portal,
    logo,
    threshold: entranceThreshold,
  };
  return building;
}
