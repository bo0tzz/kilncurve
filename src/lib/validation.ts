import { TEMPERATURE_LIMITS, RATE_LIMITS, TIME_LIMITS, VALIDATION_LIMITS } from './config.js';

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

export interface FieldValidation {
	value: string | number;
	isValid: boolean;
	error?: string;
}

export function validateTemperature(temp: number, min: number = TEMPERATURE_LIMITS.TARGET_TEMP_MIN, max: number = TEMPERATURE_LIMITS.TARGET_TEMP_MAX): ValidationResult {
	if (isNaN(temp)) {
		return { isValid: false, error: 'Temperature must be a valid number' };
	}
	if (temp < min) {
		return { isValid: false, error: `Temperature must be at least ${min}°C` };
	}
	if (temp > max) {
		return { isValid: false, error: `Temperature must be no more than ${max}°C` };
	}
	return { isValid: true };
}

export function validateRate(rate: number, min = RATE_LIMITS.MIN, max = RATE_LIMITS.MAX): ValidationResult {
	if (isNaN(rate)) {
		return { isValid: false, error: 'Rate must be a valid number' };
	}
	if (rate <= 0) {
		return { isValid: false, error: 'Rate must be positive' };
	}
	if (rate < min) {
		return { isValid: false, error: `Rate must be at least ${min}°C/h` };
	}
	if (rate > max) {
		return { isValid: false, error: `Rate must be no more than ${max}°C/h` };
	}
	return { isValid: true };
}

export function validateHoldTime(time: number, min = TIME_LIMITS.HOLD_TIME_MIN, max = TIME_LIMITS.HOLD_TIME_MAX): ValidationResult {
	if (isNaN(time)) {
		return { isValid: false, error: 'Hold time must be a valid number' };
	}
	if (time < min) {
		return { isValid: false, error: `Hold time must be at least ${min} minutes` };
	}
	if (time > max) {
		return { isValid: false, error: `Hold time must be no more than ${max} minutes` };
	}
	return { isValid: true };
}

export function validateProfileName(name: string): ValidationResult {
	const trimmed = name.trim();
	if (trimmed.length === 0) {
		return { isValid: false, error: 'Profile name is required' };
	}
	if (trimmed.length > VALIDATION_LIMITS.PROFILE_NAME_MAX_LENGTH) {
		return { isValid: false, error: `Profile name must be ${VALIDATION_LIMITS.PROFILE_NAME_MAX_LENGTH} characters or less` };
	}
	return { isValid: true };
}

export function validateProfileDescription(description: string): ValidationResult {
	if (description.length > VALIDATION_LIMITS.PROFILE_DESCRIPTION_MAX_LENGTH) {
		return { isValid: false, error: `Description must be ${VALIDATION_LIMITS.PROFILE_DESCRIPTION_MAX_LENGTH} characters or less` };
	}
	return { isValid: true };
}

export function validateStartTemp(temp: number): ValidationResult {
	return validateTemperature(temp, TEMPERATURE_LIMITS.START_TEMP_MIN, TEMPERATURE_LIMITS.START_TEMP_MAX);
}