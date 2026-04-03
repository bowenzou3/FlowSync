/**
 * Road Class
 * Renders road infrastructure and overlays.
 */

class Road {
    constructor(config) {
        this.config = config;
    }

    draw(ctx, showHeatmap = false, queueLengths = null) {
        const canvas = this.config.canvas;
        const center = this.config.intersection;

        ctx.fillStyle = this.config.canvas.grassColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = this.config.canvas.roadColor;
        ctx.fillRect(center.centerX - center.roadWidth / 2, 0, center.roadWidth, canvas.height);
        ctx.fillRect(0, center.centerY - center.roadWidth / 2, canvas.width, center.roadWidth);

        if (showHeatmap && queueLengths) {
            this.drawHeatmap(ctx, queueLengths);
        }

        this.drawIntersection(ctx);
        this.drawLaneMarkings(ctx);
        this.drawCrosswalks(ctx);
        this.drawStopLines(ctx);
    }

    drawIntersection(ctx) {
        const center = this.config.intersection;
        ctx.fillStyle = '#353555';
        ctx.fillRect(
            center.centerX - center.roadWidth / 2,
            center.centerY - center.roadWidth / 2,
            center.roadWidth,
            center.roadWidth
        );
    }

    drawLaneMarkings(ctx) {
        const center = this.config.intersection;
        const canvas = this.config.canvas;

        ctx.strokeStyle = this.config.canvas.laneMarkingColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([18, 14]);

        ctx.beginPath();
        ctx.moveTo(center.centerX, 0);
        ctx.lineTo(center.centerX, center.centerY - center.roadWidth / 2);
        ctx.moveTo(center.centerX, center.centerY + center.roadWidth / 2);
        ctx.lineTo(center.centerX, canvas.height);

        ctx.moveTo(0, center.centerY);
        ctx.lineTo(center.centerX - center.roadWidth / 2, center.centerY);
        ctx.moveTo(center.centerX + center.roadWidth / 2, center.centerY);
        ctx.lineTo(canvas.width, center.centerY);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    drawCrosswalks(ctx) {
        const center = this.config.intersection;
        const w = center.crosswalkWidth;
        const o = center.roadWidth / 2 + 5;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';

        ctx.fillRect(center.centerX - center.roadWidth / 2, center.centerY - o - w, center.roadWidth, w);
        ctx.fillRect(center.centerX - center.roadWidth / 2, center.centerY + o, center.roadWidth, w);
        ctx.fillRect(center.centerX - o - w, center.centerY - center.roadWidth / 2, w, center.roadWidth);
        ctx.fillRect(center.centerX + o, center.centerY - center.roadWidth / 2, w, center.roadWidth);
    }

    drawStopLines(ctx) {
        const center = this.config.intersection;
        const stopOffset = center.roadWidth / 2 + 10;

        ctx.strokeStyle = '#fafafa';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(center.centerX - center.roadWidth / 2, center.centerY + stopOffset);
        ctx.lineTo(center.centerX + center.roadWidth / 2, center.centerY + stopOffset);

        ctx.moveTo(center.centerX - center.roadWidth / 2, center.centerY - stopOffset);
        ctx.lineTo(center.centerX + center.roadWidth / 2, center.centerY - stopOffset);

        ctx.moveTo(center.centerX + stopOffset, center.centerY - center.roadWidth / 2);
        ctx.lineTo(center.centerX + stopOffset, center.centerY + center.roadWidth / 2);

        ctx.moveTo(center.centerX - stopOffset, center.centerY - center.roadWidth / 2);
        ctx.lineTo(center.centerX - stopOffset, center.centerY + center.roadWidth / 2);
        ctx.stroke();
    }

    drawHeatmap(ctx, queues) {
        const center = this.config.intersection;
        const range = this.config.simulation.sensorRange;

        const drawStrip = (x, y, w, h, intensity) => {
            const alpha = Math.min(0.5, intensity / 30);
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.fillRect(x, y, w, h);
        };

        drawStrip(
            center.centerX,
            center.centerY + center.roadWidth / 2,
            center.laneWidth,
            range,
            queues.north + queues.south
        );

        drawStrip(
            center.centerX - center.laneWidth,
            center.centerY - center.roadWidth / 2 - range,
            center.laneWidth,
            range,
            queues.north + queues.south
        );

        drawStrip(
            center.centerX - center.roadWidth / 2 - range,
            center.centerY,
            range,
            center.laneWidth,
            queues.east + queues.west
        );

        drawStrip(
            center.centerX + center.roadWidth / 2,
            center.centerY - center.laneWidth,
            range,
            center.laneWidth,
            queues.east + queues.west
        );
    }
}
