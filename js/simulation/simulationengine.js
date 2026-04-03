/**
 * SimulationEngine
 * Coordinates simulation loop, controls, and UI updates.
 */

class SimulationEngine {
	constructor(config) {
		this.config = config;
		this.canvas = document.getElementById('simulation-canvas');

		this.statistics = new Statistics();
		this.intersection = new Intersection(this.config, this.statistics);
		this.renderer = new Renderer(this.canvas, this.config);
		this.dashboard = new Dashboard();

		this.controllers = {
			fixed: new FixedTimeController(this.config),
			adaptive: new AdaptiveController(this.config),
			qlearning: new QLearningController(this.config),
			maxpressure: new MaxPressureController(this.config)
		};

		this.algorithm = 'fixed';
		this.controller = this.controllers.fixed;
		this.intersection.setController(this.controller);

		this.spawnRatePercent = this.config.simulation.defaultSpawnRatePercent;
		this.maxVehicles = this.config.simulation.maxVehicles;
		this.speedMultiplier = 1;
		this.scenario = 'normal';
		this.visualOptions = {
			showSensors: true,
			showQueue: true,
			showHeatmap: false,
			nightMode: false
		};

		this.hardwareFaults = {
			sensorFaultDirection: null,
			signalStuckRed: false,
			controllerLinkLoss: false,
			manualOverride: 'AUTO'
		};

		this.running = false;
		this.lastFrameTime = 0;
		this.spawnAccumulator = 0;

		this.onFrame = this.onFrame.bind(this);
		window.addEventListener('resize', () => this.renderer.resize());
		this.applyScenario(this.scenario);
	}

	start() {
		if (this.running) return;
		this.running = true;
		this.lastFrameTime = performance.now();
		requestAnimationFrame(this.onFrame);
	}

	pause() {
		this.running = false;
	}

	reset() {
		this.pause();
		this.statistics.reset();
		this.intersection.reset();
		this.intersection.setController(this.controller);
		this.intersection.setHardwareFaults(this.hardwareFaults);
		this.applyScenario(this.scenario);
		this.renderFrame();
	}

	setAlgorithm(name) {
		this.algorithm = name;
		this.controller = this.controllers[name] || this.controllers.fixed;
		this.intersection.setController(this.controller);
	}

	setSpawnRate(percent) {
		this.spawnRatePercent = Math.max(10, Math.min(100, percent));
	}

	setSimulationSpeed(multiplier) {
		this.speedMultiplier = Math.max(0.5, Math.min(3, multiplier));
	}

	setMaxVehicles(maxVehicles) {
		this.maxVehicles = Math.max(20, Math.min(300, maxVehicles));
	}

	setScenario(scenario) {
		this.scenario = this.config.scenarios[scenario] ? scenario : 'normal';
		this.applyScenario(this.scenario);
	}

	setVisualOption(key, value) {
		this.visualOptions[key] = Boolean(value);
		if (key === 'nightMode') {
			document.body.classList.toggle('night-mode', Boolean(value));
		}
	}

	setHardwareFault(key, value) {
		if (key === 'sensorFaultDirection') {
			this.hardwareFaults.sensorFaultDirection = value || null;
		} else if (key === 'manualOverride') {
			this.hardwareFaults.manualOverride = value || 'AUTO';
		} else if (key in this.hardwareFaults) {
			this.hardwareFaults[key] = Boolean(value);
		}

		this.intersection.setHardwareFaults(this.hardwareFaults);
	}

	applyScenario(scenarioName) {
		const scenario = this.config.scenarios[scenarioName] || this.config.scenarios.normal;
		this.intersection.setBlockedLane(scenario.blockedLane);
	}

	onFrame(timestamp) {
		if (!this.running) return;

		const elapsedMs = timestamp - this.lastFrameTime;
		this.lastFrameTime = timestamp;

		const deltaSeconds = Math.min(0.2, elapsedMs / 1000) * this.speedMultiplier;

		this.intersection.setHardwareFaults(this.hardwareFaults);
		this.spawnVehicles(deltaSeconds);
		this.intersection.update(deltaSeconds);

		const trafficState = this.intersection.getTrafficState();
		this.statistics.recordQueueLength(trafficState.totalQueue);
		this.statistics.throughputHistory.push(this.statistics.getThroughput());
		if (this.statistics.throughputHistory.length > this.statistics.maxHistoryLength) {
			this.statistics.throughputHistory.shift();
		}

		this.renderFrame();
		requestAnimationFrame(this.onFrame);
	}

	renderFrame() {
		this.renderer.render(this.intersection, this.visualOptions);

		const trafficState = this.intersection.getTrafficState();
		const controllerInsights = this.controller.getInsights ? this.controller.getInsights() : [];
		this.dashboard.update(
			this.statistics,
			trafficState,
			this.algorithm,
			controllerInsights,
			this.getHardwareViewState(trafficState)
		);
	}

	getHardwareViewState(trafficState) {
		const mode = this.hardwareFaults.manualOverride;
		const output = trafficState.hardware.outputBus;
		const nsState = `${output.north.toUpperCase()}/${output.south.toUpperCase()}`;
		const ewState = `${output.east.toUpperCase()}/${output.west.toUpperCase()}`;

		return {
			inputBus: this.hardwareFaults.sensorFaultDirection
				? `Fault @ ${this.hardwareFaults.sensorFaultDirection.toUpperCase()} sensor`
				: 'Nominal',
			controlBus: this.hardwareFaults.controllerLinkLoss
				? 'Link Loss: Fixed fallback'
				: `${this.algorithm.toUpperCase()} active`,
			outputBus: `NS ${nsState} | EW ${ewState}`,
			failsafe: this.hardwareFaults.signalStuckRed
				? 'All-red fail-safe'
				: (mode === 'AUTO' ? 'Inactive' : `Manual override ${mode}`)
		};
	}

	spawnVehicles(deltaSeconds) {
		const scenario = this.config.scenarios[this.scenario] || this.config.scenarios.normal;
		const spawnRate = (this.spawnRatePercent / 100) * this.config.simulation.baseSpawnPerSecond * scenario.multiplier;
		this.spawnAccumulator += spawnRate * deltaSeconds;

		let spawned = 0;
		while (this.spawnAccumulator >= 1 && spawned < this.config.simulation.spawnBurstCap) {
			this.spawnAccumulator -= 1;
			spawned += 1;

			if (this.intersection.vehicles.length >= this.maxVehicles) {
				continue;
			}

			const direction = this.pickByWeight(scenario.directionWeights);
			const lane = Math.random() < 0.5 ? 0 : 1;
			const type = Math.random() < scenario.emergencyChance
				? 'emergency'
				: this.pickVehicleType();

			this.intersection.spawnVehicle(direction, lane, type);
		}
	}

	pickByWeight(weights) {
		const entries = Object.entries(weights);
		const total = entries.reduce((sum, [, w]) => sum + w, 0);
		let r = Math.random() * total;

		for (const [key, weight] of entries) {
			r -= weight;
			if (r <= 0) return key;
		}

		return 'north';
	}

	pickVehicleType() {
		const entries = Object.entries(this.config.vehicle.types)
			.filter(([type]) => type !== 'emergency');

		const total = entries.reduce((sum, [, cfg]) => sum + cfg.weight, 0);
		let r = Math.random() * total;
		for (const [type, cfg] of entries) {
			r -= cfg.weight;
			if (r <= 0) return type;
		}
		return 'car';
	}
}
