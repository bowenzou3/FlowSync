# FlowSync

## VIRTUAL HARDWARE PROJECT
FlowSync is a virtual hardware smart-traffic control system.

This project is intentionally built as software-only hardware: it simulates physical intersection infrastructure (signals, sensors, lanes, and vehicle flow) and runs real-time control logic exactly like an embedded traffic controller, without requiring physical components.

FlowSync is an adaptive traffic simulation system that models how intelligent traffic lights respond to real-time congestion. It replaces fixed-timer signals with algorithm-driven decision making to improve traffic flow and reduce delays in a simulated urban environment.

### Why this is hardware-category relevant
- It models core hardware behavior: traffic lights, sensor zones, lane occupancy, and signal timing.
- It implements control-system algorithms used in real traffic hardware (fixed-time, adaptive, max-pressure, and reinforcement learning).
- It supports scenario testing (rush hour, emergency priority, accident lane blockage) similar to hardware-in-the-loop validation workflows.

### Hardware analog map (virtual hardware)
- Sensor input bus: queue detection and per-direction sensor channels (with simulated sensor-offline faults).
- Controller unit: fixed-time, adaptive, max-pressure, and Q-learning traffic controllers.
- Actuator output bus: per-direction signal output states (green/yellow/red) emitted each control cycle.
- Fail-safe modes: all-red relay fault mode, controller-link-loss fallback behavior, and manual NS/EW signal override.
