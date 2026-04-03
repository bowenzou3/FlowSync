/**
 * Statistics Module
 * Tracks and calculates simulation metrics
 */

class Statistics {
    constructor() {
        this.reset();
    }

    reset() {
        this.vehiclesSpawned = 0;
        this.vehiclesCompleted = 0;
        this.completedTimestamps = [];
        this.waitTimeHistory = [];
        this.queueLengthHistory = [];
        this.efficiencyHistory = [];
        this.throughputHistory = [];
        this.lastFrameTs = Date.now();
        this.maxHistoryLength = 60;
    }

    recordVehicleSpawn() {
        this.vehiclesSpawned++;
    }

    recordVehicleComplete(waitTime) {
        this.vehiclesCompleted++;
        this.completedTimestamps.push(Date.now());
        this.waitTimeHistory.push(waitTime);

        if (this.waitTimeHistory.length > this.maxHistoryLength) {
            this.waitTimeHistory.shift();
        }
    }

    recordQueueLength(length) {
        this.queueLengthHistory.push(length);
        if (this.queueLengthHistory.length > this.maxHistoryLength) {
            this.queueLengthHistory.shift();
        }
    }

    getAverageWaitTime() {
        if (this.waitTimeHistory.length === 0) return 0;
        const sum = this.waitTimeHistory.reduce((a, b) => a + b, 0);
        return sum / this.waitTimeHistory.length;
    }

    getThroughput() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        this.completedTimestamps = this.completedTimestamps.filter((ts) => ts >= oneMinuteAgo);
        return this.completedTimestamps.length;
    }

    getAverageQueueLength() {
        if (this.queueLengthHistory.length === 0) return 0;
        const sum = this.queueLengthHistory.reduce((a, b) => a + b, 0);
        return sum / this.queueLengthHistory.length;
    }

    calculateEfficiency(currentVehicles, maxVehicles) {
        const avgWait = this.getAverageWaitTime();
        const avgQueue = this.getAverageQueueLength();
        const throughput = this.getThroughput();

        const waitScore = Math.max(0, 100 - avgWait * 8.5);
        const queueScore = Math.max(0, 100 - avgQueue * 4.8);
        const throughputScore = Math.min(100, throughput * 2.2);
        const densityScore = Math.max(0, 100 - (currentVehicles / Math.max(maxVehicles, 1)) * 70);

        const efficiency = (
            waitScore * 0.36 +
            queueScore * 0.28 +
            throughputScore * 0.24 +
            densityScore * 0.12
        );

        this.efficiencyHistory.push(efficiency);
        if (this.efficiencyHistory.length > this.maxHistoryLength) {
            this.efficiencyHistory.shift();
        }

        return Math.round(efficiency);
    }

    getChartData() {
        return {
            waitTime: this.waitTimeHistory.slice(-30),
            throughput: this.throughputHistory.slice(-30),
            efficiency: this.efficiencyHistory.slice(-30),
            queueLength: this.queueLengthHistory.slice(-30)
        };
    }

    getInsights(algorithm) {
        const insights = [];
        const avgWait = this.getAverageWaitTime();
        const avgQueue = this.getAverageQueueLength();
        const throughput = this.getThroughput();
        const efficiency = this.efficiencyHistory.length > 0
            ? this.efficiencyHistory[this.efficiencyHistory.length - 1]
            : 0;

        if (avgWait > 10) {
            insights.push({
                icon: '⚠️',
                text: `High average wait time detected (${avgWait.toFixed(1)}s). Consider switching to adaptive control.`
            });
        }

        if (avgQueue > 12) {
            insights.push({
                icon: '🚗',
                text: `Queue buildup detected (${Math.round(avgQueue)} vehicles). Traffic density is high.`
            });
        }

        if (throughput > 32) {
            insights.push({
                icon: '✅',
                text: `Throughput is strong at ${throughput} vehicles/min over the last minute.`
            });
        }

        if (algorithm === 'qlearning' && this.vehiclesCompleted > 50) {
            insights.push({
                icon: '🧠',
                text: `Q-Learning has processed ${this.vehiclesCompleted} vehicles and is refining policy from live rewards.`
            });
        }

        if (this.efficiencyHistory.length > 10) {
            const recent = this.efficiencyHistory.slice(-10);
            const trend = recent[recent.length - 1] - recent[0];
            if (trend > 5) {
                insights.push({
                    icon: '📈',
                    text: 'Efficiency is improving! The system is optimizing signal timings.'
                });
            } else if (trend < -5) {
                insights.push({
                    icon: '📉',
                    text: 'Efficiency declining. Consider adjusting spawn rate or algorithm.'
                });
            }
        }

        if (efficiency > 82) {
            insights.push({
                icon: '🏆',
                text: 'Network efficiency is excellent. Current control policy is near optimal for this scenario.'
            });
        }

        return insights.length > 0 ? insights : [{
            icon: '💡',
            text: 'Collecting data... Insights will appear as patterns emerge.'
        }];
    }
}
