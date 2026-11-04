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
  const celestial = new T.Mesh(
    new T.SphereGeometry(2.3, 32, 24),
    new T.MeshBasicMaterial({ color: "#fff3c6", fog: false }),
  );
  celestial.name = "sun-or-moon";
  celestial.position.set(28, 29, -65);
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
  celestial.material.color.set(dark ? "#d8e3f5" : "#fff3bb");
  celestial.scale.setScalar(dark ? 0.8 : 1);
  lightning.visible = !!engine.preferences.thunder && inside < 1;
  // Slow distant glow, never a full-screen lightning flash.
  lightning.children.forEach(
    (line) =>
      (line.material.opacity = engine.preferences.motion
        ? 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0007))
        : 0.65),
  );
}
