// Rendering is deliberately independent of navigation and transition ownership.
export class GalleryController {
  constructor({ onChange = () => {}, duration = 1500 } = {}) {
    this.state = "introduction";
    this.activeId = null;
    this.duration = duration;
    this.onChange = onChange;
    this.timer = null;
  }
  change(state) {
    this.state = state;
    this.onChange(state, this.activeId);
  }
  select(id, motion = true, duration = this.duration) {
    clearTimeout(this.timer);
    this.activeId = id;
    this.change(motion ? "transition" : "detail");
    if (motion) this.timer = setTimeout(() => this.finish(), duration);
  }
  finish() {
    clearTimeout(this.timer);
    if (this.activeId) this.change("detail");
  }
  back() {
    clearTimeout(this.timer);
    this.activeId = null;
    this.change("gallery");
  }
  dispose() {
    clearTimeout(this.timer);
  }
}
