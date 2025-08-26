<script lang="ts">
	import { Button, Select } from '@immich/ui';
	import type { FiringProfile } from '../types.js';

	interface Props {
		profiles: FiringProfile[];
		currentProfile: FiringProfile | null;
		isScheduleModified: boolean;
		onProfileSelect: (profileId: string | null) => void;
		onSaveClick: () => void;
	}

	let { profiles, currentProfile, isScheduleModified, onProfileSelect, onSaveClick }: Props = $props();

	interface SelectOption {
		label: string;
		value: string;
		disabled?: boolean;
	}

	const selectData = $derived(() => {
		const options: SelectOption[] = [];
		
		// New Schedule option (shows as Modified if schedule is modified)
		options.push({
			label: isScheduleModified ? '✏️ Modified Schedule' : '✨ New Schedule',
			value: 'new'
		});
		
		// Separator
		options.push({ label: '──────────────────', value: 'sep1', disabled: true });
		
		// User profiles
		profiles.filter(p => !p.isDefault).forEach(profile => {
			options.push({ label: profile.name, value: profile.id });
		});
		
		// Separator if both user and default profiles exist
		if (profiles.some(p => !p.isDefault) && profiles.some(p => p.isDefault)) {
			options.push({ label: '──────────────────', value: 'sep2', disabled: true });
		}
		
		// Default profiles
		profiles.filter(p => p.isDefault).forEach(profile => {
			options.push({ label: `${profile.name} (Default)`, value: profile.id });
		});
		
		return options;
	});

	const selectedValue = $derived(() => {
		if (isScheduleModified) {
			return { label: '✏️ Modified Schedule', value: 'new' };
		} else if (currentProfile) {
			return { 
				label: `${currentProfile.name}${currentProfile.isDefault ? ' (Default)' : ''}`, 
				value: currentProfile.id 
			};
		} else {
			return { label: '✨ New Schedule', value: 'new' };
		}
	});

	function handleSelectionChange(option: SelectOption) {
		if (option.value === 'new') {
			onProfileSelect(null);
		} else if (!option.disabled && !option.value.startsWith('sep')) {
			onProfileSelect(option.value);
		}
	}
</script>

<div class="flex items-center gap-4">
	<Select 
		data={selectData}
		value={selectedValue}
		onChange={handleSelectionChange}
		placeholder="Select a firing profile"
		class="min-w-64"
	/>
	
	{#if isScheduleModified}
		<Button 
			onclick={onSaveClick}
			aria-label="Save current modified schedule as a new profile"
			title="Save the current schedule as a new firing profile"
		>
			Save
		</Button>
	{/if}
</div>