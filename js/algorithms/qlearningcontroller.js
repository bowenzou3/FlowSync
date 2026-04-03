/**
 * QLearningController
 * Lightweight tabular Q-learning for phase selection.
 */

class QLearningController {
	constructor(config) {
		this.config = config;
		this.alpha = config.qLearning.learningRate;
		this.gamma = config.qLearning.discountFactor;
		this.epsilon = config.qLearning.explorationRate;
		this.epsilonDecay = config.qLearning.explorationDecay;
		this.minEpsilon = config.qLearning.minExplorationRate;
		this.bins = config.qLearning.stateDiscretization;
		this.q = new Map();

		this.lastStateKey = null;
		this.lastAction = null;
		this.lastReward = 0;
	}

	reset() {
		this.lastStateKey = null;
		this.lastAction = null;
		this.lastReward = 0;
	}

	discretize(queue) {
		return Math.max(0, Math.min(this.bins - 1, Math.floor(queue / 3)));
	}

	stateKey(state) {
		const ns = this.discretize(state.nsQueue);
		const ew = this.discretize(state.ewQueue);
		const imbalance = Math.max(-3, Math.min(3, ns - ew));
		return `${ns}|${ew}|${imbalance}|${state.phaseMain}`;
	}

	ensureState(key) {
		if (!this.q.has(key)) {
			this.q.set(key, { NS: 0, EW: 0 });
		}
		return this.q.get(key);
	}

	reward(state, action) {
		const queuePenalty = -0.95 * state.totalQueue;
		const waitPressurePenalty = -0.35 * Math.abs(state.nsQueue - state.ewQueue);
		const actionGain = action === 'NS' ? state.nsQueue - state.ewQueue : state.ewQueue - state.nsQueue;
		const emergencyBoost = state.emergencyDirection === action ? 8 : 0;
		return queuePenalty + waitPressurePenalty + actionGain * 1.3 + emergencyBoost;
	}

	chooseDirection(state, currentMain, phaseMeta) {
		if (phaseMeta.elapsed < phaseMeta.minGreen) {
			return currentMain;
		}

		const key = this.stateKey(state);
		const qState = this.ensureState(key);

		let action;
		if (state.emergencyDirection) {
			action = state.emergencyDirection;
		} else if (Math.random() < this.epsilon) {
			action = Math.random() < 0.5 ? 'NS' : 'EW';
		} else {
			action = qState.NS >= qState.EW ? 'NS' : 'EW';
		}

		if (this.lastStateKey && this.lastAction) {
			const prev = this.ensureState(this.lastStateKey);
			const maxFuture = Math.max(qState.NS, qState.EW);
			prev[this.lastAction] = prev[this.lastAction] + this.alpha * (
				this.lastReward + this.gamma * maxFuture - prev[this.lastAction]
			);
		}

		this.lastStateKey = key;
		this.lastAction = action;
		this.lastReward = this.reward(state, action);

		this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
		return action;
	}

	getGreenDuration(state, mainDirection) {
		const min = this.config.trafficLight.minGreenDuration / 1000;
		const max = this.config.trafficLight.maxGreenDuration / 1000;
		const ownQueue = mainDirection === 'NS' ? state.nsQueue : state.ewQueue;
		const opposite = mainDirection === 'NS' ? state.ewQueue : state.nsQueue;
		const gain = Math.max(0, ownQueue - opposite);
		const duration = min + Math.min(max - min, ownQueue * 0.8 + gain * 1.2);
		return Number(duration.toFixed(1));
	}

	getInsights() {
		return [
			{ icon: '🤖', text: `Q-learning exploration rate: ${(this.epsilon * 100).toFixed(1)}%` },
			{ icon: '🧪', text: `Q-table states learned: ${this.q.size}` }
		];
	}
}
