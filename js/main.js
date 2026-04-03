/**
 * FlowSync Main Entry
 */

document.addEventListener('DOMContentLoaded', () => {
	const engine = new SimulationEngine(Config);
	wireControls(engine);
	engine.renderFrame();
});

function wireControls(engine) {
	const startBtn = document.getElementById('btn-start');
	const pauseBtn = document.getElementById('btn-pause');
	const resetBtn = document.getElementById('btn-reset');
	const overlay = document.getElementById('canvas-overlay');

	startBtn.addEventListener('click', () => {
		engine.start();
		startBtn.disabled = true;
		pauseBtn.disabled = false;
		overlay.style.display = 'none';
	});

	pauseBtn.addEventListener('click', () => {
		engine.pause();
		startBtn.disabled = false;
		pauseBtn.disabled = true;
	});

	resetBtn.addEventListener('click', () => {
		engine.reset();
		startBtn.disabled = false;
		pauseBtn.disabled = true;
		overlay.style.display = 'flex';
	});

	document.querySelectorAll('input[name="algorithm"]').forEach((radio) => {
		radio.addEventListener('change', (event) => {
			engine.setAlgorithm(event.target.value);
		});
	});

	bindSlider('spawn-rate', 'spawn-rate-value', (value) => {
		engine.setSpawnRate(value);
		return `${value}%`;
	});

	bindSlider('sim-speed', 'sim-speed-value', (value) => {
		engine.setSimulationSpeed(value);
		return `${Number(value).toFixed(1)}x`;
	});

	bindSlider('max-vehicles', 'max-vehicles-value', (value) => {
		engine.setMaxVehicles(value);
		return `${value}`;
	});

	document.querySelectorAll('.scenario-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			document.querySelectorAll('.scenario-btn').forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');
			engine.setScenario(btn.dataset.scenario);
		});
	});

	bindToggle('show-sensors', (checked) => engine.setVisualOption('showSensors', checked));
	bindToggle('show-queue', (checked) => engine.setVisualOption('showQueue', checked));
	bindToggle('show-heatmap', (checked) => engine.setVisualOption('showHeatmap', checked));
	bindToggle('night-mode', (checked) => engine.setVisualOption('nightMode', checked));
	bindHardwareControls(engine);

	bindHelpModal();
	bindFullscreen();
}

function bindHardwareControls(engine) {
	const sensorSelect = document.getElementById('fault-sensor-select');
	sensorSelect.addEventListener('change', () => {
		const value = sensorSelect.value === 'none' ? null : sensorSelect.value;
		engine.setHardwareFault('sensorFaultDirection', value);
	});

	bindToggle('fault-stuck-red', (checked) => {
		engine.setHardwareFault('signalStuckRed', checked);
	});

	bindToggle('fault-controller-loss', (checked) => {
		engine.setHardwareFault('controllerLinkLoss', checked);
	});

	const overrideButtons = [
		{ id: 'override-auto', mode: 'AUTO' },
		{ id: 'override-ns', mode: 'NS' },
		{ id: 'override-ew', mode: 'EW' }
	];

	overrideButtons.forEach(({ id, mode }) => {
		document.getElementById(id).addEventListener('click', () => {
			overrideButtons.forEach(({ id: btnId }) => {
				document.getElementById(btnId).classList.remove('active');
			});
			document.getElementById(id).classList.add('active');
			engine.setHardwareFault('manualOverride', mode);
		});
	});
}

function bindSlider(inputId, valueId, onValue) {
	const input = document.getElementById(inputId);
	const label = document.getElementById(valueId);
	input.addEventListener('input', () => {
		const value = Number(input.value);
		label.textContent = onValue(value);
	});
}

function bindToggle(inputId, callback) {
	const input = document.getElementById(inputId);
	input.addEventListener('change', () => callback(input.checked));
}

function bindHelpModal() {
	const helpBtn = document.getElementById('btn-help');
	const modal = document.getElementById('help-modal');
	const close = document.getElementById('modal-close');
	const overlay = modal.querySelector('.modal-overlay');

	helpBtn.addEventListener('click', () => {
		modal.classList.add('active');
	});

	const hide = () => modal.classList.remove('active');
	close.addEventListener('click', hide);
	overlay.addEventListener('click', hide);
}

function bindFullscreen() {
	const btn = document.getElementById('btn-fullscreen');
	btn.addEventListener('click', async () => {
		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	});
}
