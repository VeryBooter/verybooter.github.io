import * as T from "three";
import { Sky } from "three/addons/objects/Sky.js";

export function buildDaylight(scene, sun) {
  const sky = new Sky();
  sky.name = "outdoor-atmosphere";
  sky.scale.setScalar(1000);
  sky.material.depthWrite = false;
  const uniforms = sky.material.uniforms;
  uniforms.turbidity.value = 3;
  uniforms.rayleigh.value = 1.2;
  uniforms.mieCoefficient.value = 0.004;
  uniforms.mieDirectionalG.value = 0.8;
  sun.position.set(-32, 22, 38);
  sun.target.position.set(0, 0, -8);
  scene.add(sun.target);
  uniforms.sunPosition.value
    .copy(sun.position)
    .sub(sun.target.position)
    .normalize();
  Object.assign(sun.shadow.camera, {
    left: -24,
    right: 24,
    top: 22,
    bottom: -22,
    near: 1,
    far: 130,
  });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00008;
  sun.shadow.radius = 3;
  sun.shadow.camera.updateProjectionMatrix();
  // Distinct ornamental silhouettes remain in the sky: a radiant sun and a true crescent.
  const celestial = new T.Group();
  celestial.name = "sun-or-moon";
  celestial.position.set(28, 29, -65);
  const sunMark = new T.Group();
  sunMark.name = "radiant-sun";
  const gold = new T.MeshBasicMaterial({ color: "#ffdc8c", fog: false });
  sunMark.add(new T.Mesh(new T.CircleGeometry(1.45, 64), gold));
  sunMark.add(new T.Mesh(new T.TorusGeometry(1.7, 0.055, 8, 64), gold));
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const ray = new T.Mesh(
      new T.ConeGeometry(0.15, i % 2 ? 0.55 : 0.85, 4),
      gold,
    );
    ray.position.set(Math.sin(a) * 2.12, Math.cos(a) * 2.12, 0);
    ray.rotation.z = -a;
    sunMark.add(ray);
  }
  const moonMark = new T.Group();
  moonMark.name = "crescent-moon";
  const shape = new T.Shape();
  shape.moveTo(0.65, 2.1);
  shape.bezierCurveTo(-2.7, 2.1, -2.7, -2.1, 0.65, -2.1);
  shape.bezierCurveTo(-0.9, -1.15, -0.9, 1.15, 0.65, 2.1);
  const silver = new T.MeshBasicMaterial({
    color: "#e1ebff",
    fog: false,
    side: T.DoubleSide,
  });
  moonMark.add(
    new T.Mesh(
      new T.ExtrudeGeometry(shape, {
        depth: 0.12,
        bevelEnabled: false,
        curveSegments: 48,
      }),
      silver,
    ),
  );
  for (const [x, y, r] of [
    [1.2, 0.9, 0.15],
    [1.8, -0.4, 0.09],
  ]) {
    const star = new T.Mesh(new T.OctahedronGeometry(r), silver);
    star.position.set(x, y, 0);
    moonMark.add(star);
  }
  celestial.add(sunMark, moonMark);
  celestial.userData.sunMark = sunMark;
  celestial.userData.moonMark = moonMark;
  scene.add(celestial);
  sky.userData.celestial = celestial;
  const lightning = new T.Group();
  lightning.name = "distant-lightning";
  const material = new T.LineBasicMaterial({
    color: "#dae5ff",
    transparent: true,
    opacity: 0.8,
    fog: false,
  });
  for (const points of [
    [
      [-22, 26, -49],
      [-24, 23, -49],
      [-21, 23, -49],
      [-25, 18, -49],
      [-24, 16, -49],
    ],
    [
      [-23, 22, -49],
      [-27, 21, -49],
      [-28, 19, -49],
    ],
  ]) {
    lightning.add(
      new T.Line(
        new T.BufferGeometry().setFromPoints(
          points.map((p) => new T.Vector3(...p)),
        ),
        material,
      ),
    );
  }
  scene.add(lightning);
  sky.userData.lightning = lightning;
  scene.add(sky);
  return sky;
}

export function updateDaylight(engine) {
  const { theme, weather } = engine.preferences;
  const inside = T.MathUtils.smoothstep(engine.entryProgress, 0.55, 0.95);
  const dark = theme === "dark",
    clear = !engine.preferences.clouds;
  engine.sky.visible = !dark && engine.entryProgress < 0.95;
  engine.sky.material.uniforms.turbidity.value = clear ? 3 : 8;
  engine.ambient.color.set("#d8e9ff");
  engine.ambient.groundColor.set("#8d795c");
  engine.ambient.intensity = T.MathUtils.lerp(
    dark ? 0.5 : clear ? 0.85 : 1.15,
    dark ? 0.85 : clear ? 2.3 : 1.65,
    inside,
  );
  engine.sun.color.set(dark ? "#b9d0e4" : "#fff1d5");
  engine.sun.intensity = T.MathUtils.lerp(
    dark ? 0.15 : clear ? 4.3 : 1.2,
    dark ? 0.55 : clear ? 3.2 : 1.6,
    inside,
  );
  engine.fill.intensity = T.MathUtils.lerp(
    dark ? 0.15 : 0.3,
    dark ? 0.5 : 1,
    inside,
  );
  engine.renderer.toneMappingExposure = T.MathUtils.lerp(
    dark ? 1.05 : 0.95,
    1.25,
    inside,
  );
  engine.scene.fog.near = T.MathUtils.lerp(65, 26, inside);
  engine.scene.fog.far = T.MathUtils.lerp(180, 65, inside);
  engine.clouds.visible = !!engine.preferences.clouds && inside < 1;
  engine.rain.visible = !!engine.preferences.rain && inside < 1;
  const { celestial, lightning } = engine.sky.userData;
  celestial.visible = inside < 1;
  celestial.userData.sunMark.visible = !dark;
  celestial.userData.moonMark.visible = dark;
  celestial.lookAt(engine.camera.position);
  lightning.visible = !!engine.preferences.thunder && inside < 1;
  // Slow distant glow, never a full-screen lightning flash.
  lightning.children.forEach(
    (line) =>
      (line.material.opacity = engine.preferences.motion
        ? 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0007))
        : 0.65),
  );
}
