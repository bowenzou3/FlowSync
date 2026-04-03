/**
 * Intersection Class
 * Owns traffic lights, vehicles, phase transitions, and per-step state.
 */

class Intersection {
	constructor(config, statistics) {
		this.config = config;
		this.statistics = statistics;
		this.road = new Road(config);

		this.trafficLights = {
			north: new TrafficLight('north', config),
			south: new TrafficLight('south', config),
			east: new TrafficLight('east', config),
			west: new TrafficLight('west', config)
		};

		this.vehicles = [];
		this.nextVehicleId = 1;
		this.controller = null;

		this.currentMain = 'EW';
		this.pendingMain = 'EW';
		this.isYellow = false;
		this.phaseTimeRemaining = this.config.trafficLight.defaultGreenDuration / 1000;
		this.currentGreenElapsed = 0;

		this.blockedLane = null;
		this.sensorFaultDirection = null;
		this.commLoss = false;
		this.forcedSignalMode = 'AUTO';

		this.applyMainPhase(this.currentMain, false);
	}

	reset() {
		this.vehicles = [];
		this.nextVehicleId = 1;
		this.currentMain = 'EW';
		this.pendingMain = 'EW';
		this.isYellow = false;
		this.phaseTimeRemaining = this.config.trafficLight.defaultGreenDuration / 1000;
		this.currentGreenElapsed = 0;
		this.sensorFaultDirection = null;
		this.commLoss = false;
		this.forcedSignalMode = 'AUTO';
		this.applyMainPhase(this.currentMain, false);
	}

	setController(controller) {
		this.controller = controller;
		if (this.controller && typeof this.controller.reset === 'function') {
			this.controller.reset();
		}
	}

	setBlockedLane(blockedLane) {
		this.blockedLane = blockedLane;
	}

	setHardwareFaults(faults) {
		this.sensorFaultDirection = faults.sensorFaultDirection || null;
		this.commLoss = Boolean(faults.controllerLinkLoss);

		if (faults.signalStuckRed) {
			this.forcedSignalMode = 'ALL_RED';
			return;
		}

		if (faults.manualOverride === 'NS') {
			this.forcedSignalMode = 'NS_GREEN';
			return;
		}

		if (faults.manualOverride === 'EW') {
			this.forcedSignalMode = 'EW_GREEN';
			return;
		}

		this.forcedSignalMode = 'AUTO';
	}

	spawnVehicle(direction, lane, type) {
		const vehicle = new Vehicle(this.nextVehicleId++, direction, lane, type, this.config);
		this.vehicles.push(vehicle);
		this.statistics.recordVehicleSpawn();
	}

	update(deltaSeconds) {
		this.updateSignals(deltaSeconds);

		const byLane = this.groupVehiclesByLane();

		Object.values(byLane).forEach((laneVehicles) => {
			laneVehicles.sort((a, b) => this.distanceToStopLine(a) - this.distanceToStopLine(b));

			laneVehicles.forEach((vehicle, index) => {
				const lead = index === 0 ? null : laneVehicles[index - 1];
				const lightState = this.trafficLights[vehicle.direction].getState(vehicle.direction);

				const incidentBlocked = this.blockedLane &&
					this.blockedLane.direction === vehicle.direction &&
					this.blockedLane.lane === vehicle.lane;

				vehicle.update(
					{
						lightState,
						stopDistance: this.distanceToStopLine(vehicle),
						vehicleAhead: lead,
						isLaneBlocked: Boolean(incidentBlocked)
					},
					deltaSeconds
				);
			});
		});

		const completed = this.vehicles.filter((v) => v.isCompleted);
		completed.forEach((v) => this.statistics.recordVehicleComplete(v.getWaitTime()));
		this.vehicles = this.vehicles.filter((v) => !v.isCompleted);
	}

