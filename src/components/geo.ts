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

export function applyTransform(x, y, matrix, originX, originY, bbox) {
	const ox = bbox.left + originX * bbox.width;
	const oy = bbox.top + originY * bbox.height;

	// Translate point to origin
	const tx = x - ox;
	const ty = y - oy;

	// Apply transform matrix
	const transformed = {
			x: matrix[0][0] * tx + matrix[0][1] * ty + matrix[0][3],
			y: matrix[1][0] * tx + matrix[1][1] * ty + matrix[1][3]
	};

	// Translate back from origin
	transformed.x += ox;
	transformed.y += oy;

	return transformed;
}