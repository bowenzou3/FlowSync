/**
 * Vehicle Class
 * Represents a vehicle in the simulation
 */

class Vehicle {
    constructor(id, direction, lane, type, config) {
        this.id = id;
        this.direction = direction;
        this.lane = lane;
        this.type = type || 'car';
        this.config = config;

        const typeCfg = this.config.vehicle.types[this.type] || this.config.vehicle.types.car;
        this.length = typeCfg.length;
        this.width = typeCfg.width;

        this.x = 0;
        this.y = 0;
        this.maxSpeed = this.config.vehicle.maxSpeed * typeCfg.speedMultiplier;
        this.speed = this.maxSpeed * (0.58 + Math.random() * 0.22);
        this.acceleration = config.vehicle.acceleration;
        this.deceleration = config.vehicle.deceleration;

        this.isWaiting = false;
        this.waitStartTime = null;
        this.totalWaitTime = 0;
        this.hasPassedIntersection = false;
        this.isEmergency = this.type === 'emergency';
        this.isCompleted = false;
        this.blockedByIncident = false;

        this.color = this.getRandomColor();
        this.angle = this.getDirectionAngle();

        this.initializePosition();
    }

    getRandomColor() {
        if (this.isEmergency) return this.config.vehicle.emergencyColor;
        const colors = this.config.vehicle.colors;
        return colors[Math.floor(Math.random() * colors.length)];
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
        const laneWidth = center.laneWidth;
        const canvas = this.config.canvas;

        const laneOffset = this.lane === 0 ? laneWidth * 0.5 : -laneWidth * 0.5;

        switch (this.direction) {
            case 'north':
                this.x = center.centerX + laneOffset * 0.8;
                this.y = canvas.height + this.length;
                break;
            case 'south':
                this.x = center.centerX - laneOffset * 0.8;
                this.y = -this.length;
                break;
            case 'east':
                this.x = -this.length;
                this.y = center.centerY + laneOffset * 0.8;
                break;
            case 'west':
                this.x = canvas.width + this.length;
                this.y = center.centerY - laneOffset * 0.8;
                break;
        }
    }

    update(context, deltaSeconds) {
        const lightState = context.lightState;
        const stopDistance = context.stopDistance;
        const vehicleAhead = context.vehicleAhead;
        const isLaneBlocked = context.isLaneBlocked;

        let shouldStop = false;
        let targetSpeed = this.maxSpeed;

        if (!this.hasPassedIntersection) {
            if (lightState === 'red' && stopDistance > 0 && stopDistance < this.config.simulation.sensorRange) {
                shouldStop = true;
            } else if (lightState === 'yellow' && stopDistance > this.config.vehicle.safeDistance * 0.45) {
                shouldStop = true;
            }
        }

        if (vehicleAhead && !vehicleAhead.isCompleted) {
            const distance = this.getDistanceToVehicle(vehicleAhead);
            if (distance < this.config.vehicle.minGapAtStop) {
                shouldStop = true;
            } else if (distance < this.config.vehicle.safeDistance) {
                targetSpeed = Math.min(targetSpeed, Math.max(0, vehicleAhead.speed - 4));
            }
        }

        if (isLaneBlocked && stopDistance > 0 && stopDistance < 105) {
            shouldStop = true;
            this.blockedByIncident = true;
        } else {
            this.blockedByIncident = false;
        }

        if (shouldStop) {
            this.speed = Math.max(0, this.speed - this.deceleration * deltaSeconds);
            if (this.speed === 0 && !this.isWaiting) {
                this.isWaiting = true;
                this.waitStartTime = Date.now();
            }
        } else {
            if (this.isWaiting) {
                this.totalWaitTime += (Date.now() - this.waitStartTime);
                this.isWaiting = false;
                this.waitStartTime = null;
            }

            if (this.speed < targetSpeed) {
                this.speed = Math.min(targetSpeed, this.speed + this.acceleration * deltaSeconds);
            } else {
                this.speed = Math.max(targetSpeed, this.speed - this.deceleration * 0.35 * deltaSeconds);
            }
        }

        this.move(deltaSeconds);

        if (!this.hasPassedIntersection && stopDistance < -this.length) {
            this.hasPassedIntersection = true;
        }

        this.checkCompletion();
    }

    move(deltaSeconds) {
        const distance = this.speed * deltaSeconds;
        switch (this.direction) {
            case 'north':
                this.y -= distance;
                break;
            case 'south':
                this.y += distance;
                break;
            case 'east':
                this.x += distance;
                break;
            case 'west':
                this.x -= distance;
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
        return Math.sqrt(dx * dx + dy * dy) - (this.length / 2 + other.length / 2);
    }

    checkCompletion() {
        const canvas = this.config.canvas;
        const buffer = this.length * 3;

        if (this.x < -buffer || this.x > canvas.width + buffer ||
            this.y < -buffer || this.y > canvas.height + buffer) {
            this.isCompleted = true;
            if (this.isWaiting) {
                this.totalWaitTime += (Date.now() - this.waitStartTime);
                this.isWaiting = false;
                this.waitStartTime = null;
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

        if (this.blockedByIncident) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.length / 2, -this.width / 2, this.length, this.width);
        }

        // Draw windshield
        ctx.fillStyle = 'rgba(135, 206, 250, 0.7)';
        ctx.fillRect(this.length / 2 - 12, -this.width / 2 + 2, 8, this.width - 4);

        // Draw headlights
        ctx.fillStyle = this.speed > 0 ? '#ffeb3b' : '#888';
        ctx.beginPath();
        ctx.arc(this.length / 2 - 2, -this.width / 3, 2, 0, Math.PI * 2);
        ctx.arc(this.length / 2 - 2, this.width / 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw brake lights (when stopped)
        if (this.speed === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-this.length / 2 + 2, -this.width / 3, 2, 0, Math.PI * 2);
            ctx.arc(-this.length / 2 + 2, this.width / 3, 2, 0, Math.PI * 2);
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
