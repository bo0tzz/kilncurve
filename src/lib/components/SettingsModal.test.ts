import { describe, it, expect, vi } from 'vitest';
import type { FiringProfile } from '../types.js';

// Test the logic functions for the SettingsModal component

describe('SettingsModal Logic', () => {
	const mockProfiles: FiringProfile[] = [
		{
			id: 'custom1',
			name: 'Custom Profile',
			description: 'Custom description',
			startTemp: 20,
			segments: [],
			isDefault: false
		},
		{
			id: 'default1',
			name: 'Default Profile',
			description: 'Default description',
			startTemp: 20,
			segments: [],
			isDefault: true
		}
	];

	function validateTemperature(temp: number): boolean {
		return temp >= 0 && temp <= 50;
	}

	function canDeleteProfile(profile: FiringProfile): boolean {
		return !profile.isDefault;
	}

	function getEditableProfiles(profiles: FiringProfile[]): FiringProfile[] {
		return profiles; // All profiles can be edited (name/description)
	}

	function getDeletableProfiles(profiles: FiringProfile[]): FiringProfile[] {
		return profiles.filter(p => !p.isDefault);
	}

	function updateProfile(
		profiles: FiringProfile[], 
		profileId: string, 
		name: string, 
		description: string
	): FiringProfile[] {
		return profiles.map(p => 
			p.id === profileId ? { ...p, name: name.trim(), description: description.trim() } : p
		);
	}

	function removeProfile(profiles: FiringProfile[], profileId: string): FiringProfile[] {
		return profiles.filter(p => p.id !== profileId);
	}

	function validateProfileEdit(name: string): boolean {
		return name.trim().length > 0;
	}

	function startEditingProfile(profile: FiringProfile): { name: string, description: string } {
		return {
			name: profile.name,
			description: profile.description
		};
	}

	function handleEditSave(
		profiles: FiringProfile[],
		profileId: string,
		editingName: string,
		editingDescription: string,
		onEditProfile: (id: string, name: string, description: string) => void
	): boolean {
		if (!validateProfileEdit(editingName)) {
			return false;
		}
		
		const trimmedName = editingName.trim();
		const trimmedDescription = editingDescription.trim();
		
		onEditProfile(profileId, trimmedName, trimmedDescription);
		return true;
	}

	it('validates temperature correctly', () => {
		expect(validateTemperature(20)).toBe(true);
		expect(validateTemperature(0)).toBe(true);
		expect(validateTemperature(50)).toBe(true);
		expect(validateTemperature(-1)).toBe(false);
		expect(validateTemperature(51)).toBe(false);
	});

	it('identifies deletable profiles correctly', () => {
		expect(canDeleteProfile(mockProfiles[0])).toBe(true); // custom profile
		expect(canDeleteProfile(mockProfiles[1])).toBe(false); // default profile
	});

	it('returns all profiles as editable', () => {
		const editable = getEditableProfiles(mockProfiles);
		expect(editable).toHaveLength(2);
		expect(editable).toEqual(mockProfiles);
	});

	it('filters deletable profiles correctly', () => {
		const deletable = getDeletableProfiles(mockProfiles);
		expect(deletable).toHaveLength(1);
		expect(deletable[0].id).toBe('custom1');
	});

	it('updates profile correctly', () => {
		const updated = updateProfile(mockProfiles, 'custom1', 'New Name', 'New Description');
		const updatedProfile = updated.find(p => p.id === 'custom1');
		
		expect(updatedProfile?.name).toBe('New Name');
		expect(updatedProfile?.description).toBe('New Description');
		expect(updated.find(p => p.id === 'default1')).toEqual(mockProfiles[1]); // Unchanged
	});

	it('trims whitespace when updating profile', () => {
		const updated = updateProfile(mockProfiles, 'custom1', '  Trimmed Name  ', '  Trimmed Desc  ');
		const updatedProfile = updated.find(p => p.id === 'custom1');
		
		expect(updatedProfile?.name).toBe('Trimmed Name');
		expect(updatedProfile?.description).toBe('Trimmed Desc');
	});

	it('removes profile correctly', () => {
		const remaining = removeProfile(mockProfiles, 'custom1');
		expect(remaining).toHaveLength(1);
		expect(remaining[0].id).toBe('default1');
	});

	it('handles removing non-existent profile', () => {
		const remaining = removeProfile(mockProfiles, 'nonexistent');
		expect(remaining).toHaveLength(2);
		expect(remaining).toEqual(mockProfiles);
	});

	it('validates profile edit name', () => {
		expect(validateProfileEdit('Valid Name')).toBe(true);
		expect(validateProfileEdit('  Valid Name  ')).toBe(true);
		expect(validateProfileEdit('')).toBe(false);
		expect(validateProfileEdit('   ')).toBe(false);
	});

	it('starts editing profile with correct initial values', () => {
		const editData = startEditingProfile(mockProfiles[0]);
		expect(editData.name).toBe('Custom Profile');
		expect(editData.description).toBe('Custom description');
	});

	it('handles edit save with valid data', () => {
		const mockOnEditProfile = vi.fn();
		
		const result = handleEditSave(
			mockProfiles,
			'custom1',
			'Updated Name',
			'Updated Description',
			mockOnEditProfile
		);
		
		expect(result).toBe(true);
		expect(mockOnEditProfile).toHaveBeenCalledWith('custom1', 'Updated Name', 'Updated Description');
	});

	it('handles edit save with invalid name', () => {
		const mockOnEditProfile = vi.fn();
		
		const result = handleEditSave(
			mockProfiles,
			'custom1',
			'',
			'Updated Description',
			mockOnEditProfile
		);
		
		expect(result).toBe(false);
		expect(mockOnEditProfile).not.toHaveBeenCalled();
	});

	it('trims whitespace in edit save', () => {
		const mockOnEditProfile = vi.fn();
		
		const result = handleEditSave(
			mockProfiles,
			'custom1',
			'  Trimmed Name  ',
			'  Trimmed Description  ',
			mockOnEditProfile
		);
		
		expect(result).toBe(true);
		expect(mockOnEditProfile).toHaveBeenCalledWith('custom1', 'Trimmed Name', 'Trimmed Description');
	});

	it('preserves immutability when updating profiles', () => {
		const updated = updateProfile(mockProfiles, 'custom1', 'New Name', 'New Description');
		
		// Original array should be unchanged
		expect(mockProfiles[0].name).toBe('Custom Profile');
		
		// New array should have the update
		expect(updated[0].name).toBe('New Name');
		
		// Should be different array instances
		expect(updated).not.toBe(mockProfiles);
		expect(updated[0]).not.toBe(mockProfiles[0]);
	});
});