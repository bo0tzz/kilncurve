import { describe, it, expect } from 'vitest';
import { calculateCurveData, getInterpolatedPoint } from './curve-utils.js';
import type { FiringSegment } from './types.js';

describe('calculateCurveData', () => {
	it('calculates curve data for empty segments', () => {
		const segments: FiringSegment[] = [];
		const result = calculateCurveData(segments, 20);
		
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ time: 0, temp: 20 });
	});

	it('calculates curve data for single ramp segment', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'ramp', rate: 100, targetTemp: 200 }
		];
		const result = calculateCurveData(segments, 20);
		
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ time: 0, temp: 20 });
		expect(result[1]).toEqual({ time: 1.8, temp: 200 }); // (200-20)/100 = 1.8 hours
	});

	it('calculates curve data for single hold segment', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'hold', holdTime: 30 }
		];
		const result = calculateCurveData(segments, 25); // Use valid start temperature
		
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ time: 0, temp: 25 });
		expect(result[1]).toEqual({ time: 0.5, temp: 25 }); // 30 minutes = 0.5 hours
	});

	it('calculates curve data for complex schedule', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'ramp', rate: 120, targetTemp: 950 },
			{ id: 2, type: 'hold', holdTime: 10 },
			{ id: 3, type: 'ramp', rate: 50, targetTemp: 1100 }
		];
		const result = calculateCurveData(segments, 20);
		
		expect(result).toHaveLength(4);
		expect(result[0]).toEqual({ time: 0, temp: 20 });
		expect(result[1].temp).toBe(950);
		expect(result[2].temp).toBe(950);
		expect(result[3].temp).toBe(1100);
		expect(result[3].time).toBeCloseTo(result[2].time + (1100 - 950) / 50);
	});

	it('handles missing properties gracefully', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'ramp' }, // missing rate and targetTemp
			{ id: 2, type: 'hold' } // missing holdTime
		];
		const result = calculateCurveData(segments, 20);
		
		// Should only return the starting point
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ time: 0, temp: 20 });
	});

	it('throws error when schedule exceeds 48 hours', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'ramp', rate: 10, targetTemp: 1300 }, // 130 hours
		];
		
		expect(() => calculateCurveData(segments, 20)).toThrow('Firing schedule exceeds 48 hours');
	});

	it('throws error for invalid temperature', () => {
		expect(() => calculateCurveData([], -10)).toThrow('Start temperature must be between 0°C and 50°C');
		expect(() => calculateCurveData([], 60)).toThrow('Start temperature must be between 0°C and 50°C');
	});

	it('throws error for invalid ramp rate', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'ramp', rate: -10, targetTemp: 200 }
		];
		
		expect(() => calculateCurveData(segments, 20)).toThrow('Invalid ramp rate at segment 1');
	});
});

describe('getInterpolatedPoint', () => {
	it('returns zero values for empty curve data', () => {
		const result = getInterpolatedPoint([], 1.0);
		expect(result).toEqual({ temp: 0, time: 1.0 });
	});

	it('interpolates between two points', () => {
		const curveData = [
			{ time: 0, temp: 20 },
			{ time: 2, temp: 220 }
		];
		
		const result = getInterpolatedPoint(curveData, 1.0);
		expect(result.temp).toBe(120); // 20 + (220-20) * 0.5
		expect(result.time).toBe(1.0);
	});

	it('returns exact point when time matches', () => {
		const curveData = [
			{ time: 0, temp: 20 },
			{ time: 1, temp: 120 },
			{ time: 2, temp: 220 }
		];
		
		const result = getInterpolatedPoint(curveData, 1.0);
		expect(result.temp).toBe(120);
		expect(result.time).toBe(1.0);
	});

	it('returns boundary values for times outside range', () => {
		const curveData = [
			{ time: 1, temp: 100 },
			{ time: 2, temp: 200 }
		];
		
		const beforeResult = getInterpolatedPoint(curveData, 0.5);
		expect(beforeResult.temp).toBe(50); // interpolates from first point
		
		const afterResult = getInterpolatedPoint(curveData, 3.0);
		expect(afterResult.temp).toBe(300); // extrapolates from last point
	});

	it('handles single point curve', () => {
		const curveData = [{ time: 1, temp: 100 }];
		
		const result = getInterpolatedPoint(curveData, 2.0);
		expect(result.temp).toBe(100);
		expect(result.time).toBe(2.0);
	});
});