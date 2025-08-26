<script lang="ts">
	import { 
		Container, 
		AppShell,
		AppShellHeader,
		IconButton,
		VStack,
		ThemeSwitcher,
		theme,
		initializeTheme,
		onThemeChange
	} from '@immich/ui';
	import { mdiCog } from '@mdi/js';
	import { onMount } from 'svelte';
	
	import type { FiringProfile, FiringSegment } from '$lib/types.js';
	import { calculateCurveData } from '$lib/curve-utils.js';
	import { loadProfiles, saveProfiles, saveCurrentSchedule, loadCurrentSchedule } from '$lib/storage.js';
	import FiringProfileComponent from '$lib/components/FiringProfile.svelte';
	import FiringCurve from '$lib/components/FiringCurve.svelte';
	import FiringSchedule from '$lib/components/FiringSchedule.svelte';
	import SaveProfileModal from '$lib/components/SaveProfileModal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import NotificationToast from '$lib/components/NotificationToast.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

	// State
	let profiles = $state<FiringProfile[]>([]);
	let currentProfile = $state<FiringProfile | null>(null);
	let segments = $state<FiringSegment[]>([]);
	let startTemp = $state(20);
	let isScheduleModified = $state(false);
	let hasInitialized = $state(false);

	// Modal state
	let showSaveDialog = $state(false);
	let showSettingsDialog = $state(false);

	// Derived values
	let curveData = $derived(calculateCurveData(segments, startTemp));
	let maxTemp = $derived(Math.max(...curveData.map(p => p.temp)));
	let maxTime = $derived(Math.max(...curveData.map(p => p.time)));

	// Profile management functions
	function loadProfile(profile: FiringProfile) {
		currentProfile = profile;
		segments = [...profile.segments];
		startTemp = profile.startTemp;
	}

	function saveAsProfile(name: string, description: string) {
		try {
			const newProfile: FiringProfile = {
				id: Date.now().toString(),
				name,
				description,
				startTemp,
				segments: [...segments],
				isDefault: false
			};
			profiles = [...profiles, newProfile];
			saveProfiles(profiles);
			currentProfile = newProfile;
			showSaveDialog = false;
		} catch (error) {
			console.error('Error saving profile:', error);
			// Profile creation failed, but don't crash the app
		}
	}

	function deleteProfile(profileId: string) {
		try {
			profiles = profiles.filter(p => p.id !== profileId);
			saveProfiles(profiles);
			if (currentProfile?.id === profileId) {
				currentProfile = null;
			}
		} catch (error) {
			console.error('Error deleting profile:', error);
			// Profile deletion failed, restore if possible
			profiles = loadProfiles();
		}
	}

	function editProfile(profileId: string, newName: string, newDescription: string) {
		try {
			const profile = profiles.find(p => p.id === profileId);
			if (profile) {
				profile.name = newName;
				profile.description = newDescription;
				profiles = [...profiles];
				saveProfiles(profiles);
				if (currentProfile?.id === profileId) {
					currentProfile = profile;
				}
			}
		} catch (error) {
			console.error('Error editing profile:', error);
			// Profile edit failed, restore if possible
			profiles = loadProfiles();
		}
	}

	function handleProfileSelect(profileId: string | null) {
		if (profileId === null) {
			// Start fresh with new schedule
			segments = [];
			startTemp = 20;
			currentProfile = null;
		} else {
			const profile = profiles.find(p => p.id === profileId);
			if (profile) loadProfile(profile);
		}
	}

	// Schedule management
	function checkIfModified() {
		if (!currentProfile) {
			isScheduleModified = segments.length > 0;
			return;
		}
		
		const profileSegments = JSON.stringify(currentProfile.segments);
		const currentSegments = JSON.stringify(segments);
		isScheduleModified = profileSegments !== currentSegments || startTemp !== currentProfile.startTemp;
	}

	function loadCurrentScheduleFromStorage() {
		const schedule = loadCurrentSchedule();
		
		if (schedule) {
			if (schedule.startTemp !== undefined) {
				startTemp = schedule.startTemp;
			}
			if (schedule.segments && Array.isArray(schedule.segments)) {
				segments = [...schedule.segments];
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
		}
		return false;
	}

	// Watch for changes to segments or startTemp
	$effect(() => {
		if (hasInitialized) {
			checkIfModified();
			saveCurrentSchedule(startTemp, segments, currentProfile?.id);
		}
	});

	// Initialize
	onMount(() => {
		try {
			initializeTheme();
			
			// Load profiles first
			profiles = loadProfiles();
			
			// Try to load saved schedule
			const hasLoadedSchedule = loadCurrentScheduleFromStorage();
			
			// If no saved schedule exists, load the first profile as default
			if (!hasLoadedSchedule && profiles.length > 0) {
				loadProfile(profiles[0]);
			}
			
			// Mark as initialized so $effect starts watching for changes
			hasInitialized = true;
		} catch (error) {
			console.error('Error during app initialization:', error);
			// Ensure we have a basic working state even if initialization fails
			profiles = [];
			segments = [];
			startTemp = 20;
			hasInitialized = true;
		}
	});
</script>

<svelte:head>
	<title>Kiln Firing Curve Designer</title>
</svelte:head>

<AppShell>
	<AppShellHeader>
		<div class="w-full max-w-none px-4">
			<div class="flex items-center justify-between py-3">
				<!-- Profile Management -->
				<FiringProfileComponent
					{profiles}
					{currentProfile}
					{isScheduleModified}
					onProfileSelect={handleProfileSelect}
					onSaveClick={() => showSaveDialog = true}
				/>
				
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
		<VStack gap={6} class="py-6">
			<div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
				<!-- Firing Curve -->
				<ErrorBoundary fallbackMessage="Unable to display the firing curve. Please check your firing schedule.">
					<FiringCurve 
						{curveData}
						{maxTemp}
						{maxTime}
					/>
				</ErrorBoundary>

				<!-- Firing Schedule -->
				<ErrorBoundary fallbackMessage="Unable to display the firing schedule. Please try refreshing the page.">
					<FiringSchedule 
						{segments}
						onSegmentsChange={(newSegments) => segments = newSegments}
					/>
				</ErrorBoundary>
			</div>
		</VStack>
	</Container>
</AppShell>

<!-- Save Profile Modal -->
<SaveProfileModal 
	show={showSaveDialog}
	onClose={() => showSaveDialog = false}
	onSave={saveAsProfile}
/>

<!-- Settings Modal -->
<SettingsModal 
	show={showSettingsDialog}
	{startTemp}
	{profiles}
	onClose={() => showSettingsDialog = false}
	onStartTempChange={(temp) => startTemp = temp}
	onEditProfile={editProfile}
	onDeleteProfile={deleteProfile}
/>

<!-- Notification Toast -->
<NotificationToast />