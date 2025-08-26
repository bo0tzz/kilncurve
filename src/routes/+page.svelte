<script lang="ts">
	import { 
		Container, 
		AppShell,
		AppShellHeader,
		Card, 
		CardHeader, 
		CardTitle, 
		CardBody,
		Input, 
		Field, 
		Label, 
		Button, 
		IconButton,
		CloseButton,
		Heading,
		HStack,
		VStack,
		Text,
		ThemeSwitcher,
		Select,
		Modal,
		ModalHeader,
		ModalBody,
		ModalFooter,
		theme,
		initializeTheme,
		onThemeChange
	} from '@immich/ui';
	import { mdiCog, mdiPencil, mdiDelete } from '@mdi/js';
	import { onMount } from 'svelte';

	type SegmentType = 'ramp' | 'hold';

	interface FiringSegment {
		id: number;
		type: SegmentType;
		rate?: number; // degrees C per hour (for ramp segments)
		targetTemp?: number; // degrees C (for ramp segments)
		holdTime?: number; // minutes (for hold segments)
	}

	interface FiringProfile {
		id: string;
		name: string;
		description: string;
		startTemp: number;
		segments: FiringSegment[];
		isDefault?: boolean;
	}

	// Default firing profiles
	const defaultProfiles: FiringProfile[] = [
		{
			id: 'bisque',
			name: 'Standard Bisque',
			description: 'Simple bisque firing - 120°C/h to 950°C + 10min hold',
			startTemp: 20,
			segments: [
				{ id: 1, type: 'ramp', rate: 120, targetTemp: 950 },
				{ id: 2, type: 'hold', holdTime: 10 }
			],
			isDefault: true
		},
		{
			id: 'glaze-cone6',
			name: 'Cone 6 Glaze',
			description: 'Standard cone 6 glaze firing - 1200°C',
			startTemp: 20,
			segments: [
				{ id: 1, type: 'ramp', rate: 100, targetTemp: 1200 },
				{ id: 2, type: 'hold', holdTime: 5 }
			],
			isDefault: true
		},
		{
			id: 'glaze-cone6-slow',
			name: 'Cone 6 Drop & Hold',
			description: 'Drop-and-hold schedule for defect reduction',
			startTemp: 20,
			segments: [
				{ id: 1, type: 'ramp', rate: 100, targetTemp: 1200 },
				{ id: 2, type: 'hold', holdTime: 5 },
				{ id: 3, type: 'ramp', rate: 50, targetTemp: 1150 },
				{ id: 4, type: 'hold', holdTime: 30 }
			],
			isDefault: true
		},
		{
			id: 'glaze-cone10',
			name: 'Cone 10 Glaze',
			description: 'High-fire glaze firing - 1300°C',
			startTemp: 20,
			segments: [
				{ id: 1, type: 'ramp', rate: 80, targetTemp: 1300 },
				{ id: 2, type: 'hold', holdTime: 15 }
			],
			isDefault: true
		}
	];

	// Profile management
	let profiles = $state<FiringProfile[]>([]);
	let currentProfile = $state<FiringProfile | null>(null);
	let segments = $state<FiringSegment[]>([]);
	let startTemp = $state(20);

	// Load profiles from localStorage
	function loadProfiles() {
		const stored = localStorage.getItem('firingProfiles');
		if (stored) {
			profiles = JSON.parse(stored);
		} else {
			profiles = [...defaultProfiles];
			saveProfiles();
		}
	}

	// Save profiles to localStorage
	function saveProfiles() {
		localStorage.setItem('firingProfiles', JSON.stringify(profiles));
	}

	// Load a profile
	function loadProfile(profile: FiringProfile) {
		currentProfile = profile;
		segments = [...profile.segments];
		startTemp = profile.startTemp;
	}

	// Save current as new profile
	function saveAsProfile(name: string, description: string) {
		const newProfile: FiringProfile = {
			id: Date.now().toString(),
			name,
			description,
			startTemp,
			segments: [...segments],
			isDefault: false
		};
		profiles = [...profiles, newProfile];
		saveProfiles();
		currentProfile = newProfile;
	}

	// Delete profile
	function deleteProfile(profileId: string) {
		profiles = profiles.filter(p => p.id !== profileId);
		saveProfiles();
		if (currentProfile?.id === profileId) {
			currentProfile = null;
		}
	}

	// Edit profile
	function editProfile(profileId: string, newName: string, newDescription: string) {
		const profile = profiles.find(p => p.id === profileId);
		if (profile) {
			profile.name = newName;
			profile.description = newDescription;
			profiles = [...profiles];
			saveProfiles();
			if (currentProfile?.id === profileId) {
				currentProfile = profile;
			}
		}
	}

	// Profile UI state
	let showSaveDialog = $state(false);
	let showSettingsDialog = $state(false);
	let newProfileName = $state('');
	let newProfileDescription = $state('');
	let editingProfileId = $state<string | null>(null);
	let editingProfileName = $state('');
	let editingProfileDescription = $state('');
	let isScheduleModified = $state(false);
	
	// Hover tooltip state
	let hoverPoint = $state<{x: number, y: number, svgX: number, svgY: number, time: number, temp: number} | null>(null);
	let containerRect = $state<{width: number, height: number}>({width: 800, height: 500});
	
	function handleSaveProfile() {
		if (newProfileName.trim()) {
			saveAsProfile(newProfileName.trim(), newProfileDescription.trim());
			showSaveDialog = false;
			newProfileName = '';
			newProfileDescription = '';
		}
	}
	
	// Save current schedule to localStorage
	function saveCurrentSchedule() {
		const currentSchedule = {
			startTemp,
			segments,
			currentProfileId: currentProfile?.id
		};
		localStorage.setItem('currentSchedule', JSON.stringify(currentSchedule));
	}

	// Load current schedule from localStorage
	function loadCurrentSchedule() {
		const stored = localStorage.getItem('currentSchedule');
		
		if (stored) {
			try {
				const schedule = JSON.parse(stored);
				
				if (schedule.startTemp !== undefined) {
					startTemp = schedule.startTemp;
				}
				if (schedule.segments && Array.isArray(schedule.segments)) {
					segments = [...schedule.segments]; // Create new array to ensure reactivity
				}
				if (schedule.currentProfileId) {
						const profile = profiles.find(p => p.id === schedule.currentProfileId);
					if (profile) {
						currentProfile = profile;
					} else {
						currentProfile = null;
					}
				} else {
					currentProfile = null;
				}
				
				checkIfModified();
				return true;
			} catch (e) {
				return false;
			}
		}
		return false;
	}

	// Check if schedule has been modified from current profile
	function checkIfModified() {
		if (!currentProfile) {
			isScheduleModified = segments.length > 0;
			return;
		}
		
		const profileSegments = JSON.stringify(currentProfile.segments);
		const currentSegments = JSON.stringify(segments);
		isScheduleModified = profileSegments !== currentSegments || startTemp !== currentProfile.startTemp;
	}

	// Watch for changes to segments or startTemp (but not on initial load)
	let hasInitialized = $state(false);
	
	$effect(() => {
		if (hasInitialized) {
			checkIfModified();
			saveCurrentSchedule();
		}
	});

	// Initialize theme system and profiles
	onMount(() => {
		initializeTheme();
		
		// Load profiles first
		loadProfiles();
		
		// Try to load saved schedule
		const hasLoadedSchedule = loadCurrentSchedule();
		
		// If no saved schedule exists, load the first profile as default
		if (!hasLoadedSchedule && profiles.length > 0) {
			loadProfile(profiles[0]);
		}
		
		// Mark as initialized so $effect starts watching for changes
		hasInitialized = true;
	});

	function calculateCurveData() {
		const points: { time: number; temp: number }[] = [];
		let currentTime = 0;
		let currentTemp = startTemp;

		points.push({ time: 0, temp: currentTemp });

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			
			if (segment.type === 'ramp' && segment.rate && segment.targetTemp !== undefined) {
				const tempDifference = segment.targetTemp - currentTemp;
				const timeToTarget = Math.abs(tempDifference) / segment.rate;

				currentTime += timeToTarget;
				currentTemp = segment.targetTemp;
				
				points.push({ 
					time: currentTime, 
					temp: currentTemp
				});
				
			} else if (segment.type === 'hold' && segment.holdTime) {
				currentTime += segment.holdTime / 60;
				points.push({ time: currentTime, temp: currentTemp });
			}
		}

		return points;
	}

	function addRampSegment() {
		const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
		segments = [...segments, { id: newId, type: 'ramp', rate: 100, targetTemp: 200 }];
	}

	function addHoldSegment() {
		const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
		segments = [...segments, { id: newId, type: 'hold', holdTime: 30 }];
	}

	function removeSegment(id: number) {
		segments = segments.filter(s => s.id !== id);
	}

	let curveData = $derived(calculateCurveData());
	let maxTemp = $derived(Math.max(...curveData.map(p => p.temp)));
	let maxTime = $derived(Math.max(...curveData.map(p => p.time)));
