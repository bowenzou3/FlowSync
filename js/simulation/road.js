/**
 * Road Class
 * Renders the road infrastructure
 */

class Road {
    constructor(config) {
        this.config = config;
    }

    draw(ctx, showHeatmap = false, queueLengths = null) {
        const canvas = this.config.canvas;
        const center = this.config.intersection;

        // Draw grass/background
        ctx.fillStyle = this.config.canvas.grassColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw main roads
        ctx.fillStyle = this.config.canvas.roadColor;

        // Vertical road (North-South)
        ctx.fillRect(
            center.centerX - center.roadWidth / 2,
            0,
            center.roadWidth,
            canvas.height
        );

        // Horizontal road (East-West)
        ctx.fillRect(
            0,
            center.centerY - center.roadWidth / 2,
            canvas.width,
            center.roadWidth
        );

        // Draw heatmap if enabled
        if (showHeatmap && queueLengths) {
            this.drawHeatmap(ctx, queueLengths);
        }

        // Draw intersection
        this.drawIntersection(ctx);

        // Draw lane markings
        this.drawLaneMarkings(ctx);

        // Draw crosswalks
        this.drawCrosswalks(ctx);

        // Draw stop lines
        this.drawStopLines(ctx);
    }

    drawIntersection(ctx) {
        const center = this.config.intersection;

        // Slightly different color for intersection
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
        ctx.setLineDash([20, 20]);

