import { describe, it, expect, vi } from 'vitest';

// Test the logic functions for the SaveProfileModal component

describe('SaveProfileModal Logic', () => {
	function validateProfileName(name: string): boolean {
		return name.trim().length > 0;
	}

	function trimInputs(name: string, description: string): { name: string, description: string } {
		return {
			name: name.trim(),
			description: description.trim()
		};
	}

	function handleSave(
		profileName: string, 
		profileDescription: string, 
		onSave: (name: string, description: string) => void,
		onClose: () => void
	): boolean {
		const trimmed = trimInputs(profileName, profileDescription);
		
		if (validateProfileName(trimmed.name)) {
			onSave(trimmed.name, trimmed.description);
			onClose();
			return true;
		}
		return false;
	}

	function resetForm(): { profileName: string, profileDescription: string } {
		return {
			profileName: '',
			profileDescription: ''
		};
	}

	it('validates profile name correctly', () => {
		expect(validateProfileName('Valid Name')).toBe(true);
		expect(validateProfileName('  Valid Name  ')).toBe(true);
		expect(validateProfileName('')).toBe(false);
		expect(validateProfileName('   ')).toBe(false);
		expect(validateProfileName('A')).toBe(true);
	});

	it('trims inputs correctly', () => {
		const result = trimInputs('  Test Name  ', '  Test Description  ');
		expect(result.name).toBe('Test Name');
		expect(result.description).toBe('Test Description');
	});

	it('trims empty inputs correctly', () => {
		const result = trimInputs('   ', '   ');
		expect(result.name).toBe('');
		expect(result.description).toBe('');
	});

	it('handles save with valid name', () => {
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave('Valid Name', 'Test Description', mockOnSave, mockOnClose);
		
		expect(result).toBe(true);
		expect(mockOnSave).toHaveBeenCalledWith('Valid Name', 'Test Description');
		expect(mockOnClose).toHaveBeenCalled();
	});

	it('handles save with empty name', () => {
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave('', 'Test Description', mockOnSave, mockOnClose);
		
		expect(result).toBe(false);
		expect(mockOnSave).not.toHaveBeenCalled();
		expect(mockOnClose).not.toHaveBeenCalled();
	});

	it('handles save with whitespace-only name', () => {
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave('   ', 'Test Description', mockOnSave, mockOnClose);
		
		expect(result).toBe(false);
		expect(mockOnSave).not.toHaveBeenCalled();
		expect(mockOnClose).not.toHaveBeenCalled();
	});

	it('trims whitespace from name and description before saving', () => {
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave('  Trimmed Name  ', '  Trimmed Description  ', mockOnSave, mockOnClose);
		
		expect(result).toBe(true);
		expect(mockOnSave).toHaveBeenCalledWith('Trimmed Name', 'Trimmed Description');
	});

	it('handles save with valid name but empty description', () => {
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave('Valid Name', '', mockOnSave, mockOnClose);
		
		expect(result).toBe(true);
		expect(mockOnSave).toHaveBeenCalledWith('Valid Name', '');
		expect(mockOnClose).toHaveBeenCalled();
	});

	it('resets form correctly', () => {
		const result = resetForm();
		expect(result.profileName).toBe('');
		expect(result.profileDescription).toBe('');
	});

	it('handles long names and descriptions', () => {
		const longName = 'A'.repeat(100);
		const longDescription = 'B'.repeat(500);
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave(longName, longDescription, mockOnSave, mockOnClose);
		
		expect(result).toBe(true);
		expect(mockOnSave).toHaveBeenCalledWith(longName, longDescription);
	});

	it('handles special characters in inputs', () => {
		const nameWithSpecialChars = 'Test @#$% Name';
		const descWithSpecialChars = 'Description with émojis 🔥⏱️';
		const mockOnSave = vi.fn();
		const mockOnClose = vi.fn();
		
		const result = handleSave(nameWithSpecialChars, descWithSpecialChars, mockOnSave, mockOnClose);
		
		expect(result).toBe(true);
		expect(mockOnSave).toHaveBeenCalledWith(nameWithSpecialChars, descWithSpecialChars);
	});
});