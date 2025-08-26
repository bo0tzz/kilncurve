import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	onNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	},
	navigating: {
		subscribe: vi.fn()
	},
	updated: {
		subscribe: vi.fn()
	}
}));

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Reset localStorage before each test
beforeEach(() => {
	localStorageMock.clear();
	vi.clearAllMocks();
});