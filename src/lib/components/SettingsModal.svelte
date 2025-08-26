<script lang="ts">
	import {
		Modal,
		ModalHeader,
		ModalBody,
		ModalFooter,
		Heading,
		CloseButton,
		VStack,
		Card,
		CardHeader,
		CardTitle,
		CardBody,
		Input,
		Button
	} from '@immich/ui';
	import ValidatedInput from './ValidatedInput.svelte';
	import type { FiringProfile } from '../types.js';
	import { validateStartTemp, validateProfileName, validateProfileDescription } from '../validation.js';

	interface Props {
		show: boolean;
		startTemp: number;
		profiles: FiringProfile[];
		onClose: () => void;
		onStartTempChange: (temp: number) => void;
		onEditProfile: (profileId: string, name: string, description: string) => void;
		onDeleteProfile: (profileId: string) => void;
	}

	let { show, startTemp, profiles, onClose, onStartTempChange, onEditProfile, onDeleteProfile }: Props = $props();

	let editingProfileId = $state<string | null>(null);
	let editingProfileName = $state('');
	let editingProfileDescription = $state('');

	function startEditing(profile: FiringProfile) {
		editingProfileId = profile.id;
		editingProfileName = profile.name;
		editingProfileDescription = profile.description;
	}

	function saveEdit() {
		if (editingProfileId && editingProfileName.trim()) {
			onEditProfile(editingProfileId, editingProfileName.trim(), editingProfileDescription.trim());
			cancelEdit();
		}
	}

	function cancelEdit() {
		editingProfileId = null;
		editingProfileName = '';
		editingProfileDescription = '';
	}
</script>

{#if show}
	<Modal 
		onClose={onClose}
		closeOnBackdropClick={true}
		closeOnEsc={true}
	>
		<ModalHeader>
			<div class="flex items-center justify-between w-full">
				<Heading tag="h2">Settings</Heading>
				<CloseButton onclick={onClose} />
			</div>
		</ModalHeader>
		<ModalBody>
			<VStack gap={6}>
				<!-- Starting Temperature Setting -->
				<Card>
					<CardHeader>
						<CardTitle>Default Settings</CardTitle>
					</CardHeader>
					<CardBody>
						<ValidatedInput
							id="defaultStartTemp"
							label="Starting Temperature (°C)"
							type="number"
							value={startTemp.toString()}
							placeholder="Room temperature"
							min="0"
							max="50"
							validator={(value) => validateStartTemp(Number(value))}
							oninput={(value) => onStartTempChange(Number(value))}
							required
						/>
					</CardBody>
				</Card>

				<!-- Profile Management -->
				<Card>
					<CardHeader>
						<CardTitle>Firing Profiles</CardTitle>
					</CardHeader>
					<CardBody>
						<VStack gap={3}>
							{#each profiles as profile (profile.id)}
								<div class="flex items-center justify-between py-2 min-h-10">
									{#if editingProfileId === profile.id}
										<div class="flex flex-col gap-2 flex-1">
											<Input
												bind:value={editingProfileName}
												placeholder="Profile name"
												autofocus
												class="flex-1"
											/>
											<Input
												bind:value={editingProfileDescription}
												placeholder="Profile description"
												class="flex-1"
											/>
											<div class="flex items-center gap-2">
												<Button
													disabled={!editingProfileName.trim()}
													onclick={saveEdit}
												>
													Save
												</Button>
												<Button
													onclick={cancelEdit}
												>
													Cancel
												</Button>
											</div>
										</div>
									{:else}
										<div class="flex-1">
											<span class="text-base font-medium">
												{profile.name}
												{#if profile.isDefault}<span class="text-sm text-gray-500"> (Default)</span>{/if}
												{#if profile.description}<span class="text-sm text-gray-500"> - {profile.description}</span>{/if}
											</span>
										</div>
										
										<div class="flex gap-1">
											<Button
												onclick={() => startEditing(profile)}
											>
												Edit
											</Button>
											{#if !profile.isDefault}
												<Button
													onclick={() => onDeleteProfile(profile.id)}
												>
													Delete
												</Button>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</VStack>
					</CardBody>
				</Card>
			</VStack>
		</ModalBody>
		<ModalFooter>
			<Button onclick={onClose}>
				Done
			</Button>
		</ModalFooter>
	</Modal>
{/if}