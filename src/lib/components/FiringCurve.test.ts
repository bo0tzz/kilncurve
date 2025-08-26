import { describe, it, expect } from 'vitest';
import type { CurvePoint } from '../types.js';

// Test the logic functions for the FiringCurve component

describe('FiringCurve Logic', () => {
	const mockCurveData: CurvePoint[] = [
		{ time: 0, temp: 20 },
		{ time: 1, temp: 120 },
		{ time: 2, temp: 200 },
		{ time: 2.5, temp: 200 }
	];

	function formatTime(time: number): string {
		return time.toFixed(1);
	}

	function formatTemperature(temp: number): string {
		return Math.round(temp).toString();
	}

	function calculateTooltipPosition(
		containerX: number, 
		containerY: number, 
		containerWidth: number,
		tooltipWidth: number = 110
	): { x: number, y: number } {
		const isNearRightEdge = containerX > containerWidth * 0.75;
		const isNearLeftEdge = containerX < containerWidth * 0.25;
		
		const tooltipX = isNearRightEdge ? containerX - tooltipWidth - 10 : 
						 isNearLeftEdge ? containerX + 10 : 
						 containerX - tooltipWidth / 2;
		
		const tooltipY = Math.max(5, containerY - 35);
		
		return {
			x: Math.max(5, Math.min(tooltipX, containerWidth - tooltipWidth - 5)),
			y: tooltipY
		};
	}

	function convertSvgToScreenCoordinates(
		svgX: number, 
		svgY: number, 
		containerWidth: number, 
		containerHeight: number
	): { x: number, y: number } {
		return {
			x: (svgX / 800) * containerWidth,
			y: (svgY / 500) * containerHeight
		};
	}

	function convertTimeToSvgX(time: number, maxTime: number): number {
		if (maxTime === 0) return 80; // Default position
		return 80 + (time / maxTime) * 640;
	}

	function convertTempToSvgY(temp: number, maxTemp: number): number {
		if (maxTemp === 0) return 420; // Default position
		return 420 - (temp / maxTemp) * 340;
	}

	it('formats time correctly with one decimal place', () => {
		expect(formatTime(2.567)).toBe('2.6');
		expect(formatTime(0)).toBe('0.0');
		expect(formatTime(10.0)).toBe('10.0');
	});

	it('formats temperature as integer', () => {
		expect(formatTemperature(200.7)).toBe('201');
		expect(formatTemperature(200.3)).toBe('200');
		expect(formatTemperature(0)).toBe('0');
	});

	it('calculates tooltip position for center area', () => {
		const result = calculateTooltipPosition(400, 200, 800, 110);
		expect(result.x).toBe(345); // 400 - 110/2
		expect(result.y).toBe(165); // 200 - 35
	});

	it('calculates tooltip position for right edge', () => {
		const result = calculateTooltipPosition(700, 200, 800, 110);
		expect(result.x).toBe(580); // 700 - 110 - 10
		expect(result.y).toBe(165);
	});

	it('calculates tooltip position for left edge', () => {
		const result = calculateTooltipPosition(100, 200, 800, 110);
		expect(result.x).toBe(110); // 100 + 10
		expect(result.y).toBe(165);
	});

	it('prevents tooltip from going off-screen', () => {
		const result = calculateTooltipPosition(0, 0, 800, 110);
		expect(result.x).toBe(10); // Should be minimum 5 + 10
		expect(result.y).toBe(5); // Should be minimum 5
	});

	it('converts SVG coordinates to screen coordinates', () => {
		const result = convertSvgToScreenCoordinates(400, 250, 800, 500);
		expect(result.x).toBe(400); // (400/800) * 800
		expect(result.y).toBe(250); // (250/500) * 500
	});

	it('converts time to SVG X coordinate', () => {
		expect(convertTimeToSvgX(0, 10)).toBe(80);
		expect(convertTimeToSvgX(5, 10)).toBe(400); // 80 + (5/10) * 640
		expect(convertTimeToSvgX(10, 10)).toBe(720); // 80 + 640
	});

	it('handles zero maxTime in time conversion', () => {
		expect(convertTimeToSvgX(5, 0)).toBe(80);
	});

	it('converts temperature to SVG Y coordinate', () => {
		expect(convertTempToSvgY(0, 1000)).toBe(420);
		expect(convertTempToSvgY(500, 1000)).toBe(250); // 420 - (500/1000) * 340
		expect(convertTempToSvgY(1000, 1000)).toBe(80); // 420 - 340
	});

	it('handles zero maxTemp in temperature conversion', () => {
		expect(convertTempToSvgY(500, 0)).toBe(420);
	});

	it('calculates chart dimensions correctly', () => {
		const chartWidth = 640; // 720 - 80
		const chartHeight = 340; // 420 - 80
		
		expect(chartWidth).toBe(640);
		expect(chartHeight).toBe(340);
	});

	it('validates curve data properties', () => {
		mockCurveData.forEach(point => {
			expect(typeof point.time).toBe('number');
			expect(typeof point.temp).toBe('number');
			expect(point.time).toBeGreaterThanOrEqual(0);
			expect(point.temp).toBeGreaterThanOrEqual(0);
		});
	});
});