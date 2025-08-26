import type { FiringProfile, FiringSegment } from './types.js';
import { defaultProfiles } from './profiles.js';
import { isValidFiringProfileArray, isValidSavedSchedule, sanitizeFiringProfile, type SavedSchedule } from './schema.js';
import { addNotification } from './stores/notifications.js';

export function loadProfiles(): FiringProfile[] {
	try {
		const stored = localStorage.getItem('firingProfiles');
		if (stored) {
			const parsed = JSON.parse(stored);
			if (isValidFiringProfileArray(parsed)) {
				// Sanitize all profiles to ensure data integrity
				const sanitized = parsed.map(sanitizeFiringProfile).filter(Boolean) as FiringProfile[];
				if (sanitized.length > 0) {
					return sanitized;
				}
			}
			// If validation fails, fall through to default
			console.warn('Invalid profiles data in localStorage, falling back to defaults');
			addNotification('Saved firing profiles were corrupted and have been reset to defaults', 'warning');
		}
	} catch (error) {
		console.warn('Failed to parse profiles from localStorage:', error);
		addNotification('Failed to load saved firing profiles. Using defaults instead.', 'error');
	}
	
	// Return defaults and save them
	const profiles = [...defaultProfiles];
	saveProfiles(profiles);
	return profiles;
}

export function saveProfiles(profiles: FiringProfile[]): void {
	try {
		// Validate profiles before saving
		if (isValidFiringProfileArray(profiles)) {
			localStorage.setItem('firingProfiles', JSON.stringify(profiles));
		} else {
			console.error('Attempted to save invalid profiles data');
			addNotification('Failed to save firing profiles: Invalid data detected', 'error');
		}
	} catch (error) {
		console.error('Failed to save profiles to localStorage:', error);
		addNotification('Failed to save firing profiles to storage', 'error');
	}
}

export function saveCurrentSchedule(
	startTemp: number, 
	segments: FiringSegment[], 
	currentProfileId?: string
): void {
	const currentSchedule: SavedSchedule = {
		startTemp,
		segments,
		currentProfileId
	};
	
	try {
		if (isValidSavedSchedule(currentSchedule)) {
			localStorage.setItem('currentSchedule', JSON.stringify(currentSchedule));
		} else {
			console.error('Attempted to save invalid schedule data');
			addNotification('Failed to save current schedule: Invalid data', 'error');
		}
	} catch (error) {
		console.error('Failed to save current schedule to localStorage:', error);
		addNotification('Failed to save current schedule to storage', 'error');
	}
}

export function loadCurrentSchedule(): SavedSchedule | null {
	const stored = localStorage.getItem('currentSchedule');
	
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			if (isValidSavedSchedule(parsed)) {
				return parsed;
			} else {
				console.warn('Invalid current schedule data in localStorage, ignoring');
				addNotification('Saved schedule data was corrupted and has been cleared', 'warning');
				// Clear invalid data
				localStorage.removeItem('currentSchedule');
				return null;
			}
		} catch (error) {
			console.warn('Failed to parse current schedule from localStorage:', error);
			addNotification('Failed to load saved schedule data', 'error');
			// Clear corrupted data
			localStorage.removeItem('currentSchedule');
			return null;
		}
	}
	return null;
}