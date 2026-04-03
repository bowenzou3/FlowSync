/**
 * MaxPressureController
 * Greedy queue pressure minimization.
 */

class MaxPressureController {
	constructor(config) {
		this.config = config;
	}

	reset() {}

	chooseDirection(state, currentMain, phaseMeta) {
		if (state.emergencyDirection) {
			return state.emergencyDirection;
		}

		if (phaseMeta.elapsed < phaseMeta.minGreen) {
			return currentMain;
		}

		const nsPressure = state.nsQueue * 1.2 + state.queues.north * 0.3 + state.queues.south * 0.3;
		const ewPressure = state.ewQueue * 1.2 + state.queues.east * 0.3 + state.queues.west * 0.3;

		if (Math.abs(nsPressure - ewPressure) < 1.25) {
			return currentMain;
		}

		return nsPressure > ewPressure ? 'NS' : 'EW';
	}

	getGreenDuration(state, mainDirection) {
		const min = this.config.trafficLight.minGreenDuration / 1000;
		const max = this.config.trafficLight.maxGreenDuration / 1000;
		const own = mainDirection === 'NS' ? state.nsQueue : state.ewQueue;
		const duration = Math.max(min, Math.min(max, min + own * 1.1));
		return Number(duration.toFixed(1));
	}

	getInsights() {
		return [
			{ icon: '⚖️', text: 'Max-pressure policy is routing green time toward the highest-pressure corridor.' }
		];
	}
}
