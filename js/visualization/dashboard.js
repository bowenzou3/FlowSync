/**
 * Dashboard
 * Updates all right-panel metrics and chart visualizations.
 */

class Dashboard {
	constructor() {
		this.refs = {
			vehicles: document.getElementById('stat-vehicles'),
			waitTime: document.getElementById('stat-wait-time'),
			throughput: document.getElementById('stat-throughput'),
			queue: document.getElementById('stat-queue'),
			efficiencyValue: document.getElementById('efficiency-value'),
			efficiencyRing: document.getElementById('efficiency-ring'),
			nsLight: document.getElementById('ns-light'),
			ewLight: document.getElementById('ew-light'),
			signalTimer: document.getElementById('signal-timer'),
			hwInputBus: document.getElementById('hw-input-bus'),
			hwControlBus: document.getElementById('hw-control-bus'),
			hwOutputBus: document.getElementById('hw-output-bus'),
			hwFailsafe: document.getElementById('hw-failsafe'),
			aiInsights: document.getElementById('ai-insights'),
			chart: document.getElementById('performance-chart')
		};

		this.chartCtx = this.refs.chart.getContext('2d');
		this.resizeChart();
		window.addEventListener('resize', () => this.resizeChart());
	}

	resizeChart() {
		const dpr = window.devicePixelRatio || 1;
		const rect = this.refs.chart.getBoundingClientRect();
		const width = Math.max(250, Math.floor(rect.width || 280));
		const height = Math.max(130, Math.floor(rect.height || 140));

		this.refs.chart.width = width * dpr;
		this.refs.chart.height = height * dpr;
		this.refs.chart.style.width = `${width}px`;
		this.refs.chart.style.height = `${height}px`;
		this.chartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	update(statistics, trafficState, algorithm, controllerInsights, hardwareState) {
		this.refs.vehicles.textContent = String(trafficState.activeVehicles);
		this.refs.waitTime.textContent = `${statistics.getAverageWaitTime().toFixed(1)}s`;
		this.refs.throughput.textContent = String(statistics.getThroughput());
		this.refs.queue.textContent = String(trafficState.totalQueue);

		const efficiency = statistics.calculateEfficiency(trafficState.activeVehicles, Config.simulation.maxVehicles);
		this.refs.efficiencyValue.textContent = String(efficiency);
		this.updateEfficiencyRing(efficiency);
		this.updateSignalStatus(trafficState);
		this.updateHardwareStatus(hardwareState);
		this.drawChart(statistics.getChartData());

		const metricInsights = statistics.getInsights(algorithm);
		const combined = [...controllerInsights, ...metricInsights].slice(0, 4);
		this.renderInsights(combined);
	}

	updateEfficiencyRing(value) {
		const circumference = 2 * Math.PI * 45;
		const progress = Math.max(0, Math.min(100, value));
		const offset = circumference - (progress / 100) * circumference;

		this.refs.efficiencyRing.style.strokeDasharray = `${circumference}`;
		this.refs.efficiencyRing.style.strokeDashoffset = `${offset}`;
	}

	updateSignalStatus(state) {
		const nsGreen = !state.isYellow && state.phaseMain === 'NS';
		const ewGreen = !state.isYellow && state.phaseMain === 'EW';
		const yellow = state.isYellow;

		this.refs.nsLight.textContent = yellow && state.phaseMain === 'NS' ? '🟡' : (nsGreen ? '🟢' : '🔴');
		this.refs.ewLight.textContent = yellow && state.phaseMain === 'EW' ? '🟡' : (ewGreen ? '🟢' : '🔴');
		this.refs.signalTimer.textContent = `${Math.max(0, state.timer).toFixed(1)}s`;
	}

	updateHardwareStatus(hardwareState) {
		if (!hardwareState) return;
		this.refs.hwInputBus.textContent = hardwareState.inputBus;
		this.refs.hwControlBus.textContent = hardwareState.controlBus;
		this.refs.hwOutputBus.textContent = hardwareState.outputBus;
		this.refs.hwFailsafe.textContent = hardwareState.failsafe;

		this.refs.hwFailsafe.style.background =
			hardwareState.failsafe === 'Inactive' ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.2)';
	}

	drawChart(data) {
		const ctx = this.chartCtx;
		const width = this.refs.chart.clientWidth;
		const height = this.refs.chart.clientHeight;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
		ctx.fillRect(0, 0, width, height);

		this.drawSeries(data.efficiency, '#22c55e', width, height, 100);
		this.drawSeries(data.waitTime, '#f59e0b', width, height, 20);
	}

	drawSeries(values, color, width, height, maxY) {
		if (!values || values.length < 2) return;
		const ctx = this.chartCtx;
		const stepX = width / Math.max(values.length - 1, 1);

		ctx.beginPath();
		values.forEach((v, i) => {
			const x = i * stepX;
			const y = height - Math.min(1, v / maxY) * (height - 8) - 4;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	renderInsights(insights) {
		this.refs.aiInsights.innerHTML = insights
			.map((insight) => (
				`<div class="insight-card"><span class="insight-icon">${insight.icon}</span><p>${insight.text}</p></div>`
			))
			.join('');
	}
}
