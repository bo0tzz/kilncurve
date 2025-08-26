import type { FiringProfile, FiringSegment, SegmentType } from './types.js';

export function isSegmentType(value: any): value is SegmentType {
	return value === 'ramp' || value === 'hold';
}

export function isValidFiringSegment(obj: any): obj is FiringSegment {
	if (!obj || typeof obj !== 'object') return false;
	
	// Check required fields
	if (typeof obj.id !== 'number' || !isSegmentType(obj.type)) return false;
	
	// Validate segment-specific fields
	if (obj.type === 'ramp') {
		if (typeof obj.rate !== 'number' || obj.rate <= 0 || obj.rate > 1000) return false;
		if (typeof obj.targetTemp !== 'number' || obj.targetTemp < 0 || obj.targetTemp > 1400) return false;
	} else if (obj.type === 'hold') {
		if (typeof obj.holdTime !== 'number' || obj.holdTime < 0 || obj.holdTime > 600) return false;
	}
	
	return true;
}

export function isValidFiringProfile(obj: any): obj is FiringProfile {
	if (!obj || typeof obj !== 'object') return false;
	
	// Check required fields
	if (typeof obj.id !== 'string' || obj.id.length === 0) return false;
	if (typeof obj.name !== 'string' || obj.name.length === 0) return false;
	if (typeof obj.description !== 'string') return false;
	if (typeof obj.startTemp !== 'number' || obj.startTemp < 0 || obj.startTemp > 50) return false;
	
	// Check segments array
	if (!Array.isArray(obj.segments)) return false;
	if (!obj.segments.every(isValidFiringSegment)) return false;
	
	// Check optional fields
	if (obj.isDefault !== undefined && typeof obj.isDefault !== 'boolean') return false;
	
	return true;
}

export function isValidFiringProfileArray(obj: any): obj is FiringProfile[] {
	return Array.isArray(obj) && obj.every(isValidFiringProfile);
}

export interface SavedSchedule {
	startTemp: number;
	segments: FiringSegment[];
	currentProfileId?: string;
}

export function isValidSavedSchedule(obj: any): obj is SavedSchedule {
	if (!obj || typeof obj !== 'object') return false;
	
	// Check required fields
	if (typeof obj.startTemp !== 'number' || obj.startTemp < 0 || obj.startTemp > 50) return false;
	if (!Array.isArray(obj.segments) || !obj.segments.every(isValidFiringSegment)) return false;
	
	// Check optional field
	if (obj.currentProfileId !== undefined && typeof obj.currentProfileId !== 'string') return false;
	
	return true;
}

export function sanitizeFiringProfile(obj: any): FiringProfile | null {
	if (!isValidFiringProfile(obj)) return null;
	
	// Return a cleaned copy
	return {
		id: obj.id,
		name: obj.name.trim(),
		description: obj.description.trim(),
		startTemp: Math.max(0, Math.min(50, obj.startTemp)),
		segments: obj.segments.map(segment => {
			if (segment.type === 'ramp') {
				return {
					id: segment.id,
					type: segment.type,
					rate: Math.max(1, Math.min(1000, segment.rate!)),
					targetTemp: Math.max(0, Math.min(1400, segment.targetTemp!))
				};
			} else {
				return {
					id: segment.id,
					type: segment.type,
					holdTime: Math.max(0, Math.min(600, segment.holdTime!))
				};
			}
		}),
		isDefault: Boolean(obj.isDefault)
	};
}