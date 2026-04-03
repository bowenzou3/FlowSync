/**
 * Configuration Module
 * Central configuration for the entire simulation
 */

const Config = {
    // Canvas settings
    canvas: {
        width: 1024,
        height: 640,
        backgroundColor: '#1a1a2e',
        roadColor: '#2d2d44',
        laneMarkingColor: '#ffffff',
        grassColor: '#1e3d1e'
    },

    // Intersection settings
    intersection: {
        centerX: 400,
        centerY: 300,
        roadWidth: 80,
        laneWidth: 40,
        crosswalkWidth: 15
    },

    // Vehicle settings
    vehicle: {
        length: 28,
        width: 14,
        maxSpeed: 110,
        minSpeed: 0,
        acceleration: 190,
        deceleration: 280,
        safeDistance: 34,
        minGapAtStop: 16,
        colors: [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
            '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4'
        ],
        emergencyColor: '#ff0000',
        types: {
            bike: { length: 18, width: 8, speedMultiplier: 1.2, weight: 0.18 },
            car: { length: 28, width: 14, speedMultiplier: 1.0, weight: 0.56 },
            ltv: { length: 36, width: 16, speedMultiplier: 0.88, weight: 0.16 },
            htv: { length: 48, width: 18, speedMultiplier: 0.74, weight: 0.1 },
            emergency: { length: 34, width: 15, speedMultiplier: 1.35, weight: 0.0 }
        }
    },

    // Traffic light settings
    trafficLight: {
        defaultGreenDuration: 22000,
        defaultYellowDuration: 3500,
        defaultRedDuration: 22000,
        minGreenDuration: 9000,
        maxGreenDuration: 45000,
        size: 15
    },

    // Simulation settings
    simulation: {
        fps: 60,
        defaultSpawnRatePercent: 50,
        baseSpawnPerSecond: 1.3,
        maxVehicles: 100,
        sensorRange: 170,
        spawnBurstCap: 3
    },

    // Q-Learning settings
    qLearning: {
        learningRate: 0.14,
        discountFactor: 0.93,
        explorationRate: 0.25,
        explorationDecay: 0.997,
        minExplorationRate: 0.01,
        stateDiscretization: 6
    },

    // Direction mappings
    directions: {
        NORTH: 0,
        SOUTH: 1,
        EAST: 2,
        WEST: 3
    },

    // Phase configurations
    phases: {
        NS_GREEN: { north: 'green', south: 'green', east: 'red', west: 'red' },
        NS_YELLOW: { north: 'yellow', south: 'yellow', east: 'red', west: 'red' },
        EW_GREEN: { north: 'red', south: 'red', east: 'green', west: 'green' },
        EW_YELLOW: { north: 'red', south: 'red', east: 'yellow', west: 'yellow' }
    },

    scenarios: {
        normal: {
            multiplier: 1.0,
            directionWeights: { north: 0.25, south: 0.25, east: 0.25, west: 0.25 },
            emergencyChance: 0.0,
            blockedLane: null
        },
        rush: {
            multiplier: 1.8,
            directionWeights: { north: 0.33, south: 0.32, east: 0.2, west: 0.15 },
            emergencyChance: 0.0,
            blockedLane: null
        },
        emergency: {
            multiplier: 1.15,
            directionWeights: { north: 0.28, south: 0.28, east: 0.22, west: 0.22 },
            emergencyChance: 0.09,
            blockedLane: null
        },
        accident: {
            multiplier: 1.3,
            directionWeights: { north: 0.22, south: 0.22, east: 0.36, west: 0.2 },
            emergencyChance: 0.02,
            blockedLane: { direction: 'east', lane: 1 }
        }
    }
};

// Freeze config to prevent modifications
Object.freeze(Config);
Object.freeze(Config.canvas);
Object.freeze(Config.intersection);
Object.freeze(Config.vehicle);
Object.freeze(Config.trafficLight);
Object.freeze(Config.simulation);
Object.freeze(Config.qLearning);
Object.freeze(Config.directions);
Object.freeze(Config.phases);
Object.freeze(Config.scenarios);
