/**
 * Application configuration constants
 * Centralizes all hardcoded values for easier maintenance and customization
 */

// Temperature limits (°C)
export const TEMPERATURE_LIMITS = {
	START_TEMP_MIN: 0,
	START_TEMP_MAX: 50,
	START_TEMP_DEFAULT: 20,
	TARGET_TEMP_MIN: 0,
	TARGET_TEMP_MAX: 1400,
} as const;

// Rate limits (°C/hour)
export const RATE_LIMITS = {
	MIN: 1,
	MAX: 1000,
	DEFAULT_RAMP: 100,
	DEFAULT_BISQUE: 120,
	DEFAULT_HIGH_FIRE: 80,
} as const;

// Time limits
export const TIME_LIMITS = {
	HOLD_TIME_MIN: 0,          // minutes
	HOLD_TIME_MAX: 600,        // minutes (10 hours)
	DEFAULT_HOLD: 30,          // minutes
	MAX_FIRING_HOURS: 48,      // hours
	MINUTES_PER_HOUR: 60,
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
	PROFILE_NAME_MAX_LENGTH: 100,
	PROFILE_DESCRIPTION_MAX_LENGTH: 500,
} as const;

// Chart dimensions (SVG units)
export const CHART_DIMENSIONS = {
	SVG_WIDTH: 800,
	SVG_HEIGHT: 500,
	CHART_LEFT: 80,
	CHART_RIGHT: 720,
	CHART_TOP: 80,
	CHART_BOTTOM: 420,
	GRID_SPACING_HORIZONTAL: 80,
	GRID_SPACING_VERTICAL: 40,
} as const;

// Derived chart dimensions
export const CHART_AREA = {
	WIDTH: CHART_DIMENSIONS.CHART_RIGHT - CHART_DIMENSIONS.CHART_LEFT,     // 640
	HEIGHT: CHART_DIMENSIONS.CHART_BOTTOM - CHART_DIMENSIONS.CHART_TOP,    // 340
} as const;

// UI constants
export const UI_CONSTANTS = {
	TOOLTIP_WIDTH: 110,
	TOOLTIP_OFFSET_Y: 35,
	TOOLTIP_OFFSET_X: 10,
	TOOLTIP_EDGE_THRESHOLD: 0.75,     // Right edge threshold
	TOOLTIP_LEFT_THRESHOLD: 0.25,     // Left edge threshold
	MIN_CHART_HEIGHT: 300,            // px
	MIN_CHART_HEIGHT_LG: 400,         // px
	THROTTLE_MOUSE_MOVE: 16,          // ms (~60fps)
} as const;

// Notification settings
export const NOTIFICATION_SETTINGS = {
	DEFAULT_DURATION: 5000,           // ms
	AUTO_DISMISS_DELAY: 5000,         // ms
} as const;

// Default firing profiles data
export const DEFAULT_PROFILES = {
	BISQUE: {
		TEMP: 950,
		RATE: 120,
		HOLD: 10,
	},
	CONE_6_GLAZE: {
		TEMP: 1200,
		RATE: 100,
	},
	CONE_10_GLAZE: {
		TEMP: 1300,
		RATE: 80,
		HOLD: 15,
	},
} as const;

// Chart styling
export const CHART_STYLING = {
	POINT_RADIUS: 6,
	HOVER_POINT_RADIUS: 8,
	LINE_WIDTH: 4,
	AXIS_LINE_WIDTH: 3,
	GRID_LINE_WIDTH: 1,
	GRID_OPACITY: 0.2,
	HOVER_POINT_OPACITY: 0.8,
} as const;