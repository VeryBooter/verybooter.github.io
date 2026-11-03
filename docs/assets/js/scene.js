import * as T from "three";
import { buildRoom, buildCabinet, palette, positionRobot } from "./models.js";
import { cameraPose } from "./camera.js";
import { drawingPosition } from "./exhibit-layout.js";

const ease = (t) => 1 - Math.pow(1 - t, 3);
const lerp = T.MathUtils.lerp;
export class GalleryScene {
  constructor(
    canvas,
    projects,
    { onSelect, onHover, onFailure, onFrame, onGameButton } = {},
  ) {
    this.canvas = canvas;
    this.projects = projects;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.onFailure = onFailure;
    this.onFrame = onFrame;
    this.onGameButton = onGameButton;
    this.preferences = { theme: "light", weather: "clear", motion: true };
    this.progress = 0;
    this.open = false;
    this.doorAngle = 0;
    this.active = null;
    this.visible = true;
    this.paused = false;
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, innerWidth <= 1000 ? 1.35 : 1.75),
    );
    this.renderer.shadowMap.enabled = innerWidth > 1000;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#eee9df");
    this.scene.fog = new T.Fog("#eee9df", 26, 65);
    this.camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    this.raycaster = new T.Raycaster();
    this.room = buildRoom(this.scene);
    this.collection = buildCabinet(this.scene, projects);
    this.artworkTexture = new T.TextureLoader().load(
      new URL("../images/face-drawing.png", import.meta.url).href,
      (texture) => {
        texture.colorSpace = T.SRGBColorSpace;
        const artwork =
          this.collection.exhibits.get("drawing").userData.parts.artwork;
        artwork.material.map = texture;
        artwork.material.needsUpdate = true;
      },
    );
    this.ambient = new T.HemisphereLight("#fff7e5", "#807561", 2.3);
    this.scene.add(this.ambient);
    this.sun = new T.DirectionalLight("#fff2d2", 3.2);
    this.sun.position.set(-7, 13, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -15,
      right: 15,
      top: 15,
      bottom: -15,
      near: 0.5,
      far: 45,
    });
    this.sun.shadow.bias = -0.001;
    this.scene.add(this.sun);
    this.fill = new T.DirectionalLight("#c5d7d3", 1);
    this.fill.position.set(9, 7, -1);
    this.scene.add(this.fill);
    this.clouds = new T.Group();
    this.scene.add(this.clouds);
    const cloudMat = new T.MeshBasicMaterial({
      color: "#c8c5b6",
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const cloud = new T.Mesh(new T.SphereGeometry(1, 12, 8), cloudMat);
      cloud.position.set(i * 6 - 17, 12, -8 - i);
      cloud.scale.set(4, 1, 2);
      this.clouds.add(cloud);
    }
    const rainPoints = [];
    for (let i = 0; i < 180; i++) {
      const x = (Math.sin(i * 73.7) * 0.5 + 0.5) * 35 - 17;
      const y = (i / 180) * 18;
      const z = (Math.cos(i * 44.3) * 0.5 + 0.5) * 18 - 7;
      rainPoints.push(x, y, z, x - 0.06, y - 0.3, z);
    }
    const rainGeometry = new T.BufferGeometry();
    rainGeometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(rainPoints, 3),
    );
    this.rain = new T.LineSegments(
      rainGeometry,
      new T.LineBasicMaterial({
        color: "#647c7c",
        transparent: true,
        opacity: 0.22,
      }),
    );
    this.scene.add(this.rain);
    this.particles = new T.InstancedMesh(
      new T.BoxGeometry(0.11, 0.11, 0.11),
      palette.brass,
      40,
    );
    this.particles.visible = false;
    this.scene.add(this.particles);
    this.dummy = new T.Object3D();
    this.smoke = new T.InstancedMesh(
      new T.SphereGeometry(0.3, 10, 6),
      new T.MeshBasicMaterial({
        color: "#e9e0cc",
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      24,
    );
    this.smoke.visible = false;
    this.scene.add(this.smoke);
    this.resize = () => {
      this.mobile = innerWidth <= 1000;
      this.renderer.setPixelRatio(
        Math.min(devicePixelRatio, this.mobile ? 1.35 : 1.75),
      );
      this.renderer.shadowMap.enabled = !this.mobile;
      this.renderer.setSize(innerWidth, innerHeight, false);
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.fov = this.mobile ? 42 : 38;
      this.camera.updateProjectionMatrix();
      const drawing = this.collection.exhibits.get("drawing");
      drawing.position.set(...drawingPosition(this.mobile));
      drawing.userData.basePosition.copy(drawing.position);
      const lamp = this.collection.exhibits.get("lamp");
      lamp.position.x = this.mobile ? -3.9 : -4.5;
      lamp.userData.basePosition.copy(lamp.position);
    };
    this.resize();
    window.addEventListener("resize", this.resize);
    this.contextLost = (e) => {
      e.preventDefault();
      this.pause();
      onFailure?.(
        "The 3D view was interrupted. Every exhibit is still available in the index.",
      );
    };
    canvas.addEventListener("webglcontextlost", this.contextLost);
    this.handleMove = (e) => {
      if (!this.visible || this.active) return;
      const id = this.pick(e);
      canvas.style.cursor = id ? "pointer" : "default";
      onHover?.(id);
    };
    this.pointerDown = (e) => {
      this.pointerStart = { x: e.clientX, y: e.clientY };
    };
    this.handleClick = (e) => {
      if (this.active?.id === "games" && this.pointerStart) {
        const button = this.pickGameButton(e);
        if (button !== null) this.onGameButton?.(button);
        return;
      }
      if (this.active || !this.pointerStart) return;
      if (
        Math.hypot(
          e.clientX - this.pointerStart.x,
          e.clientY - this.pointerStart.y,
        ) > 12
      )
        return;
      const id = this.pick(e);
      if (id) onSelect?.(id);
    };
    this.leave = () => onHover?.(null);
    canvas.addEventListener("pointermove", this.handleMove);
    canvas.addEventListener("pointerdown", this.pointerDown);
    canvas.addEventListener("pointerup", this.handleClick);
    canvas.addEventListener("pointerleave", this.leave);
    this.frameTimes = [];
    this.look = new T.Vector3();
    this.last = performance.now();
    this.tick = this.tick.bind(this);
    this.resume();
  }
  setPreferences(preferences) {
    this.preferences = { ...preferences };
    const dark = preferences.theme === "dark";
    const weather = preferences.weather;
    this.scene.background.set(dark ? "#202822" : "#eee9df");
    this.scene.fog.color.copy(this.scene.background);
    this.ambient.intensity = dark ? 0.85 : weather === "clear" ? 2.3 : 1.65;
    this.sun.intensity = dark ? 0.55 : weather === "clear" ? 3.2 : 1.6;
    this.fill.intensity = dark ? 0.5 : 1;
    this.clouds.visible = weather !== "clear";
    this.rain.visible = weather === "storm";
  }
  setProgress(value) {
    this.progress = T.MathUtils.clamp(value, 0, 1);
  }
  setDoors(open) {
    this.open = open;
  }
  pick(event) {
    if (this.progress < 0.25 || !this.open) return null;
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new T.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    const hits = this.raycaster.intersectObjects(
      [...this.collection.exhibits.values()],
      true,
    );
    return hits[0]?.object.userData.projectId || null;
  }
  select(id, motion = true) {
    this.reset();
    this.open = true;
    this.active = { id, start: performance.now(), motion };
    this.collection.cabinet.visible = true;
    this.onHover?.(null);
  }
  reset() {
    const { exhibits, shoulder, elbow, beam, arm, grip, upper, lower, pad } =
      this.collection;
    for (const object of exhibits.values()) {
      object.visible = true;
      object.position.copy(object.userData.basePosition);
      object.rotation.copy(object.userData.baseRotation);
      object.scale.copy(object.userData.baseScale);
      const parts = object.userData.parts;
      if (parts.flame) parts.flame.visible = false;
      if (parts.light) parts.light.intensity = 0;
      if (parts.neck) parts.neck.rotation.z = 0;
      if (parts.ingredient) parts.ingredient.position.y = 0.65;
      if (parts.arrow) {
        parts.arrow.position.set(0, 0.6, 0.3);
        parts.arrow.rotation.set(0, 0, 0);
      }
      if (parts.satellite) {
        parts.satellite.position.set(0.75, 0.95, 0);
        parts.satellite.scale.setScalar(1);
      }
      if (parts.lines)
        parts.lines.traverse((child) => {
          if (child.isMesh) child.geometry.setDrawRange(0, Infinity);
        });
      if (parts.house) {
        parts.house.visible = false;
        parts.blueprint.visible = true;
        parts.chip.visible = false;
      }
      parts.buttons?.forEach((button) => {
        button.position.z = button.userData.restZ;
        button.scale.setScalar(1);
      });
    }
    arm.rotation.y = 0;
    shoulder.rotation.z = 0.4;
    elbow.rotation.z = -1;
    grip.rotation.set(0, 0, 0);
    upper.scale.y = 1;
    upper.position.y = 0.6;
    elbow.position.set(0, 1.2, 0);
    lower.scale.y = 1;
    lower.position.y = 0.525;
    grip.position.set(0, 1.05, 0);
    pad.visible = false;
    this.collection.thumbsUp.visible = false;
    beam.visible = false;
    this.particles.visible = false;
    this.smoke.visible = false;
    this.active = null;
    this.onFrame?.({ effect: null, strength: 0 });
  }
  presentationTarget(distance = 9) {
    if (!this.camera) return new T.Vector3(-0.5, 3.5, 3);
    this.camera.updateWorldMatrix(true, false);
    const target = this.camera.position
      .clone()
      .addScaledVector(
        this.camera.getWorldDirection(new T.Vector3()),
        distance,
      );
    return this.collection.cabinet.worldToLocal(target);
  }
  showHousePhase(phase) {
    if (this.active?.id === "house") {
      this.active.phase = phase;
      this.active.start = performance.now();
    }
  }
  pressGameButton(index) {
    if (this.active?.id === "games")
      this.active.pressed = { index, time: performance.now() };
  }
  pickGameButton(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new T.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    return (
      this.raycaster.intersectObjects(
        this.collection.exhibits.get("games").userData.parts.buttons,
      )[0]?.object.userData.buttonIndex ?? null
    );
  }
  animate(now) {
    if (!this.active) return;
    const { id, start, motion } = this.active,
      item = this.collection.exhibits.get(id);
    if (!item) return;
    const p = motion ? T.MathUtils.clamp((now - start) / 1500, 0, 1) : 1,
      a = ease(Math.min(1, p * 1.7));
    const parts = item.userData.parts,
      base = item.userData.basePosition,
      target = this.presentationTarget();
    item.position.copy(base);
    item.rotation.copy(item.userData.baseRotation);
    item.scale.copy(item.userData.baseScale);
    const present = (scale = 2) => {
      item.position.lerpVectors(base, target, a);
      item.scale.multiplyScalar(1 + a * (scale - 1));
      if (this.camera) item.lookAt(this.camera.position);
      // Models are authored from their bases; center the visible artwork, not its origin.
      item.updateWorldMatrix(true, true);
      const centre = this.collection.cabinet.worldToLocal(
        new T.Box3().setFromObject(item).getCenter(new T.Vector3()),
      );
      item.position.add(target.clone().sub(centre).multiplyScalar(a));
    };
    switch (id) {
      case "sailbot":
        present(4);
        item.position.x += Math.sin(p * Math.PI) * 3;
        item.rotation.z += Math.sin(p * Math.PI * 3) * 0.08;
        this.onFrame?.({
          effect: "sail",
          strength: Math.sin((Math.max(0, p - 0.35) / 0.65) * Math.PI),
        });
        break;
      case "rocket": {
        const pad = new T.Vector3(3.4, 0.4, 2.8);
        this.collection.pad.visible = true;
        const carry = T.MathUtils.smoothstep(p, 0.28, 0.6),
          handTarget = base.clone().lerp(pad, carry);
        positionRobot(this.collection, handTarget);
        if (p > 0.28) item.position.copy(handTarget);
        if (p > 0.6) {
          item.position.y += Math.pow((p - 0.6) / 0.4, 2) * 11;
          parts.flame.visible = true;
        }
        this.animateSmoke(p);
        this.onFrame?.({
          effect: "exhaust",
          strength: T.MathUtils.smoothstep(p, 0.6, 0.95) * 0.86,
        });
        break;
      }
      case "house": {
        const chip = this.active.phase === "chip";
        const carry = T.MathUtils.smoothstep(p, 0.2, 0.8),
          destination = target.clone().add(new T.Vector3(0, -0.6, 0));
        const hand = base.clone().lerp(destination, carry);
        positionRobot(this.collection, hand);
        item.position.copy(hand);
        item.scale.multiplyScalar(1 + carry * 1.1);
        parts.blueprint.visible = !chip && p < 0.65;
        parts.house.visible = !chip && p >= 0.55;
        parts.chip.visible = chip;
        parts.scan.position.y = 0.5 - p;
        if (chip) {
          item.rotation.x = 0.65;
          item.rotation.y = 0.2;
        } else if (this.camera) item.lookAt(this.camera.position);
        break;
      }
      case "drone":
        present(3);
        parts.propellers.forEach((prop) => {
          prop.rotation.y = p * 100;
        });
        item.position.y += Math.sin(p * Math.PI) * 0.3;
        break;
      case "cooking":
        present(3);
        positionRobot(
          this.collection,
          item.position.clone().add(new T.Vector3(0.5, 0.35, 0)),
        );
        item.rotation.x += Math.sin(p * Math.PI * 2) * 0.1;
        parts.ingredient.position.y = 0.65 + Math.sin(p * Math.PI) * 0.5;
        this.collection.grip.rotation.z = p > 0.65 ? -0.7 : 0;
        this.collection.thumbsUp.visible = p > 0.65;
        break;
      case "voxelcraft":
        item.scale.multiplyScalar(
          1 + Math.sin(p * Math.PI * 5) * 0.1 * (1 - p),
        );
        item.visible = p < 0.48 || p >= 1;
        this.animateParticles(item, p);
        break;
      case "hackathon": {
        const direction = this.camera
          ? item
              .worldToLocal(this.camera.position.clone())
              .sub(new T.Vector3(0, 0.6, 0.3))
              .normalize()
          : new T.Vector3(1, 0, 0);
        parts.arrow.position
          .set(0, 0.6, 0.3)
          .addScaledVector(direction, p * p * 12);
        parts.arrow.quaternion.setFromUnitVectors(
          new T.Vector3(1, 0, 0),
          direction,
        );
        this.onFrame?.({
          effect: "arrow",
          strength: Math.sin(Math.max(0, p - 0.5) * Math.PI * 2),
        });
        break;
      }
      case "photography":
        item.rotation.y = Math.sin(p * Math.PI) * 0.2;
        this.onFrame?.({ effect: "aperture", strength: Math.sin(p * Math.PI) });
        break;
      case "lamp":
        parts.neck.rotation.z = -Math.sin(p * Math.PI) * 0.4;
        parts.light.intensity = Math.sin(p * Math.PI) * 9;
        this.collection.beam.visible = p > 0.2;
        break;
      case "satellite": {
        const orbit = new T.Vector3(
          Math.cos(p * Math.PI * 3) * 0.9,
          0.7 + Math.sin(p * Math.PI * 3) * 0.6,
          Math.sin(p * Math.PI * 3) * 0.5,
        );
        const destination = item.worldToLocal(
          this.collection.cabinet.localToWorld(target.clone()),
        );
        parts.satellite.position
          .copy(orbit)
          .lerp(destination, T.MathUtils.smoothstep(p, 0.55, 1));
        parts.satellite.scale.setScalar(
          1 + T.MathUtils.smoothstep(p, 0.55, 1) * 4,
        );
        break;
      }
      case "drawing":
        present(2.2);
        parts.lines.traverse((child) => {
          if (child.isMesh)
            child.geometry.setDrawRange(
              0,
              Math.floor((child.geometry.index.count * a) / 3) * 3,
            );
        });
        break;
      case "games":
        present(3);
        if (this.active.pressed) {
          const b = parts.buttons[this.active.pressed.index],
            press = Math.max(0, 1 - (now - this.active.pressed.time) / 280);
          b.position.z = b.userData.restZ - press * 0.08;
        }
        break;
    }
  }
  animateParticles(item, p) {
    this.particles.visible = p > 0.3 && p < 0.95;
    const center = item.getWorldPosition(new T.Vector3());
    const t = Math.max(0, (p - 0.3) * 2);
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4;
      this.dummy.position.set(
        center.x + Math.cos(a) * t * (1 + (i % 3)),
        center.y + Math.sin(a) * t * 2 - t * t,
        center.z + Math.sin(i * 7) * t * 2,
      );
      this.dummy.rotation.set(p * i, p * 4, 0);
      this.dummy.scale.setScalar(1 - t * 0.5);
      this.dummy.updateMatrix();
      this.particles.setMatrixAt(i, this.dummy.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
  }
  animateSmoke(p) {
    this.smoke.visible = p > 0.3;
    for (let i = 0; i < 24; i++) {
      const a = i * 2.4,
        t = Math.max(0, p - 0.3);
      this.dummy.position.set(
        -2.2 + Math.cos(a) * t * 5,
        2 + t * (i % 5),
        Math.sin(a) * t * 4 + 1,
      );
      this.dummy.scale.setScalar(t * (1 + (i % 4)) * 2);
      this.dummy.updateMatrix();
      this.smoke.setMatrixAt(i, this.dummy.matrix);
    }
    this.smoke.instanceMatrix.needsUpdate = true;
  }
  tick(now) {
    if (this.paused) return;
    const elapsed = now - this.last;
    const delta = Math.min(elapsed / 1000, 0.05);
    this.last = now;
    if (elapsed > 0) {
      this.frameTimes.push(elapsed);
      if (this.frameTimes.length > 180) this.frameTimes.shift();
    }
    const mobile = this.mobile;
    const pose = cameraPose(this.progress, mobile, this.preferences.motion);
    this.camera.position.set(...pose.position);
    this.look.set(...pose.target);
    this.camera.lookAt(this.look);
    this.collection.cabinet.visible = this.progress > 0.08 || !!this.active;
    this.room.userData.portrait.visible = this.progress < 0.35;
    const target = this.open ? 1 : 0;
    this.doorAngle = this.preferences.motion
      ? lerp(this.doorAngle, target, Math.min(1, delta * 4))
      : target;
    this.collection.doors.forEach(({ hinge, sign }) => {
      hinge.rotation.y = sign * this.doorAngle * 1.75;
    });
    if (this.preferences.motion) {
      this.clouds.position.x = Math.sin(now * 0.000035) * 2;
      this.rain.position.y = -(now * 0.003) % 3;
    }
    this.animate(now);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  }
  pause() {
    this.paused = true;
    cancelAnimationFrame(this.raf);
  }
  resume() {
    if (this.raf && !this.paused) return;
    this.paused = false;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  dispose() {
    this.pause();
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.canvas.removeEventListener("pointermove", this.handleMove);
    this.canvas.removeEventListener("pointerdown", this.pointerDown);
    this.canvas.removeEventListener("pointerup", this.handleClick);
    this.canvas.removeEventListener("pointerleave", this.leave);
    this.renderer.dispose();
  }
}
