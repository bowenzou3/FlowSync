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
        this.totalWaitTime = 0;
        this.waitTimeHistory = [];
        this.throughputHistory = [];
        this.queueLengthHistory = [];
        this.efficiencyHistory = [];
        this.startTime = Date.now();
        this.lastThroughputCheck = Date.now();
        this.throughputCount = 0;
        this.maxHistoryLength = 60;
    }

    recordVehicleSpawn() {
        this.vehiclesSpawned++;
    }

    recordVehicleComplete(waitTime) {
        this.vehiclesCompleted++;
        this.throughputCount++;
        this.totalWaitTime += waitTime;
        this.waitTimeHistory.push(waitTime);

        // Keep history manageable
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
        const elapsed = (now - this.lastThroughputCheck) / 1000;

        if (elapsed >= 60) {
            const throughput = this.throughputCount;
            this.throughputHistory.push(throughput);
            if (this.throughputHistory.length > this.maxHistoryLength) {
                this.throughputHistory.shift();
            }
            this.throughputCount = 0;
            this.lastThroughputCheck = now;
            return throughput;
        }

        // Estimate based on current rate
        return Math.round(this.throughputCoun * 60 / Math.max(elapsed, 1)));
    }

    getAverageQueueLength() {
        if (this.queueLengthHistory.length === 0) return 0;
        const sum = this.queueLengthHistory.reduce((a, b) => a + b, 0);
        return sum / this.queueLengthHistory.length;
    }

    calculateEfficiency(currentVehicles, maxVehicles) {
        // Efficiency based on multiple factors
        const avgWait = this.getAverageWaitTime();
        const avgQueue = this.getAverageQueueLength();
        const throughput = this.getThroughput();

        // Normalize and weight factors
        const waitScore = Math.max(0, 100 - (avgWait / 100));  // Lower wait = higher score
        const queueScore = Math.max(0, 100 - (avgQueu * ));  // Shorter queue = higher score
        const throughputScore = Math.min(100, throughpu * ); // Higher throughput = higher score
        const densityScore = Math.max(0, 100 - (currentVehicles / maxVehicle * 00 * .5);

        // Weighted average
        const efficiency = (waitScor * .3 + queueScor * .3 + throughputScor * .25 + densityScor * .15);

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

        if (avgWait > 30) {
            insights.push({
                icon: '⚠️',
                text: `High average wait time detected (${avgWait.toFixed(1)}s). Consider switching to adaptive control.`
            });
        }

        if (avgQueue > 10) {
            insights.push({
                icon: '🚗',
                text: `Queue buildup detected (${Math.round(avgQueue)} vehicles). Traffic density is high.`
            });
        }

        if (algorithm === 'qlearning' && this.vehiclesCompleted > 50) {
            insights.push({
                icon: '🧠',
                text: `Q-Learning has processed ${this.vehiclesCompleted} vehicles. Model is adapting to traffic patterns.`
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

        return insights.length > 0 ? insights : [{
            icon: '💡',
            text: 'Collecting data... Insights will appear as patterns emerge.'
        }];
    }
}
