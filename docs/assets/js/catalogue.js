// This is the single editable source for the collection. Add verified links here.
export const projects = [
  [
    "sailbot",
    "SailBot",
    "Autonomous sailing",
    "Engineering",
    "A small vessel. A much bigger question.",
    "Tell the story of your sailing work: your role, the systems you explored, and what happened on the water.",
    "sail",
  ],
  [
    "rocket",
    "SOAR / Rocket",
    "Looking upward",
    "Engineering",
    "An idea with a little more altitude.",
    "Add your involvement in SOAR, the rocket systems you worked on, and what you learned along the way.",
    "launch",
  ],
  [
    "house",
    "Home Design",
    "Spaces for living",
    "Design",
    "Making room for an idea.",
    "Introduce your home design project or competition. Add the original brief, drawings, and your design decisions.",
    "lift",
  ],
  [
    "drone",
    "Samsara Drone",
    "Flight, in miniature",
    "Engineering",
    "A different perspective on the everyday.",
    "Describe this drone project, its purpose, and your contribution. Replace this text with verified project details.",
    "fly",
  ],
  [
    "cooking",
    "Cooking",
    "Experiments at the stove",
    "Life",
    "Some experiments are best shared over dinner.",
    "Share a favorite recipe, a cooking experiment, or the story behind something you like to make.",
    "toss",
  ],
  [
    "voxelcraft",
    "VoxelCraft",
    "A world, one block at a time",
    "Software",
    "Build a place where the rules are yours.",
    "Introduce your Minecraft-inspired personal project. Describe the world, the rendering, or the mechanics you built.",
    "burst",
  ],
  [
    "hackathon",
    "Merry-Men",
    "A sprint of ideas",
    "Software",
    "A curious cat and a question worth chasing.",
    "Add the official project name, event, collaborators, and your contribution. Any award details should be verified before publication.",
    "arrow",
  ],
  [
    "photography",
    "Photography",
    "The art of noticing",
    "Life",
    "A collection of moments worth keeping.",
    "Add your photographs and the stories behind them. This camera is a place for your way of seeing.",
    "aperture",
  ],
  [
    "lamp",
    "The Desk Lamp",
    "A familiar pool of light",
    "Life",
    "A small object with a place in the story.",
    "Use this exhibit for your workspace, a favorite object, or a design observation. Make the meaning your own.",
    "light",
  ],
  [
    "satellite",
    "Satellite / GNSS",
    "Finding a place in the world",
    "Engineering",
    "An orbit, a signal, a position.",
    "Describe your work or interests in satellite navigation, GNSS, and RTK. Add the actual hardware and results when ready.",
    "orbit",
  ],
  [
    "drawing",
    "Face Drawing",
    "Thinking in lines",
    "Design",
    "A face, reduced to a few deliberate marks.",
    "Replace this illustrative line portrait with your drawings and describe what you enjoy about making them.",
    "draw",
  ],
  [
    "games",
    "Game Development Club",
    "Making worlds together",
    "Software",
    "A place to turn play into something you make.",
    "Add the club’s confirmed name, your role, and the games you have made together.",
    "pixels",
  ],
].map(
  (
    [id, title, subtitle, category, summary, description, animation],
    index,
  ) => ({
    id,
    title,
    subtitle,
    category,
    summary,
    description,
    animation,
    number: String(index + 1).padStart(2, "0"),
    placeholder: true,
    links: [],
    presentation: ["photography", "lamp"].includes(id)
      ? "effect"
      : id === "drawing"
        ? "display"
        : ["house", "games"].includes(id)
          ? "interactive"
          : "story",
  }),
);

export const getProject = (id) => projects.find((project) => project.id === id);
export function projectFromHash(hash) {
  const match = /^#project\/([a-z0-9-]+)$/.exec(hash);
  return match ? getProject(match[1]) : undefined;
}
