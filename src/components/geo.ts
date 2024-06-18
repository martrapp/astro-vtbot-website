type Coords = {
	x: number;
	y: number;
};

export function drawPolygon(ctx: CanvasRenderingContext2D, points: Array<Coords>) {
	if (points.length < 2) return;
	ctx.beginPath();
	{
		const { x, y } = points[0]!;
		ctx.moveTo(x, y);
	}
	for (let i = 1; i < points.length; i++) {
		const { x, y } = points[i]!;
		ctx.lineTo(x, y);
	}

	ctx.closePath();
}

export function pointInPolygon(point: Coords, polygon: Coords[]) {
	let isInside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i]!.x, yi = polygon[i]!.y;
		const xj = polygon[j]!.x, yj = polygon[j]!.y;

		const intersect = ((yi > point.y) !== (yj > point.y)) &&
			(point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
		if (intersect) isInside = !isInside;
	}
	return isInside;
}
