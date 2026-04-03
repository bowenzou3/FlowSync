/**
 * Renderer
 * Draws the simulation world onto canvas.
 */

class Renderer {
	constructor(canvas, config) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.config = config;
		this.road = new Road(config);
		this.resize();
	}

	resize() {
		const dpr = window.devicePixelRatio || 1;
		const rect = this.canvas.getBoundingClientRect();
		const width = Math.max(640, Math.floor(rect.width || this.config.canvas.width));
		const height = Math.max(420, Math.floor(rect.height || this.config.canvas.height));

		this.canvas.width = Math.floor(width * dpr);
		this.canvas.height = Math.floor(height * dpr);
		this.canvas.style.width = `${width}px`;
		this.canvas.style.height = `${height}px`;

		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.config.canvas.width = width;
		this.config.canvas.height = height;
		this.config.intersection.centerX = width / 2;
		this.config.intersection.centerY = height / 2;
	}

	render(intersection, visualOptions) {
		const queue = intersection.getQueueLengths();
		this.road.draw(this.ctx, visualOptions.showHeatmap, queue);

		intersection.vehicles.forEach((vehicle) => vehicle.draw(this.ctx));
		Object.values(intersection.trafficLights).forEach((light) => light.draw(this.ctx, visualOptions.showSensors));

		if (visualOptions.showQueue) {
			this.drawQueueLabels(queue);
		}
	}

	drawQueueLabels(queue) {
		const c = this.config.intersection;
		const ctx = this.ctx;

		ctx.save();
		ctx.font = '600 13px Inter, sans-serif';
		ctx.fillStyle = '#f8fafc';
		ctx.textAlign = 'center';
		ctx.fillText(`N:${queue.north}`, c.centerX + 48, c.centerY + 128);
		ctx.fillText(`S:${queue.south}`, c.centerX - 48, c.centerY - 118);
		ctx.fillText(`E:${queue.east}`, c.centerX - 122, c.centerY + 47);
		ctx.fillText(`W:${queue.west}`, c.centerX + 122, c.centerY - 47);
		ctx.restore();
	}
}