	updateSignals(deltaSeconds) {
		if (this.forcedSignalMode === 'ALL_RED') {
			this.setAllRed();
			this.phaseTimeRemaining = 0;
			this.isYellow = false;
			return;
		}

		if (this.forcedSignalMode === 'NS_GREEN') {
			this.applyMainPhase('NS', false);
			this.currentMain = 'NS';
			this.phaseTimeRemaining = 1;
			this.isYellow = false;
			return;
		}

		if (this.forcedSignalMode === 'EW_GREEN') {
			this.applyMainPhase('EW', false);
			this.currentMain = 'EW';
			this.phaseTimeRemaining = 1;
			this.isYellow = false;
			return;
		}

		this.phaseTimeRemaining -= deltaSeconds;
		if (!this.isYellow) {
			this.currentGreenElapsed += deltaSeconds;
		}

		if (this.phaseTimeRemaining > 0) {
			return;
		}

		const state = this.getTrafficState();
		const minGreen = this.config.trafficLight.minGreenDuration / 1000;

		if (this.commLoss) {
			if (this.isYellow) {
				this.currentMain = this.pendingMain;
				this.isYellow = false;
				this.phaseTimeRemaining = this.config.trafficLight.defaultGreenDuration / 1000;
				this.currentGreenElapsed = 0;
				this.applyMainPhase(this.currentMain, false);
				return;
			}

			this.pendingMain = this.currentMain === 'NS' ? 'EW' : 'NS';
			this.isYellow = true;
			this.phaseTimeRemaining = this.config.trafficLight.defaultYellowDuration / 1000;
			this.applyMainPhase(this.currentMain, true);
			return;
		}

		if (this.isYellow) {
			this.currentMain = this.pendingMain;
			this.isYellow = false;
			this.currentGreenElapsed = 0;

			const duration = this.controller && this.controller.getGreenDuration
				? this.controller.getGreenDuration(state, this.currentMain)
				: this.config.trafficLight.defaultGreenDuration / 1000;

			this.phaseTimeRemaining = duration;
			this.applyMainPhase(this.currentMain, false);
			return;
		}

		let desiredMain = this.currentMain;
		if (this.controller && this.controller.chooseDirection) {
			desiredMain = this.controller.chooseDirection(state, this.currentMain, {
				elapsed: this.currentGreenElapsed,
				minGreen
			});
		}

		if (desiredMain !== this.currentMain && this.currentGreenElapsed >= minGreen) {
			this.pendingMain = desiredMain;
			this.isYellow = true;
			this.phaseTimeRemaining = this.config.trafficLight.defaultYellowDuration / 1000;
			this.applyMainPhase(this.currentMain, true);
			return;
		}

		const duration = this.controller && this.controller.getGreenDuration
			? this.controller.getGreenDuration(state, this.currentMain)
			: this.config.trafficLight.defaultGreenDuration / 1000;

		this.phaseTimeRemaining = duration;
		this.applyMainPhase(this.currentMain, false);
	}

	applyMainPhase(mainDirection, yellow) {
		const phase = yellow
			? (mainDirection === 'NS' ? this.config.phases.NS_YELLOW : this.config.phases.EW_YELLOW)
			: (mainDirection === 'NS' ? this.config.phases.NS_GREEN : this.config.phases.EW_GREEN);

		this.trafficLights.north.setState(phase.north);
		this.trafficLights.south.setState(phase.south);
		this.trafficLights.east.setState(phase.east);
		this.trafficLights.west.setState(phase.west);
	}

	setAllRed() {
		this.trafficLights.north.setState('red');
		this.trafficLights.south.setState('red');
		this.trafficLights.east.setState('red');
		this.trafficLights.west.setState('red');
	}

	groupVehiclesByLane() {
		const map = {
			north0: [], north1: [], south0: [], south1: [],
			east0: [], east1: [], west0: [], west1: []
		};

		this.vehicles.forEach((v) => {
			map[`${v.direction}${v.lane}`].push(v);
		});

		return map;
	}

	distanceToStopLine(vehicle) {
		const stopLine = vehicle.getStopLinePosition();
		return vehicle.getDistanceToStopLine(stopLine);
	}

	getQueueLengths() {
		const queue = { north: 0, south: 0, east: 0, west: 0 };
		this.vehicles.forEach((vehicle) => {
			const d = this.distanceToStopLine(vehicle);
			if (!vehicle.hasPassedIntersection && d > 0 && d < this.config.simulation.sensorRange) {
				if (vehicle.speed < 2) {
					queue[vehicle.direction] += 1;
				}
			}
		});

		if (this.sensorFaultDirection && queue[this.sensorFaultDirection] !== undefined) {
			queue[this.sensorFaultDirection] = 0;
		}

		return queue;
	}

	getOutputBusState() {
		return {
			north: this.trafficLights.north.state,
			south: this.trafficLights.south.state,
			east: this.trafficLights.east.state,
			west: this.trafficLights.west.state
		};
	}

	getEmergencyDirection() {
		const waitingEmergency = this.vehicles.find((v) => {
			if (!v.isEmergency || v.hasPassedIntersection) return false;
			const d = this.distanceToStopLine(v);
			return d > 0 && d < this.config.simulation.sensorRange;
		});

		if (!waitingEmergency) return null;
		return waitingEmergency.direction === 'north' || waitingEmergency.direction === 'south'
			? 'NS'
			: 'EW';
	}

	getTrafficState() {
		const queues = this.getQueueLengths();
		const totalQueue = queues.north + queues.south + queues.east + queues.west;

		return {
			queues,
			nsQueue: queues.north + queues.south,
			ewQueue: queues.east + queues.west,
			totalQueue,
			activeVehicles: this.vehicles.length,
			phaseMain: this.currentMain,
			isYellow: this.isYellow,
			timer: this.phaseTimeRemaining,
			emergencyDirection: this.getEmergencyDirection(),
			hardware: {
				sensorFaultDirection: this.sensorFaultDirection,
				controllerLinkLoss: this.commLoss,
				forcedSignalMode: this.forcedSignalMode,
				outputBus: this.getOutputBusState()
			}
		};
	}
}
