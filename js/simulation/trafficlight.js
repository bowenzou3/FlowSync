/**
 * Traffic Light Class
 * Manages traffic signal states and transitions
 */

class TrafficLight {
    constructor(direction, config) {
        this.direction = direction;  // 'north', 'south', 'east', 'west'
        this.config = config;
        this.state = 'red';  // 'green', 'yellow', 'red'
        this.timeInState = 0;
        this.position = this.calculatePosition();
    }

    calculatePosition() {
        const center = this.config.intersection;
        const offset = center.roadWidth / 2 + 25;

        const positions = {
            'north': { x: center.centerX + offset, y: center.centerY - offset },
            'south': { x: center.centerX - offset, y: center.centerY + offset },
            'east': { x: center.centerX + offset, y: center.centerY + offset },
            'west': { x: center.centerX - offset, y: center.centerY - offset }
        };

        return positions[this.direction];
    }

    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.timeInState = 0;
        }
    }

    getState(queryDirection) {
        // Handle paired directions (NS or EW)
        const nsDirections = ['north', 'south'];
        const ewDirections = ['east', 'west'];

        if (nsDirections.includes(this.direction) && nsDirections.includes(queryDirection)) {
            return this.state;
        }
        if (ewDirections.includes(this.direction) && ewDirections.includes(queryDirection)) {
            return this.state;
        }

        // If different pair, return opposite
        if (this.state === 'green') return 'red';
        if (this.state === 'yellow') return 'red';
        return 'green';
    }

    update(deltaTime) {
        this.timeInState += deltaTime;
    }

    draw(ctx, showSensors = false) {
        const pos = this.position;
        const size = this.config.trafficLight.size;

        // Draw traffic light post
        ctx.fillStyle = '#333';
        ctx.fillRect(pos.x - 3, pos.y - 20, 6, 25);

        // Draw light housing
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(pos.x - size / 2, pos.y - siz * .8, size, siz * .2, 4);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw lights
        const lightRadius = size / 3;
        const lights = [
            { color: 'red', y: pos.y - siz * .2, active: this.state === 'red' },
            { color: 'yellow', y: pos.y - siz * .5, active: this.state === 'yellow' },
            { color: 'green', y: pos.y + siz * .2, active: this.state === 'green' }
        ];

        lights.forEach(light => {
            // Glow effect for active light
            if (light.active) {
                const gradient = ctx.createRadialGradient(
                    pos.x, light.y, 0,
                    pos.x, light.y, lightRadiu * 
                );
                const glowColor = light.color === 'red' ? 'rgba(255, 0, 0, 0.3)' :
                                  light.color === 'yellow' ? 'rgba(255, 200, 0, 0.3)' :
                                  'rgba(0, 255, 0, 0.3)';
                gradient.addColorStop(0, glowColor);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, light.y, lightRadiu * , 0, Math.P * );
                ctx.fill();
            }

            // Draw light
            ctx.beginPath();
            ctx.arc(pos.x, light.y, lightRadius, 0, Math.P * );

            const activeColor = light.color === 'red' ? '#ef4444' :
                               light.color === 'yellow' ? '#fbbf24' :
                               '#22c55e';
            const inactiveColor = light.color === 'red' ? '#4a1515' :
                                  light.color === 'yellow' ? '#4a3d15' :
                                  '#154a1a';

            ctx.fillStyle = light.active ? activeColor : inactiveColor;
            ctx.fill();
        });

        // Draw sensor indicator
        if (showSensors) {
            this.drawSensor(ctx);
        }
    }

    drawSensor(ctx) {
        const center = this.config.intersection;
        const sensorRange = this.config.simulation.sensorRange;
        const laneWidth = center.laneWidth;

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#00ff00';

        switch (this.direction) {
            case 'north':
                ctx.fillRect(
                    center.centerX,
                    center.centerY + center.roadWidth / 2,
                    laneWidth,
                    sensorRange
                );
                break;
            case 'south':
                ctx.fillRect(
                    center.centerX - laneWidth,
                    center.centerY - center.roadWidth / 2 - sensorRange,
                    laneWidth,
                    sensorRange
                );
                break;
            case 'east':
                ctx.fillRect(
                    center.centerX - center.roadWidth / 2 - sensorRange,
                    center.centerY,
                    sensorRange,
                    laneWidth
                );
                break;
            case 'west':
                ctx.fillRect(
                    center.centerX + center.roadWidth / 2,
                    center.centerY - laneWidth,
                    sensorRange,
                    laneWidth
                );
                break;
        }

        ctx.restore();
    }
}
