import * as T from "three";

// Raised mouldings, scrolling vines, and corner rosettes follow the supplied gilt-frame reference.
export function ornateFrame(parent, width, height) {
  const gold = new T.MeshStandardMaterial({
    color: "#bc893d",
    metalness: 0.72,
    roughness: 0.36,
  });
  const highlight = new T.MeshStandardMaterial({
    color: "#deb773",
    metalness: 0.62,
    roughness: 0.3,
  });
  const recess = new T.MeshStandardMaterial({
    color: "#71491f",
    metalness: 0.5,
    roughness: 0.48,
  });
  const frame = new T.Group();
  frame.name = "ornate-gilt-portrait-frame";
  parent.add(frame);
  function moulding(w, h, thickness, depth, material, z) {
    const shape = new T.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.closePath();
    const hole = new T.Path();
    hole.moveTo(-w / 2 + thickness, -h / 2 + thickness);
    hole.lineTo(-w / 2 + thickness, h / 2 - thickness);
    hole.lineTo(w / 2 - thickness, h / 2 - thickness);
    hole.lineTo(w / 2 - thickness, -h / 2 + thickness);
    hole.closePath();
    shape.holes.push(hole);
    const mesh = new T.Mesh(
      new T.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 3,
        steps: 1,
      }),
      material,
    );
    mesh.position.z = z;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    frame.add(mesh);
  }
  moulding(width + 0.45, height + 0.45, 0.29, 0.14, recess, 0.08);
  moulding(width + 0.36, height + 0.36, 0.22, 0.16, gold, 0.17);
  moulding(width + 0.1, height + 0.1, 0.065, 0.08, highlight, 0.31);
  moulding(width - 0.12, height - 0.12, 0.045, 0.045, gold, 0.29);
  const leaves = [];
  const dummy = new T.Object3D();
  function leaf(x, y, angle, scale = 1) {
    leaves.push({ x, y, angle, scale });
  }
  function scroll(x, y, mirror, angle = 0) {
    const points = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32,
        a = t * Math.PI * 3.4,
        r = 0.2 * (1 - t) + 0.018;
      const sx = Math.cos(a) * r * mirror,
        sy = Math.sin(a) * r;
      points.push(
        new T.Vector3(
          x + sx * Math.cos(angle) - sy * Math.sin(angle),
          y + sx * Math.sin(angle) + sy * Math.cos(angle),
          0.4,
        ),
      );
    }
    const vine = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 32, 0.022, 5, false),
      gold,
    );
    vine.castShadow = true;
    frame.add(vine);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const y = -height / 2 + 0.2 + (i * (height - 0.4)) / 10;
      leaf(side * (width / 2 + 0.06), y, side * (i % 2 ? 0.55 : -0.55));
      if (i % 2 === 0) scroll(side * (width / 2 + 0.045), y, side);
    }
    for (let i = 0; i < 9; i++) {
      const x = -width / 2 + 0.18 + (i * (width - 0.36)) / 8;
      leaf(x, side * (height / 2 + 0.055), Math.PI / 2 + (i % 2 ? 0.5 : -0.5));
      if (i % 2 === 0)
        scroll(x, side * (height / 2 + 0.045), side, Math.PI / 2);
    }
  }
  for (const x of [-width / 2, width / 2])
    for (const y of [-height / 2, height / 2]) {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        leaf(
          x + Math.cos(a) * 0.12,
          y + Math.sin(a) * 0.12,
          a + Math.PI / 2,
          0.9,
        );
      }
    }
  // Instancing keeps the carved details inexpensive on smaller screens.
  const relief = new T.InstancedMesh(
    new T.SphereGeometry(1, 8, 6),
    highlight,
    leaves.length,
  );
  leaves.forEach(({ x, y, angle, scale }, index) => {
    dummy.position.set(x, y, 0.4);
    dummy.rotation.set(0, 0, angle);
    dummy.scale.set(0.044 * scale, 0.12 * scale, 0.045);
    dummy.updateMatrix();
    relief.setMatrixAt(index, dummy.matrix);
  });
  relief.castShadow = true;
  frame.add(relief);
  scroll(-0.16, height / 2 + 0.21, 1);
  scroll(0.16, height / 2 + 0.21, -1);
  return frame;
}
