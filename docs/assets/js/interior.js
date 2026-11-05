import * as T from "three";
// A shallow convex mirror gives a wide room view rather than just the cabinet's top.
export function buildInteriorFeatures(scene) {
  const frame = new T.Group();
  frame.position.set(3.3, 6.9, -31.5);
  frame.rotation.x = 0.08;
  scene.add(frame);
  const target = new T.WebGLCubeRenderTarget(256);
  const captureCamera = new T.CubeCamera(0.1, 90, target);
  captureCamera.position.copy(frame.position);
  scene.add(captureCamera);
  const mirror = new T.Mesh(
    new T.SphereGeometry(1, 48, 24),
    new T.MeshBasicMaterial({
      color: 0xf0f4f2,
      envMap: target.texture,
      reflectivity: 1,
      combine: T.MixOperation,
    }),
  );
  mirror.scale.set(2.4, 1.4, 0.7);
  mirror.name = "gallery-wall-mirror";
  frame.add(mirror);
  const brass = new T.MeshStandardMaterial({
    color: 0xb78d47,
    metalness: 0.72,
    roughness: 0.25,
  });
  const points = Array.from(
    { length: 65 },
    (_, i) =>
      new T.Vector3(
        Math.cos((i / 64) * Math.PI * 2) * 2.49,
        Math.sin((i / 64) * Math.PI * 2) * 1.49,
        0,
      ),
  );
  frame.add(
    new T.Mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points, true),
        96,
        0.065,
        8,
        true,
      ),
      brass,
    ),
  );
  let lastCapture = -Infinity;
  mirror.userData.frame = frame;
  mirror.userData.capture = (renderer, now) => {
    if (!frame.visible || now - lastCapture < 1000) return;
    const shadows = renderer.shadowMap.autoUpdate;
    frame.visible = false;
    renderer.shadowMap.autoUpdate = false;
    captureCamera.position.copy(frame.position);
    captureCamera.update(renderer, scene);
    renderer.shadowMap.autoUpdate = shadows;
    frame.visible = true;
    lastCapture = now;
  };
  return mirror;
}

export function buildProjector(scene) {
  const root = new T.Group();
  root.name = "folded-optics-projector";
  scene.add(root);
  const metal = new T.MeshStandardMaterial({
    color: 0x343c40,
    metalness: 0.65,
    roughness: 0.28,
  });
  const silver = new T.MeshStandardMaterial({
    color: 0xb6cbd0,
    metalness: 0.92,
    roughness: 0.09,
  });
  const glass = new T.MeshBasicMaterial({ color: 0xc2e8ff });
  const add = (geo, mat, p) => {
    const m = new T.Mesh(geo, mat);
    m.position.copy(p);
    root.add(m);
    return m;
  };
  const source = new T.Vector3(5.9, 8.45, -24.8);
  add(
    new T.BoxGeometry(1.35, 0.6, 0.95),
    metal,
    source.clone().add(new T.Vector3(0, 0, 0.5)),
  );
  add(
    new T.CylinderGeometry(0.05, 0.05, 0.6, 12),
    metal,
    source.clone().add(new T.Vector3(0, 0.65, 0.4)),
  );
  for (let i = 0; i < 6; i++)
    add(
      new T.BoxGeometry(0.08, 0.27, 0.02),
      silver,
      source.clone().add(new T.Vector3(-0.48 + i * 0.15, 0, 1)),
    );
  const lens = add(new T.CylinderGeometry(0.22, 0.26, 0.3, 32), silver, source);
  lens.rotation.x = Math.PI / 2;
  add(
    new T.CircleGeometry(0.19, 32),
    glass,
    source.clone().add(new T.Vector3(0, 0, -0.16)),
  ).rotation.y = Math.PI;
  const points = [
    source.clone().add(new T.Vector3(0, 0, -0.17)),
    new T.Vector3(5.9, 9.0, -28.5),
    new T.Vector3(8.4, 9.0, -28.5),
    new T.Vector3(8.4, 1.4, -32.55),
  ];
  const mounts = [];
  for (let i = 1; i < points.length - 1; i++) {
    const incoming = points[i]
      .clone()
      .sub(points[i - 1])
      .normalize();
    const outgoing = points[i + 1].clone().sub(points[i]).normalize();
    const normal = incoming.sub(outgoing).normalize();
    const mount = add(new T.BoxGeometry(0.7, 0.7, 0.12), metal, points[i]);
    mounts.push(mount);
    mount.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), normal);
    for (const x of [-0.14, 0.14])
      for (const y of [-0.14, 0.14]) {
        const facet = new T.Mesh(new T.PlaneGeometry(0.25, 0.25), silver);
        facet.position.set(x, y, 0.068);
        mount.add(facet);
      }
    for (const x of [-0.29, 0.29])
      for (const y of [-0.29, 0.29]) {
        const screw = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), silver);
        screw.position.set(x, y, 0.09);
        mount.add(screw);
      }
  }
  const lightMaterial = new T.MeshBasicMaterial({
    color: 0xc9e8ff,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.AdditiveBlending,
  });
  const beams = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1],
      delta = b.clone().sub(a);
    const beam = add(
      new T.CylinderGeometry(i === 2 ? 1.2 : 0.14, 0.12, 1, 24, 1, true),
      lightMaterial,
      a.clone().add(b).multiplyScalar(0.5),
    );
    beams.push(beam);
    beam.scale.y = delta.length();
    beam.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      delta.clone().normalize(),
    );
    beam.name = `projector-light-segment-${i}`;
  }
  root.userData.aim = (screen, compact) => {
    root.position.x = compact ? -14.5 : 0;
    points[3].copy(screen).sub(root.position);
    beams.forEach((beam, i) => {
      const delta = points[i + 1].clone().sub(points[i]);
      beam.position
        .copy(points[i])
        .add(points[i + 1])
        .multiplyScalar(0.5);
      beam.scale.y = delta.length();
      beam.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      );
    });
    mounts.forEach((mount, i) => {
      const j = i + 1;
      const incoming = points[j]
        .clone()
        .sub(points[j - 1])
        .normalize();
      const outgoing = points[j + 1].clone().sub(points[j]).normalize();
      mount.quaternion.setFromUnitVectors(
        new T.Vector3(0, 0, 1),
        incoming.sub(outgoing).normalize(),
      );
    });
    root.userData.path = points.map((p) =>
      p.clone().add(root.position).toArray(),
    );
  };
  root.userData.aim(points[3].clone(), false);
  return root;
}
