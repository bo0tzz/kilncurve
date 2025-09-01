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
		Button,
		Text
	} from '@immich/ui';
	import ValidatedInput from './ValidatedInput.svelte';
	import type { FiringProfile } from '../types.js';
	import { validateStartTemp, validateProfileName, validateProfileDescription } from '../validation.js';
	import { KILN_PRESETS, getCoolingCoefficient } from '../kiln-presets.js';
	import { loadCustomKilns, addCustomKiln } from '../storage.js';

	interface Props {
		show: boolean;
		startTemp: number;
		profiles: FiringProfile[];
		cooldownSettings: {
			kilnPreset: string;
			coolingSpeed: 'slow' | 'normal' | 'fast';
			coolingCoefficient?: number;
			ambientTemp: number;
			stopTemp: number;
		};
		onClose: () => void;
		onStartTempChange: (temp: number) => void;
		onCooldownSettingsChange: (settings: any) => void;
		onEditProfile: (profileId: string, name: string, description: string) => void;
		onDeleteProfile: (profileId: string) => void;
	}

	let { show, startTemp, profiles, cooldownSettings, onClose, onStartTempChange, onCooldownSettingsChange, onEditProfile, onDeleteProfile }: Props = $props();

	let editingProfileId = $state<string | null>(null);
	let editingProfileName = $state('');
	let editingProfileDescription = $state('');
	let advancedMode = $state(false);
	let showSaveKiln = $state(false);
	let customKilnName = $state('');
	let customKilnDescription = $state('');

	// Get all kilns including custom ones
	let customKilns = $state<any[]>([]);
	let allKilns = $derived([...KILN_PRESETS, ...customKilns]);

	// Load custom kilns
	$effect(() => {
		if (typeof window !== 'undefined') {
			customKilns = loadCustomKilns();
		}
	});

	// Set advanced mode when modal opens based on whether coolingCoefficient is set
	$effect(() => {
		if (show && cooldownSettings.coolingCoefficient !== undefined) {
			advancedMode = true;
		}
	});

	// When switching to advanced mode, calculate current k value
	function switchToAdvanced() {
		if (!advancedMode && !cooldownSettings.coolingCoefficient) {
			const currentK = getCoolingCoefficient(
				cooldownSettings.kilnPreset,
				cooldownSettings.coolingSpeed
			);
			onCooldownSettingsChange({ ...cooldownSettings, coolingCoefficient: currentK });
		}
		advancedMode = true;
	}

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

	function saveCustomKiln() {
		if (customKilnName.trim()) {
			// Create new kiln using centralized storage
			const newKiln = addCustomKiln(
				customKilnName.trim(),
				customKilnDescription.trim(),
				cooldownSettings.coolingCoefficient || 0.15
			);
			
			// Update local state
			customKilns = [...customKilns, newKiln];
			
			// Clear form
			customKilnName = '';
			customKilnDescription = '';
			showSaveKiln = false;
			
			// Switch to using the new kiln
			onCooldownSettingsChange({ ...cooldownSettings, kilnPreset: newKiln.id });
			advancedMode = false;
		}
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

				<!-- Cooldown Settings -->
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Cooldown Settings</CardTitle>
							<Button
								onclick={() => {
									if (advancedMode) {
										// Switch back to simple mode - clear custom coefficient
										onCooldownSettingsChange({ ...cooldownSettings, coolingCoefficient: undefined });
										advancedMode = false;
									} else {
										switchToAdvanced();
									}
								}}
								size="small"
							>
								{advancedMode ? 'Simple' : 'Advanced'}
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						<VStack gap={4}>
							{#if !advancedMode}
								<!-- Simple Mode -->
								<div>
									<label for="kiln-type" class="block text-sm font-medium mb-1">Kiln Type</label>
									<select
										id="kiln-type"
										value={cooldownSettings.kilnPreset}
										onchange={(e: Event) => {
											const preset = allKilns.find(k => k.id === (e.currentTarget as HTMLSelectElement).value);
											if (preset) {
												onCooldownSettingsChange({ 
													...cooldownSettings, 
													kilnPreset: preset.id,
													coolingCoefficient: undefined // Clear custom k when selecting preset
												});
											}
										}}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										{#each allKilns as preset}
											<option value={preset.id}>{preset.name}</option>
										{/each}
									</select>
									{#if cooldownSettings.kilnPreset}
										{@const selectedPreset = allKilns.find(p => p.id === cooldownSettings.kilnPreset)}
										{#if selectedPreset}
											<span class="text-xs mt-1 text-gray-600 block">{selectedPreset.description}</span>
										{/if}
									{/if}
								</div>

								<div>
									<label for="cooling-speed" class="block text-sm font-medium mb-1">Cooling Speed</label>
									<select
										id="cooling-speed"
										value={cooldownSettings.coolingSpeed}
										onchange={(e: Event) => onCooldownSettingsChange({ ...cooldownSettings, coolingSpeed: (e.currentTarget as HTMLSelectElement).value as 'slow' | 'normal' | 'fast' })}
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="slow">Slow (tight kiln, full load)</option>
										<option value="normal">Normal</option>
										<option value="fast">Fast (vented, empty kiln)</option>
									</select>
								</div>
							{:else}
								<!-- Advanced Mode -->
								<div>
									<ValidatedInput
										id="k-coefficient"
										label="Cooling Coefficient (k)"
										type="number"
										value={(cooldownSettings.coolingCoefficient || 0.15).toString()}
										placeholder="0.15"
										min="0.01"
										max="0.50"
										validator={(value) => {
											const num = Number(value);
											return num >= 0.01 && num <= 0.50 
												? { isValid: true } 
												: { isValid: false, error: 'k must be between 0.01 and 0.50' };
										}}
										oninput={(value) => onCooldownSettingsChange({ ...cooldownSettings, coolingCoefficient: Number(value) })}
										required
									/>
									<span class="text-xs mt-1 text-gray-600 block">Higher values = faster cooling. Typical range: 0.05-0.35</span>
								</div>

								<div class="flex gap-4">
									<ValidatedInput
										id="ambient-temp"
										label="Room (°C)"
										type="number"
										value={cooldownSettings.ambientTemp.toString()}
										placeholder="20"
										min="0"
										max="40"
										validator={(value) => {
											const num = Number(value);
											return num >= 0 && num <= 40 
												? { isValid: true } 
												: { isValid: false, error: 'Room temperature must be between 0-40°C' };
										}}
										oninput={(value) => onCooldownSettingsChange({ ...cooldownSettings, ambientTemp: Number(value) })}
										required
									/>

									<ValidatedInput
										id="stop-temp"
										label="Stop (°C)"
										type="number"
										value={cooldownSettings.stopTemp.toString()}
										placeholder="50"
										min="20"
										max="200"
										validator={(value) => {
											const num = Number(value);
											return num >= 20 && num <= 200 
												? { isValid: true } 
												: { isValid: false, error: 'Stop temperature must be between 20-200°C' };
										}}
										oninput={(value) => onCooldownSettingsChange({ ...cooldownSettings, stopTemp: Number(value) })}
										required
									/>
								</div>

								<div>
									{#if !showSaveKiln}
										<Button onclick={() => showSaveKiln = true} size="small">
											Save as Custom Kiln Type
										</Button>
									{:else}
										<Card>
											<CardBody>
												<VStack gap={3}>
													<Text fontWeight="semi-bold">Save as Custom Kiln Type</Text>
													<Input
														placeholder="Kiln name (e.g., My Studio Kiln)"
														bind:value={customKilnName}
													/>
													<Input
														placeholder="Description (e.g., 100L, 100mm brick)"
														bind:value={customKilnDescription}
													/>
													<div class="flex gap-2">
														<Button
															disabled={!customKilnName.trim()}
															onclick={saveCustomKiln}
														>
															Save
														</Button>
														<Button
															onclick={() => {
																showSaveKiln = false;
																customKilnName = '';
																customKilnDescription = '';
															}}
														>
															Cancel
														</Button>
													</div>
												</VStack>
											</CardBody>
										</Card>
									{/if}
								</div>
							{/if}
						</VStack>
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
										
										<div class="flex gap-3 ml-4">
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