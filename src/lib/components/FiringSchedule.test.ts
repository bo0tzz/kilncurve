import { describe, it, expect, vi } from 'vitest';
import type { FiringSegment } from '../types.js';

// Test the logic functions for the FiringSchedule component

describe('FiringSchedule Logic', () => {
	const mockSegments: FiringSegment[] = [
		{ id: 1, type: 'ramp', rate: 100, targetTemp: 500 },
		{ id: 2, type: 'hold', holdTime: 30 }
	];

	function addRampSegment(segments: FiringSegment[]): FiringSegment[] {
		const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
		return [...segments, { id: newId, type: 'ramp', rate: 100, targetTemp: 200 }];
	}

	function addHoldSegment(segments: FiringSegment[]): FiringSegment[] {
		const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
		return [...segments, { id: newId, type: 'hold', holdTime: 30 }];
	}

	function removeSegment(segments: FiringSegment[], id: number): FiringSegment[] {
		return segments.filter(s => s.id !== id);
	}

	function updateSegment(segments: FiringSegment[], id: number, updates: Partial<FiringSegment>): FiringSegment[] {
		return segments.map(s => 
			s.id === id ? { ...s, ...updates } : s
		);
	}

	it('adds ramp segment with correct default values', () => {
		const result = addRampSegment([]);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: 1,
			type: 'ramp',
			rate: 100,
			targetTemp: 200
		});
	});

	it('adds ramp segment with correct ID when segments exist', () => {
		const result = addRampSegment(mockSegments);
		expect(result).toHaveLength(3);
		expect(result[2]).toEqual({
			id: 3,
			type: 'ramp',
			rate: 100,
			targetTemp: 200
		});
	});

	it('adds hold segment with correct default values', () => {
		const result = addHoldSegment([]);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: 1,
			type: 'hold',
			holdTime: 30
		});
	});

	it('adds hold segment with correct ID when segments exist', () => {
		const result = addHoldSegment(mockSegments);
		expect(result).toHaveLength(3);
		expect(result[2]).toEqual({
			id: 3,
			type: 'hold',
			holdTime: 30
		});
	});

	it('removes segment by ID', () => {
		const result = removeSegment(mockSegments, 1);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(mockSegments[1]);
	});

	it('removes non-existent segment gracefully', () => {
		const result = removeSegment(mockSegments, 999);
		expect(result).toHaveLength(2);
		expect(result).toEqual(mockSegments);
	});

	it('updates ramp segment rate', () => {
		const result = updateSegment(mockSegments, 1, { rate: 150 });
		expect(result[0].rate).toBe(150);
		expect(result[0].targetTemp).toBe(500); // Should preserve other properties
	});

	it('updates ramp segment target temperature', () => {
		const result = updateSegment(mockSegments, 1, { targetTemp: 600 });
		expect(result[0].targetTemp).toBe(600);
		expect(result[0].rate).toBe(100); // Should preserve other properties
	});

	it('updates hold segment time', () => {
		const result = updateSegment(mockSegments, 2, { holdTime: 45 });
		expect(result[1].holdTime).toBe(45);
	});

	it('updates non-existent segment gracefully', () => {
		const result = updateSegment(mockSegments, 999, { rate: 150 });
		expect(result).toEqual(mockSegments);
	});

	it('generates correct ID for segments with gaps', () => {
		const segmentsWithGap: FiringSegment[] = [
			{ id: 1, type: 'ramp' as const, rate: 100, targetTemp: 500 },
			{ id: 5, type: 'hold' as const, holdTime: 30 }
		];
		const result = addRampSegment(segmentsWithGap);
		expect(result[2].id).toBe(6); // Should be max + 1
	});

	it('creates new array when adding segments', () => {
		const result = addRampSegment(mockSegments);
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(mockSegments[0]);
		expect(result[1]).toEqual(mockSegments[1]);
		expect(result).not.toBe(mockSegments); // Should be a new array
	});
});