/**
 * Configuration Module
 * Central configuration for the entire simulation
 */

const Config = {
    // Canvas settings
    canvas: {
        width: 800,
        height: 600,
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
        length: 30,
        width: 15,
        maxSpeed: 5,
        minSpeed: 0,
        acceleration: 0.15,
        deceleration: 0.3,
        safeDistance: 50,
        colors: [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
            '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4'
        ],
        emergencyColor: '#ff0000'
    },

    // Traffic light settings
    trafficLight: {
        defaultGreenDuration: 30000,  // 30 seconds
        defaultYellowDuration: 4000,  // 4 seconds
        defaultRedDuration: 30000,    // 30 seconds
        minGreenDuration: 10000,      // 10 seconds
        maxGreenDuration: 60000,      // 60 seconds
        size: 15
    },

    // Simulation settings
    simulation: {
        fps: 60,
        defaultSpawnRate: 0.02,
        maxVehicles: 100,
        sensorRange: 150
    },

    // Q-Learning settings
    qLearning: {
        learningRate: 0.1,
        discountFactor: 0.95,
        explorationRate: 0.2,
        explorationDecay: 0.995,
        minExplorationRate: 0.01,
        stateDiscretization: 5  // Discretize queue lengths into 5 levels
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
