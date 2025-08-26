export type SegmentType = 'ramp' | 'hold';

export interface FiringSegment {
	id: number;
	type: SegmentType;
	rate?: number; // degrees C per hour (for ramp segments)
	targetTemp?: number; // degrees C (for ramp segments)
	holdTime?: number; // minutes (for hold segments)
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