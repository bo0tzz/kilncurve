export interface KilnPreset {
	id: string;
	name: string;
	description: string;
	defaultK: number;
	kRange: [number, number];
}

// Actual cooling rate from user's kiln: 25L, 75mm soft brick
// Fired to 1200°C at 18:30, cooled to 40°C by 08:00 (13.5 hours)
// Calculated k ≈ 0.26 (faster than initially estimated)
// This real-world data informed the adjustment of our ranges upward

export const KILN_PRESETS: KilnPreset[] = [
	{
		id: 'tiny-test',
		name: 'Tiny/Test Kiln (< 25L)',
		description: 'Mini test kiln, 65-75mm soft brick',
		defaultK: 0.20,
		kRange: [0.17, 0.25]
	},
	{
		id: 'small-hobby-brick-thin',
		name: 'Small Hobby - Thin Brick (25-50L)',
		description: '65-75mm soft insulating brick',
		defaultK: 0.22,
		kRange: [0.17, 0.26]
	},
	{
		id: 'small-hobby-brick-thick',
		name: 'Small Hobby - Thick Brick (25-50L)',
		description: '100mm soft insulating brick',
		defaultK: 0.16,
		kRange: [0.12, 0.20]
	},
	{
		id: 'small-hobby-fiber',
		name: 'Small Hobby - Fiber (25-50L)',
		description: '50mm ceramic fiber insulation',
		defaultK: 0.24,
		kRange: [0.20, 0.30]
	},
	{
		id: 'medium-hobby',
		name: 'Medium Hobby (50-100L)',
		description: '75-100mm soft brick, typical home studio',
		defaultK: 0.14,
		kRange: [0.10, 0.18]
	},
	{
		id: 'studio-kiln',
		name: 'Studio Kiln (100-200L)',
		description: '100-115mm brick, shared studio size',
		defaultK: 0.10,
		kRange: [0.07, 0.14]
	},
	{
		id: 'large-studio',
		name: 'Large Studio (200-400L)',
		description: '115mm+ brick, production/institutional',
		defaultK: 0.08,
		kRange: [0.05, 0.11]
	},
	{
		id: 'gas-reduction',
		name: 'Gas Reduction Kiln',
		description: 'Hard brick construction, slower cooling',
		defaultK: 0.06,
		kRange: [0.04, 0.09]
	},
	{
		id: 'raku-kiln',
		name: 'Raku Kiln',
		description: 'Fiber blanket, very fast cooling',
		defaultK: 0.35,
		kRange: [0.30, 0.45]
	}
];

export function getAllKilns(): KilnPreset[] {
	// Get custom kilns from localStorage
	if (typeof window !== 'undefined') {
		const customKilns = JSON.parse(localStorage.getItem('customKilns') || '[]');
		return [...KILN_PRESETS, ...customKilns];
	}
	return KILN_PRESETS;
}

export function getKilnPreset(id: string): KilnPreset | undefined {
	return getAllKilns().find(preset => preset.id === id);
}

export function getCoolingCoefficient(
	presetId: string,
	coolingSpeed?: 'slow' | 'normal' | 'fast',
	customCoefficient?: number
): number {
	// If custom coefficient is provided, use it
	if (customCoefficient !== undefined && customCoefficient > 0) {
		return customCoefficient;
	}
	
	const preset = getKilnPreset(presetId);
	if (!preset) return 0.15; // Default fallback

	const [min, max] = preset.kRange;
	
	switch (coolingSpeed) {
		case 'slow':
			return min;
		case 'fast':
			return max;
		case 'normal':
		default:
			return preset.defaultK;
	}
}