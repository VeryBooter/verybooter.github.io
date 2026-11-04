export function safeRead(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
export function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    /* Preferences still work in memory. */
  }
}
export function readPreferences(storage, reduced = false) {
  const theme = safeRead(storage, "gallery.theme");
  const weather = safeRead(storage, "gallery.weather");
  const motion = safeRead(storage, "gallery.motion");
  return {
    theme: ["light", "dark"].includes(theme) ? theme : "light",
    weather: ["clear", "cloudy", "storm"].includes(weather) ? weather : "clear",
    clouds:
      safeRead(storage, "gallery.clouds") === null
        ? ["cloudy", "storm"].includes(weather)
        : safeRead(storage, "gallery.clouds") === "on",
    rain:
      safeRead(storage, "gallery.rain") === null
        ? weather === "storm"
        : safeRead(storage, "gallery.rain") === "on",
    thunder: safeRead(storage, "gallery.thunder") === "on",
    motion: motion === null ? !reduced : motion !== "off",
  };
}
