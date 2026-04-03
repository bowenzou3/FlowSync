/**
 * AdaptiveController
 * Selects phase by real-time queue density with hysteresis.
 */

class AdaptiveController {
	constructor(config) {
		this.config = config;
		this.switchThreshold = 2;
		this.lastBias = 'EW';
	}

	reset() {
		this.lastBias = 'EW';
	}

	chooseDirection(state, currentMain, phaseMeta) {
		if (state.emergencyDirection) {
			return state.emergencyDirection;
		}

		const diff = state.nsQueue - state.ewQueue;
		if (Math.abs(diff) <= this.switchThreshold || phaseMeta.elapsed < phaseMeta.minGreen) {
			return currentMain;
		}

		this.lastBias = diff > 0 ? 'NS' : 'EW';
		return this.lastBias;
	}

	getGreenDuration(state, mainDirection) {
		const min = this.config.trafficLight.minGreenDuration / 1000;
		const max = this.config.trafficLight.maxGreenDuration / 1000;
		const ownQueue = mainDirection === 'NS' ? state.nsQueue : state.ewQueue;
		const oppositeQueue = mainDirection === 'NS' ? state.ewQueue : state.nsQueue;
		const pressure = Math.max(0, ownQueue - oppositeQueue);
		const duration = min + Math.min(max - min, pressure * 1.7);
		return Number(duration.toFixed(1));
	}

	getInsights() {
		return [
			{ icon: '📡', text: 'Adaptive mode favors the approach with higher observed queue pressure.' }
		];
	}
}
