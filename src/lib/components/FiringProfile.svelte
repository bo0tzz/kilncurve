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

</script>

<div class="flex items-center gap-4">
	<Select 
		data={[
			{value: 'new', label: '✨ New Schedule'},
			{value: 'separator1', label: '──────────────────', disabled: true},
			...profiles.filter(p => !p.isDefault).map(p => ({
				value: p.id,
				label: p.name
			})),
			...(profiles.some(p => !p.isDefault) && profiles.some(p => p.isDefault) ? 
				[{value: 'separator2', label: '──────────────────', disabled: true}] : []),
			...profiles.filter(p => p.isDefault).map(p => ({
				value: p.id,
				label: `${p.name} (Default)`
			}))
		]}
		value={isScheduleModified 
			? { value: 'modified', label: '✏️ Modified Schedule' }
			: (currentProfile ? { value: currentProfile.id, label: `${currentProfile.name}${currentProfile.isDefault ? ' (Default)' : ''}` } : { value: 'new', label: '✨ New Schedule' })
		}
		onChange={(selectedItem) => {
			if (selectedItem?.value === 'new') {
				onProfileSelect(null);
			} else if (selectedItem?.value !== 'modified' && 
					  !selectedItem?.value?.startsWith('separator')) {
				onProfileSelect(selectedItem.value);
			}
		}}
		placeholder="Select a firing profile..."
		size="sm"
		class="min-w-64"
	/>
	
	{#if isScheduleModified}
		<Button 
			variant="primary" 
			size="sm"
			onclick={onSaveClick}
			aria-label="Save current modified schedule as a new profile"
			title="Save the current schedule as a new firing profile"
		>
			Save
		</Button>
	{/if}
</div>