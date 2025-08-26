<script lang="ts">
	import { Button } from '@immich/ui';
	import type { FiringProfile } from '../types.js';

	interface Props {
		profiles: FiringProfile[];
		currentProfile: FiringProfile | null;
		isScheduleModified: boolean;
		onProfileSelect: (profileId: string | null) => void;
		onSaveClick: () => void;
	}

	let { profiles, currentProfile, isScheduleModified, onProfileSelect, onSaveClick }: Props = $props();

	function handleSelectionChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value;
		
		if (value === 'new') {
			onProfileSelect(null);
		} else if (value !== 'modified' && !value.startsWith('separator')) {
			onProfileSelect(value || null);
		}
	}

	const displayText = $derived(() => {
		if (isScheduleModified) {
			return '✏️ Modified Schedule';
		} else if (currentProfile) {
			return `${currentProfile.name}${currentProfile.isDefault ? ' (Default)' : ''}`;
		} else {
			return '✨ New Schedule';
		}
	});
</script>

<div class="flex items-center gap-4">
	<select 
		class="min-w-64 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
		onchange={handleSelectionChange}
		value={isScheduleModified ? 'modified' : (currentProfile?.id || 'new')}
		aria-label="Select firing profile"
		aria-describedby="profile-status"
	>
		<option value="new">✨ New Schedule</option>
		<option disabled>──────────────────</option>
		{#each profiles.filter(p => !p.isDefault) as profile}
			<option value={profile.id}>{profile.name}</option>
		{/each}
		{#if profiles.some(p => !p.isDefault) && profiles.some(p => p.isDefault)}
			<option disabled>──────────────────</option>
		{/if}
		{#each profiles.filter(p => p.isDefault) as profile}
			<option value={profile.id}>{profile.name} (Default)</option>
		{/each}
		{#if isScheduleModified}
			<option value="modified" selected>✏️ Modified Schedule</option>
		{/if}
	</select>
	
	{#if isScheduleModified}
		<Button 
			onclick={onSaveClick}
			aria-label="Save current modified schedule as a new profile"
			title="Save the current schedule as a new firing profile"
		>
			Save
		</Button>
	{/if}
	
	<span id="profile-status" class="sr-only">
		Current status: {displayText}
	</span>
</div>