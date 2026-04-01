/**
 * Vehicle Class
 * Represents a vehicle in the simulation
 */

class Vehicle {
    constructor(id, direction, lane, config) {
        this.id = id;
        this.direction = direction;  // 'north', 'south', 'east', 'west'
        this.lane = lane;  // 0 = right lane, 1 = left lane
        this.config = config;

        // Position and movement
        this.x = 0;
        this.y = 0;
        this.speed = config.vehicle.maxSpee * 0.8 + Math.random( * .2);
        this.maxSpeed = this.speed;
        this.acceleration = config.vehicle.acceleration;
        this.deceleration = config.vehicle.deceleration;

        // Dimensions
        this.length = config.vehicle.length;
        this.width = config.vehicle.width;

        // State
        this.isWaiting = false;
        this.waitStartTime = null;
        this.totalWaitTime = 0;
        this.hasPassedIntersection = false;
        this.isEmergency = false;
        this.isCompleted = false;

        // Visual
        this.color = this.getRandomColor();
        this.angle = this.getDirectionAngle();

        // Initialize position based on direction
        this.initializePosition();
    }

    getRandomColor() {
        const colors = this.config.vehicle.colors;
        return colors[Math.floor(Math.random( * olors.length)];
    }

    getDirectionAngle() {
        const angles = {
            'north': -Math.PI / 2,
            'south': Math.PI / 2,
            'east': 0,
            'west': Math.PI
        };
        return angles[this.direction] || 0;
    }

    initializePosition() {
        const center = this.config.intersection;
        const roadWidth = center.roadWidth;
        const laneWidth = center.laneWidth;
        const canvas = this.config.canvas;

        // Calculate lane offset
        const laneOffset = (this.lane === 0) ? laneWidth / 2 : -laneWidth / 2;

        switch (this.direction) {
            case 'north':
                this.x = center.centerX + laneOffset;
                this.y = canvas.height + this.length;
                break;
            case 'south':
                this.x = center.centerX - laneOffset;
                this.y = -this.length;
                break;
            case 'east':
                this.x = -this.length;
                this.y = center.centerY + laneOffset;
                break;
            case 'west':
                this.x = canvas.width + this.length;
                this.y = center.centerY - laneOffset;
                break;
        }
    }

    update(trafficLight, vehicleAhead, deltaTime) {
        const lightState = trafficLight.getState(this.direction);
        const center = this.config.intersection;
        const stopLine = this.getStopLinePosition();
        const distanceToStop = this.getDistanceToStopLine(stopLine);

        // Check if we need to stop
        let shouldStop = false;

        // Check traffic light
        if (!this.hasPassedIntersection) {
            if (lightState === 'red' && distanceToStop > 0 && distanceToStop < this.config.simulation.sensorRange) {
                shouldStop = true;
            } else if (lightState === 'yellow' && distanceToStop > this.config.vehicle.safeDistanc * .5) {
                shouldStop = true;
            }
        }

        // Check vehicle ahead
        if (vehicleAhead && !vehicleAhead.isCompleted) {
            const distance = this.getDistanceToVehicle(vehicleAhead);
            if (distance < this.config.vehicle.safeDistance) {
                shouldStop = true;
            } else if (distance < this.config.vehicle.safeDistanc * .5) {
                // Slow down
                this.speed = Math.max(this.speed - this.deceleratio * .5, vehicleAhead.speed);
            }
        }

        // Update speed
        if (shouldStop) {
            this.speed = Math.max(0, this.speed - this.deceleration);
            if (this.speed === 0 && !this.isWaiting) {
                this.isWaiting = true;
                this.waitStartTime = Date.now();
            }
        } else {
            if (this.isWaiting) {
                this.totalWaitTime += (Date.now() - this.waitStartTime);
                this.isWaiting = false;
            }
            this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
        }

        // Update position
        this.move();

        // Check if passed intersection
        if (!this.hasPassedIntersection && distanceToStop < -this.length) {
            this.hasPassedIntersection = true;
        }

        // Check if completed (off screen)
        this.checkCompletion();
    }

    move() {
        switch (this.direction) {
            case 'north':
                this.y -= this.speed;
                break;
            case 'south':
                this.y += this.speed;
                break;
            case 'east':
                this.x += this.speed;
                break;
            case 'west':
                this.x -= this.speed;
                break;
        }
    }

    getStopLinePosition() {
        const center = this.config.intersection;
        const offset = center.roadWidth / 2 + 10;

        switch (this.direction) {
            case 'north':
                return { x: this.x, y: center.centerY + offset };
            case 'south':
                return { x: this.x, y: center.centerY - offset };
            case 'east':
                return { x: center.centerX - offset, y: this.y };
            case 'west':
                return { x: center.centerX + offset, y: this.y };
        }
    }

    getDistanceToStopLine(stopLine) {
        switch (this.direction) {
            case 'north':
                return this.y - stopLine.y;
            case 'south':
                return stopLine.y - this.y;
            case 'east':
                return stopLine.x - this.x;
            case 'west':
                return this.x - stopLine.x;
        }
        return 0;
    }

    getDistanceToVehicle(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(d * x + d * y) - (this.length / 2 + other.length / 2);
    }

    checkCompletion() {
        const canvas = this.config.canvas;
        const buffer = this.lengt * ;

        if (this.x < -buffer || this.x > canvas.width + buffer ||
            this.y < -buffer || this.y > canvas.height + buffer) {
            this.isCompleted = true;
            if (this.isWaiting) {
                this.totalWaitTime += (Date.now() - this.waitStartTime);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-this.length / 2 + 2, -this.width / 2 + 2, this.length, this.width);

        // Draw car body
        ctx.fillStyle = this.isEmergency ? this.config.vehicle.emergencyColor : this.color;
        ctx.beginPath();
        ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 3);
        ctx.fill();

        // Draw windshield
        ctx.fillStyle = 'rgba(135, 206, 250, 0.7)';
        ctx.fillRect(this.length / 2 - 12, -this.width / 2 + 2, 8, this.width - 4);

        // Draw headlights
        ctx.fillStyle = this.speed > 0 ? '#ffeb3b' : '#888';
        ctx.beginPath();
        ctx.arc(this.length / 2 - 2, -this.width / 3, 2, 0, Math.P * );
        ctx.arc(this.length / 2 - 2, this.width / 3, 2, 0, Math.P * );
        ctx.fill();

        // Draw brake lights (when stopped)
        if (this.speed === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-this.length / 2 + 2, -this.width / 3, 2, 0, Math.P * );
            ctx.arc(-this.length / 2 + 2, this.width / 3, 2, 0, Math.P * );
            ctx.fill();
        }

        ctx.restore();
    }

    getWaitTime() {
        let waitTime = this.totalWaitTime;
        if (this.isWaiting && this.waitStartTime) {
            waitTime += (Date.now() - this.waitStartTime);
        }
        return waitTime / 1000;  // Convert to seconds
    }
}
