export type SegmentType = 'ramp' | 'hold' | 'cooldown';

export interface FiringSegment {
	id: number;
	type: SegmentType;
	rate?: number; // degrees C per hour (for ramp segments)
	targetTemp?: number; // degrees C (for ramp segments)
	holdTime?: number; // minutes (for hold segments)
	// Cooldown segment properties
	coolingCoefficient?: number; // k value for Newton's Law of Cooling
	kilnPreset?: string; // ID of selected kiln preset
	coolingSpeed?: 'slow' | 'normal' | 'fast'; // User-friendly speed selector
	ambientTemp?: number; // Ambient temperature in °C (default 20)
	stopTemp?: number; // Stop modeling at this temperature (default 50)
}

export interface FiringProfile {
	id: string;
	name: string;
	description: string;
	startTemp: number;
	segments: FiringSegment[];
	isDefault?: boolean;
}

export interface CurvePoint {
	time: number;
	temp: number;
}

export interface HoverPoint {
	x: number;
	y: number;
	svgX: number;
	svgY: number;
	time: number;
	temp: number;
}