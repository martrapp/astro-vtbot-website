import { map } from "nanostores";

export type Coords = { x: number; y: number; };

export const $coords = map<Coords>({ x: 0, y: 0 });

document.addEventListener("mousemove", (e) => {
	$coords.setKey("x", e.clientX);
	$coords.setKey("y", e.clientY);
});
