import type { FiringSegment, CurvePoint } from './types.js';
import { getCoolingCoefficient } from './kiln-presets.js';

export function calculateCurveData(segments: FiringSegment[], startTemp: number): CurvePoint[] {
	// Validate inputs
	if (!Array.isArray(segments)) {
		throw new Error('Segments must be an array');
	}
	
	if (typeof startTemp !== 'number' || isNaN(startTemp)) {
		throw new Error('Start temperature must be a valid number');
	}
	
	if (startTemp < 0 || startTemp > 50) {
		throw new Error('Start temperature must be between 0°C and 50°C');
	}

	const points: CurvePoint[] = [];
	let currentTime = 0;
	let currentTemp = startTemp;

	points.push({ time: 0, temp: currentTemp });

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		
		if (!segment || typeof segment !== 'object') {
			throw new Error(`Invalid segment at index ${i}`);
		}
		
		if (segment.type === 'ramp' && segment.rate && segment.targetTemp !== undefined) {
			if (typeof segment.rate !== 'number' || segment.rate <= 0 || segment.rate > 1000) {
				throw new Error(`Invalid ramp rate at segment ${i + 1}: ${segment.rate}`);
			}
			
			if (typeof segment.targetTemp !== 'number' || segment.targetTemp < 0 || segment.targetTemp > 1400) {
				throw new Error(`Invalid target temperature at segment ${i + 1}: ${segment.targetTemp}`);
			}
			
			const tempDifference = segment.targetTemp - currentTemp;
			const timeToTarget = Math.abs(tempDifference) / segment.rate;

			if (!isFinite(timeToTarget)) {
				throw new Error(`Invalid time calculation at segment ${i + 1}`);
			}

			currentTime += timeToTarget;
			currentTemp = segment.targetTemp;
			
			points.push({ 
				time: currentTime, 
				temp: currentTemp
			});
			
		} else if (segment.type === 'hold' && segment.holdTime) {
			if (typeof segment.holdTime !== 'number' || segment.holdTime < 0 || segment.holdTime > 600) {
				throw new Error(`Invalid hold time at segment ${i + 1}: ${segment.holdTime}`);
			}
			
			currentTime += segment.holdTime / 60;
			
			if (!isFinite(currentTime)) {
				throw new Error(`Invalid time calculation at segment ${i + 1}`);
			}
			
			points.push({ time: currentTime, temp: currentTemp });
		} else if (segment.type === 'cooldown') {
			// Natural cooling using Newton's Law of Cooling
			const ambientTemp = segment.ambientTemp ?? 20;
			const stopTemp = segment.stopTemp ?? 50;
			
			// Get cooling coefficient - custom value takes precedence
			const k = getCoolingCoefficient(
				segment.kilnPreset || 'small-hobby-brick-thin',
				segment.coolingSpeed,
				segment.coolingCoefficient
			);
			
			// Validate cooling parameters
			if (k <= 0 || k > 1) {
				throw new Error(`Invalid cooling coefficient at segment ${i + 1}: ${k}`);
			}
			
			if (stopTemp < 0 || stopTemp > currentTemp) {
				throw new Error(`Invalid stop temperature at segment ${i + 1}: ${stopTemp}`);
			}
			
			// Calculate cooling curve points
			const coolingPoints = calculateCoolingCurve(
				currentTemp,
				ambientTemp,
				stopTemp,
				k,
				currentTime
			);
			
			// Add all cooling points except the first (which duplicates current position)
			for (let j = 1; j < coolingPoints.length; j++) {
				points.push(coolingPoints[j]);
				currentTime = coolingPoints[j].time;
			}
			
			currentTemp = stopTemp;
		}
		
		// Safety check for excessive firing time (extended to 72 hours to accommodate cooldown)
		if (currentTime > 72) {
			throw new Error('Firing schedule exceeds 72 hours - please review your segments');
		}
	}

	return points;
}

function calculateCoolingCurve(
	startTemp: number,
	ambientTemp: number,
	stopTemp: number,
	k: number,
	startTime: number
): CurvePoint[] {
	const points: CurvePoint[] = [];
	// Use larger time step for fewer points - 30 minutes instead of 6 minutes
	const timeStep = 0.5; // hours (30 minutes)
	
	let currentTemp = startTemp;
	let currentTime = startTime;
	
	// Add initial point
	points.push({ time: currentTime, temp: currentTemp });
	
	// Calculate cooling using Newton's Law: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)
	while (currentTemp > stopTemp) {
		const tempDiff = currentTemp - ambientTemp;
		currentTemp = ambientTemp + tempDiff * Math.exp(-k * timeStep);
		currentTime += timeStep;
		
		// Add point every time step
		points.push({ time: currentTime, temp: currentTemp });
		
		// Safety check to prevent infinite loops
		if (currentTime - startTime > 48) {
			// If cooling takes more than 48 hours, stop here
			// Don't force to stopTemp as that creates an artificial drop
			break;
		}
	}
	
	// Only adjust to stopTemp if we're very close (within 1 degree)
	// This prevents artificial vertical drops
	if (points.length > 0) {
		const lastPoint = points[points.length - 1];
		if (Math.abs(lastPoint.temp - stopTemp) < 1) {
			lastPoint.temp = stopTemp;
		}
	}
	
	return points;
}

export function getInterpolatedPoint(
	curveData: CurvePoint[], 
	hoverTime: number
): { temp: number; time: number } {
	try {
		// Validate inputs
		if (!Array.isArray(curveData)) {
			throw new Error('Curve data must be an array');
		}
		
		if (typeof hoverTime !== 'number' || !isFinite(hoverTime) || hoverTime < 0) {
			throw new Error('Hover time must be a valid positive number');
		}

		if (curveData.length === 0) {
			return { temp: 0, time: hoverTime };
		}

		// Validate curve data points
		for (let i = 0; i < curveData.length; i++) {
			const point = curveData[i];
			if (!point || typeof point.time !== 'number' || typeof point.temp !== 'number') {
				throw new Error(`Invalid curve data at index ${i}`);
			}
			if (!isFinite(point.time) || !isFinite(point.temp)) {
				throw new Error(`Non-finite values in curve data at index ${i}`);
			}
		}

		// Find the two points that bracket this time for interpolation
		let leftPoint = curveData[0];
		let rightPoint = curveData[curveData.length - 1];
		
		for (let i = 0; i < curveData.length - 1; i++) {
			if (curveData[i].time <= hoverTime && curveData[i + 1].time >= hoverTime) {
				leftPoint = curveData[i];
				rightPoint = curveData[i + 1];
				break;
			}
		}
		
		// Interpolate temperature at the exact hover time
		let interpolatedTemp;
		if (leftPoint.time === rightPoint.time) {
			// Same time, use the temperature
			interpolatedTemp = leftPoint.temp;
		} else {
			// Linear interpolation between the two points
			const timeDiff = rightPoint.time - leftPoint.time;
			if (timeDiff === 0) {
				interpolatedTemp = leftPoint.temp;
			} else {
				const ratio = (hoverTime - leftPoint.time) / timeDiff;
				interpolatedTemp = leftPoint.temp + (rightPoint.temp - leftPoint.temp) * ratio;
			}
		}

		// Validate result
		if (!isFinite(interpolatedTemp)) {
			throw new Error('Interpolation resulted in non-finite temperature');
		}

		return { temp: interpolatedTemp, time: hoverTime };
	} catch (error) {
		console.error('Error in getInterpolatedPoint:', error);
		// Return a safe fallback
		return { temp: 0, time: Math.max(0, hoverTime || 0) };
	}
}