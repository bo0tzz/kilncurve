export function throttle<T extends any[]>(
	func: (...args: T) => void, 
	limit: number
): (...args: T) => void {
	let inThrottle: boolean;
	return function (this: any, ...args: T) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

export function debounce<T extends any[]>(
	func: (...args: T) => void,
	wait: number,
	immediate = false
): (...args: T) => void {
	let timeout: NodeJS.Timeout | null = null;
	return function (this: any, ...args: T) {
		const callNow = immediate && !timeout;
		clearTimeout(timeout!);
		timeout = setTimeout(() => {
			timeout = null;
			if (!immediate) func.apply(this, args);
		}, wait);
		if (callNow) func.apply(this, args);
	};
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function roundToDecimals(value: number, decimals: number): number {
	return Number(value.toFixed(decimals));
}