</script>

<svelte:head>
	<title>Kiln Firing Curve Designer</title>
</svelte:head>

<AppShell>
	<AppShellHeader>
		<div class="w-full max-w-none px-4">
			<div class="flex items-center justify-between py-3">
				<!-- Profile Management -->
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
								// Start fresh with new schedule
								segments = [];
								startTemp = 20;
								currentProfile = null;
							} else if (selectedItem?.value !== 'modified' && 
									  !selectedItem?.value?.startsWith('separator')) {
								const profile = profiles.find(p => p.id === selectedItem?.value);
								if (profile) loadProfile(profile);
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
							onclick={() => showSaveDialog = true}
						>
							Save
						</Button>
					{/if}
				</div>
				
				<div class="flex items-center gap-3">
					<IconButton
						icon={mdiCog}
						size="small"
						variant="ghost"
						onclick={() => showSettingsDialog = true}
						aria-label="Settings"
					/>
					<ThemeSwitcher size="small" />
				</div>
			</div>
		</div>
	</AppShellHeader>

	<Container>
		<VStack gap="6" class="py-6">
		
		<div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
			<!-- Curve shows first on mobile, second on desktop -->
			<Card class="lg:flex-1 lg:order-2">
				<CardHeader>
					<CardTitle>Firing Curve</CardTitle>
				</CardHeader>
				<CardBody>
					<VStack gap="4">
						<div class="relative">
							<svg 
								viewBox="0 0 800 500" 
								class="w-full h-auto border rounded min-h-[300px] lg:min-h-[400px]"
								role="img"
								aria-label="Firing curve chart showing temperature over time"
								onmousemove={(e) => {
									if (!curveData.length || maxTime === 0 || maxTemp === 0) return;
									
									const rect = e.currentTarget.getBoundingClientRect();
									containerRect = { width: rect.width, height: rect.height };
									const x = e.clientX - rect.left;
									
									// Convert screen X to SVG X coordinate
									const svgX = (x / rect.width) * 800;
									
									// Check if we're within the chart area horizontally
									if (svgX >= 80 && svgX <= 720) {
										// Convert SVG X to time
										const hoverTime = ((svgX - 80) / 640) * maxTime;
										
										// Find the two points that bracket this time for interpolation
										let leftPoint = curveData[0];
										let rightPoint = curveData[curveData.length - 1];
										
										for (let i = 0; i < curveData.length - 1; i++) {
											if (curveData[i].time <= hoverTime && curveData[i + 1].time >= hoverTime) {
												leftPoint = curveData[i];
												rightPoint = curveData[i + 1];
												break;
											}
										}
										
										// Interpolate temperature at the exact hover time
										let interpolatedTemp;
										if (leftPoint.time === rightPoint.time) {
											// Same time, use the temperature
											interpolatedTemp = leftPoint.temp;
										} else {
											// Linear interpolation between the two points
											const ratio = (hoverTime - leftPoint.time) / (rightPoint.time - leftPoint.time);
											interpolatedTemp = leftPoint.temp + (rightPoint.temp - leftPoint.temp) * ratio;
										}
										
										// Calculate SVG coordinates for the interpolated point
										const pointX = 80 + (hoverTime / maxTime) * 640;
										const pointY = 420 - (interpolatedTemp / maxTemp) * 340;
										
										// Convert SVG coordinates to container coordinates
										const containerX = (pointX / 800) * rect.width;
										const containerY = (pointY / 500) * rect.height;
										
										hoverPoint = {
											x: containerX,
											y: containerY,
											svgX: pointX,
											svgY: pointY,
											time: hoverTime,
											temp: interpolatedTemp
										};
									} else {
										hoverPoint = null;
									}
								}}
								onmouseleave={() => hoverPoint = null}
							>
							<!-- Grid lines -->
							{#each Array(9) as _, i}
								<line 
									x1="80" 
									y1={80 + i * 40} 
									x2="720" 
									y2={80 + i * 40} 
									stroke="currentColor" 
									stroke-width="1"
									opacity="0.2"
								/>
							{/each}
							{#each Array(9) as _, i}
								<line 
									x1={80 + i * 80} 
									y1="80" 
									x2={80 + i * 80} 
									y2="420" 
									stroke="currentColor" 
									stroke-width="1"
									opacity="0.2"
								/>
							{/each}

							<!-- Axes -->
							<line x1="80" y1="420" x2="720" y2="420" stroke="currentColor" stroke-width="3"/>
							<line x1="80" y1="80" x2="80" y2="420" stroke="currentColor" stroke-width="3"/>

							<!-- Temperature curve -->
							{#if curveData.length > 1}
								<polyline
									points={curveData.map(point => {
										const x = 80 + (point.time / maxTime) * 640;
										const y = 420 - (point.temp / maxTemp) * 340;
										return `${x},${y}`;
									}).join(' ')}
									fill="none"
									stroke="rgb(var(--immich-ui-primary))"
									stroke-width="4"
								/>
								
								<!-- Data points -->
								{#each curveData as point}
									<circle
										cx={80 + (point.time / maxTime) * 640}
										cy={420 - (point.temp / maxTemp) * 340}
										r="6"
										fill="rgb(var(--immich-ui-primary))"
									/>
								{/each}
								
								<!-- Hover indicator -->
								{#if hoverPoint}
									<circle
										cx={hoverPoint.svgX}
										cy={hoverPoint.svgY}
										r="8"
										fill="rgb(var(--immich-ui-primary))"
										stroke="white"
										stroke-width="2"
										opacity="0.8"
									/>
								{/if}
							{/if}

							<!-- Labels -->
							<text x="400" y="470" text-anchor="middle" fill="currentColor" opacity="0.7" class="text-lg">Time (hours)</text>
							<text x="30" y="250" text-anchor="middle" fill="currentColor" opacity="0.7" class="text-lg" transform="rotate(-90 30 250)">Temperature (°C)</text>
							
							<!-- Time axis values -->
							{#each Array(9) as _, i}
								<text 
									x={80 + i * 80} 
									y="445" 
									text-anchor="middle" 
									fill="currentColor" 
									opacity="0.7" 
									class="text-sm"
								>
									{((i * maxTime) / 8).toFixed(1)}
								</text>
							{/each}
							
							<!-- Temperature axis values -->
							{#each Array(9) as _, i}
								<text 
									x="65" 
									y={420 - i * 40} 
									text-anchor="end" 
									fill="currentColor" 
									opacity="0.7" 
									class="text-sm"
								>
									{Math.round((i * maxTemp) / 8)}
								</text>
							{/each}
						</svg>
						
						<!-- Floating tooltip -->
						{#if hoverPoint}
							{@const tooltipWidth = 110}
							{@const isNearRightEdge = hoverPoint.x > containerRect.width * 0.75}
							{@const isNearLeftEdge = hoverPoint.x < containerRect.width * 0.25}
							{@const tooltipX = isNearRightEdge ? hoverPoint.x - tooltipWidth - 10 : 
											   isNearLeftEdge ? hoverPoint.x + 10 : 
											   hoverPoint.x - tooltipWidth / 2}
							{@const tooltipY = Math.max(5, hoverPoint.y - 35)}
							<div 
								class="absolute pointer-events-none bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg z-10 whitespace-nowrap"
								style="left: {Math.max(5, Math.min(tooltipX, containerRect.width - tooltipWidth - 5))}px; top: {tooltipY}px;"
							>
								{hoverPoint.time.toFixed(1)}h, {hoverPoint.temp.toFixed(0)}°C
							</div>
						{/if}
					</div>

						<Card variant="outlined">
							<CardBody>
								<HStack gap="8">
									<Text>
										<Text weight="semibold" inline>Total Time:</Text> {maxTime.toFixed(1)} hours
									</Text>
									<Text>
										<Text weight="semibold" inline>Max Temperature:</Text> {maxTemp}°C
									</Text>
								</HStack>
							</CardBody>
						</Card>
					</VStack>
				</CardBody>
			</Card>

			<!-- Schedule shows second on mobile, first on desktop -->
			<Card class="lg:w-96 lg:flex-shrink-0 lg:order-1">
				<CardHeader>
					<CardTitle>Firing Schedule</CardTitle>
				</CardHeader>
				<CardBody>
					<VStack gap="6">
						<VStack gap="4">
							<Heading level="3">Firing Segments</Heading>
							{#each segments as segment (segment.id)}
								<Card variant="outlined">
									<CardHeader>
										<HStack justify="between" align="center">
											<HStack gap="2" align="center">
												<Text weight="semibold">
													{segment.type === 'ramp' ? '🔥 Ramp' : '⏱️ Hold'} Segment {segment.id}
												</Text>
											</HStack>
											<Button 
												variant="ghost" 
												size="sm" 
												color="danger"
												onclick={() => removeSegment(segment.id)}
											>
												×
											</Button>
										</HStack>
									</CardHeader>
									<CardBody>
										{#if segment.type === 'ramp'}
											<HStack gap="4">
												<Field>
													<Label for="rate-{segment.id}">Rate (°C/h)</Label>
													<Input 
														id="rate-{segment.id}" 
														type="number" 
														bind:value={segment.rate} 
														min="1" 
														max="1000" 
														placeholder="100"
													/>
												</Field>
												
												<Field>
													<Label for="temp-{segment.id}">Target (°C)</Label>
													<Input 
														id="temp-{segment.id}" 
														type="number" 
														bind:value={segment.targetTemp} 
														min="0" 
														max="1400" 
														placeholder="1000"
													/>
												</Field>
											</HStack>
										{:else}
											<Field>
												<Label for="hold-{segment.id}">Hold Time (minutes)</Label>
												<Input 
													id="hold-{segment.id}" 
													type="number" 
													bind:value={segment.holdTime} 
													min="0" 
													max="600" 
													placeholder="30"
												/>
											</Field>
										{/if}
									</CardBody>
								</Card>
							{/each}
							
							<HStack gap="2">
								<Button variant="primary" onclick={addRampSegment}>
									🔥 Add Ramp
								</Button>
								<Button variant="secondary" onclick={addHoldSegment}>
									⏱️ Add Hold
								</Button>
							</HStack>
						</VStack>
					</VStack>
				</CardBody>
			</Card>
		</div>
		</VStack>
	</Container>
</AppShell>

<!-- Save Profile Modal -->
{#if showSaveDialog}
	<Modal onClose={() => showSaveDialog = false}>
		<ModalHeader>
			<Heading level="2">Save Firing Profile</Heading>
		</ModalHeader>
		<ModalBody>
			<VStack gap="4">
				<Field>
					<Label for="profileName">Profile Name</Label>
					<Input 
						id="profileName" 
						bind:value={newProfileName} 
						placeholder="My Custom Profile"
						autofocus
					/>
				</Field>
				<Field>
					<Label for="profileDescription">Description (Optional)</Label>
					<Input 
						id="profileDescription" 
						bind:value={newProfileDescription} 
						placeholder="Description of this firing schedule..."
					/>
				</Field>
			</VStack>
		</ModalBody>
		<ModalFooter>
			<HStack gap="2" justify="end">
				<Button variant="ghost" onclick={() => showSaveDialog = false}>
					Cancel
				</Button>
				<Button variant="primary" disabled={!newProfileName.trim()} onclick={handleSaveProfile}>
					Save Profile
				</Button>
			</HStack>
		</ModalFooter>
	</Modal>
{/if}

<!-- Settings Modal -->
{#if showSettingsDialog}
	<Modal onClose={() => showSettingsDialog = false}>
		<ModalHeader>
			<div class="flex items-center justify-between w-full">
				<Heading level="2">Settings</Heading>
				<CloseButton onclick={() => showSettingsDialog = false} />
			</div>
		</ModalHeader>
		<ModalBody>
			<VStack gap="6">
				<!-- Starting Temperature Setting -->
				<Card variant="outlined">
					<CardHeader>
						<CardTitle>Default Settings</CardTitle>
					</CardHeader>
					<CardBody>
						<Field>
							<Label for="defaultStartTemp">Starting Temperature (°C)</Label>
							<Input 
								id="defaultStartTemp" 
								type="number" 
								bind:value={startTemp} 
								min="0" 
								max="50" 
								placeholder="Room temperature"
							/>
						</Field>
					</CardBody>
				</Card>

				<!-- Profile Management -->
				<Card variant="outlined">
					<CardHeader>
						<CardTitle>Firing Profiles</CardTitle>
					</CardHeader>
					<CardBody>
						<VStack gap="3">
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
													size="tiny"
													variant="primary"
													disabled={!editingProfileName.trim()}
													onclick={() => {
														if (editingProfileName.trim()) {
															editProfile(profile.id, editingProfileName.trim(), editingProfileDescription.trim());
															editingProfileId = null;
														}
													}}
												>
													Save
												</Button>
												<Button
													size="tiny"
													variant="secondary"
													onclick={() => {
														editingProfileId = null;
													}}
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
												leadingIcon={mdiPencil}
												size="tiny"
												variant="ghost"
												onclick={() => {
													editingProfileId = profile.id;
													editingProfileName = profile.name;
													editingProfileDescription = profile.description;
												}}
											>
												Edit
											</Button>
											{#if !profile.isDefault}
												<Button
													leadingIcon={mdiDelete}
													size="tiny"
													variant="ghost"
													color="danger"
													onclick={() => deleteProfile(profile.id)}
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
			<Button variant="primary" onclick={() => showSettingsDialog = false}>
				Done
			</Button>
		</ModalFooter>
	</Modal>
{/if}

