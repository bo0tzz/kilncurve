import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadProfiles, saveProfiles, saveCurrentSchedule, loadCurrentSchedule } from './storage.js';
import type { FiringProfile, FiringSegment } from './types.js';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

describe('loadProfiles', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('returns default profiles when none are stored', () => {
		const profiles = loadProfiles();
		
		expect(profiles).toHaveLength(4);
		expect(profiles[0].name).toBe('Standard Bisque');
		expect(profiles[1].name).toBe('Cone 6 Glaze');
		expect(profiles.every(p => p.isDefault)).toBe(true);
		expect(localStorageMock.setItem).toHaveBeenCalledWith('firingProfiles', expect.any(String));
	});

	it('returns stored profiles when they exist', () => {
		const storedProfiles: FiringProfile[] = [
			{
				id: 'custom1',
				name: 'Custom Profile',
				description: 'My custom profile',
				startTemp: 25,
				segments: [{ id: 1, type: 'ramp', rate: 150, targetTemp: 1000 }],
				isDefault: false
			}
		];
		
		localStorageMock.setItem('firingProfiles', JSON.stringify(storedProfiles));
		
		const profiles = loadProfiles();
		expect(profiles).toEqual(storedProfiles);
		expect(localStorageMock.getItem).toHaveBeenCalledWith('firingProfiles');
	});
});

describe('saveProfiles', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('saves profiles to localStorage', () => {
		const profiles: FiringProfile[] = [
			{
				id: 'test1',
				name: 'Test Profile',
				description: 'Test description',
				startTemp: 20,
				segments: [],
				isDefault: false
			}
		];
		
		saveProfiles(profiles);
		
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			'firingProfiles',
			JSON.stringify(profiles)
		);
	});
});

describe('saveCurrentSchedule', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('saves current schedule to localStorage', () => {
		const segments: FiringSegment[] = [
			{ id: 1, type: 'ramp', rate: 100, targetTemp: 500 }
		];
		
		saveCurrentSchedule(20, segments, 'profile123');
		
		const expectedData = {
			startTemp: 20,
			segments,
			currentProfileId: 'profile123'
		};
		
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			'currentSchedule',
			JSON.stringify(expectedData)
		);
	});

	it('saves schedule without profileId', () => {
		const segments: FiringSegment[] = [];
		
		saveCurrentSchedule(25, segments);
		
		const expectedData = {
			startTemp: 25,
			segments,
			currentProfileId: undefined
		};
		
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			'currentSchedule',
			JSON.stringify(expectedData)
		);
	});
});

describe('loadCurrentSchedule', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('returns null when no schedule is stored', () => {
		const result = loadCurrentSchedule();
		expect(result).toBeNull();
		expect(localStorageMock.getItem).toHaveBeenCalledWith('currentSchedule');
	});

	it('loads stored schedule', () => {
		const schedule = {
			startTemp: 30,
			segments: [{ id: 1, type: 'hold', holdTime: 15 }],
			currentProfileId: 'abc123'
		};
		
		localStorageMock.setItem('currentSchedule', JSON.stringify(schedule));
		
		const result = loadCurrentSchedule();
		expect(result).toEqual(schedule);
	});

	it('returns null for invalid JSON', () => {
		localStorageMock.setItem('currentSchedule', 'invalid json');
		
		const result = loadCurrentSchedule();
		expect(result).toBeNull();
	});

	it('handles empty stored value', () => {
		localStorageMock.setItem('currentSchedule', '');
		
		const result = loadCurrentSchedule();
		expect(result).toBeNull();
	});
});