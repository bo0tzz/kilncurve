<script lang="ts">
	import {
		Modal,
		ModalHeader,
		ModalBody,
		ModalFooter,
		Heading,
		VStack,
		Button
	} from '@immich/ui';
	import ValidatedInput from './ValidatedInput.svelte';
	import { validateProfileName, validateProfileDescription } from '../validation.js';

	interface Props {
		show: boolean;
		onClose: () => void;
		onSave: (name: string, description: string) => void;
	}

	let { show, onClose, onSave }: Props = $props();

	let profileName = $state('');
	let profileDescription = $state('');

	function handleSave() {
		if (profileName.trim()) {
			onSave(profileName.trim(), profileDescription.trim());
			profileName = '';
			profileDescription = '';
		}
	}

	function handleClose() {
		profileName = '';
		profileDescription = '';
		onClose();
	}
</script>

{#if show}
	<Modal 
		onClose={handleClose}
		closeOnBackdropClick={true}
		closeOnEsc={true}
	>
		<ModalHeader>
			<Heading tag="h2">Save Firing Profile</Heading>
		</ModalHeader>
		<ModalBody>
			<VStack gap={4}>
				<ValidatedInput
					id="profileName"
					label="Profile Name"
					value={profileName}
					placeholder="My Custom Profile"
					validator={validateProfileName}
					oninput={(value) => profileName = value}
					autofocus
					required
				/>
				<ValidatedInput
					id="profileDescription"
					label="Description (Optional)"
					value={profileDescription}
					placeholder="Description of this firing schedule..."
					validator={validateProfileDescription}
					oninput={(value) => profileDescription = value}
				/>
			</VStack>
		</ModalBody>
		<ModalFooter>
			<div class="flex gap-2 justify-end">
				<Button onclick={handleClose}>
					Cancel
				</Button>
				<Button disabled={!profileName.trim()} onclick={handleSave}>
					Save Profile
				</Button>
			</div>
		</ModalFooter>
	</Modal>
{/if}