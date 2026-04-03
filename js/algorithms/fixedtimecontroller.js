/**
 * FixedTimeController
 * Traditional periodic signal timing baseline.
 */

class FixedTimeController {
	constructor(config) {
		this.config = config;
		this.lastSwitchAt = 0;
		this.cycleSeconds = this.config.trafficLight.defaultGreenDuration / 1000;
	}

	reset() {
		this.lastSwitchAt = 0;
	}

	chooseDirection(state, currentMain, phaseMeta) {
		this.lastSwitchAt += phaseMeta.elapsed;
		if (phaseMeta.elapsed >= this.cycleSeconds) {
			this.lastSwitchAt = 0;
			return currentMain === 'NS' ? 'EW' : 'NS';
		}
		return currentMain;
	}

	getGreenDuration() {
		return this.cycleSeconds;
	}

	getInsights() {
		return [
			{ icon: '⏲️', text: 'Fixed-time baseline is running with deterministic phase cycles.' }
		];
	}
}
