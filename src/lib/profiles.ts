import type { FiringProfile } from './types.js';

export const defaultProfiles: FiringProfile[] = [
	{
		id: 'bisque',
		name: 'Standard Bisque',
		description: 'Simple bisque firing - 950°C',
		startTemp: 20,
		segments: [
			{ id: 1, type: 'ramp', rate: 120, targetTemp: 950 },
			{ id: 2, type: 'hold', holdTime: 10 }
		],
		isDefault: true
	},
	{
		id: 'glaze-cone6',
		name: 'Cone 6 Glaze',
		description: 'Standard cone 6 glaze firing - 1200°C',
		startTemp: 20,
		segments: [
			{ id: 1, type: 'ramp', rate: 100, targetTemp: 1200 },
			{ id: 2, type: 'hold', holdTime: 5 }
		],
		isDefault: true
	},
	{
		id: 'glaze-cone6-slow',
		name: 'Cone 6 Drop & Hold',
		description: 'Drop-and-hold schedule for defect reduction',
		startTemp: 20,
		segments: [
			{ id: 1, type: 'ramp', rate: 100, targetTemp: 1200 },
			{ id: 2, type: 'hold', holdTime: 5 },
			{ id: 3, type: 'ramp', rate: 50, targetTemp: 1150 },
			{ id: 4, type: 'hold', holdTime: 30 }
		],
		isDefault: true
	},
	{
		id: 'glaze-cone10',
		name: 'Cone 10 Glaze',
		description: 'High-fire glaze firing - 1300°C',
		startTemp: 20,
		segments: [
			{ id: 1, type: 'ramp', rate: 80, targetTemp: 1300 },
			{ id: 2, type: 'hold', holdTime: 15 }
		],
		isDefault: true
	}
];