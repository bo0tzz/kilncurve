<script lang="ts">
	import { 
		Card, 
		CardHeader, 
		CardTitle, 
		CardBody,
		Button, 
		HStack,
		VStack,
		Text
	} from '@immich/ui';
	import ValidatedInput from './ValidatedInput.svelte';
	import type { FiringSegment } from '../types.js';
	import { validateTemperature, validateRate, validateHoldTime } from '../validation.js';

	interface Props {
		segments: FiringSegment[];
		onSegmentsChange: (segments: FiringSegment[]) => void;
	}

	let { segments, onSegmentsChange }: Props = $props();

	function addRampSegment() {
		const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
		const newSegments: FiringSegment[] = [...segments, { id: newId, type: 'ramp', rate: 100, targetTemp: 200 }];
		onSegmentsChange(newSegments);
	}

	function addHoldSegment() {
		const newId = segments.length > 0 ? Math.max(...segments.map(s => s.id)) + 1 : 1;
		const newSegments: FiringSegment[] = [...segments, { id: newId, type: 'hold', holdTime: 30 }];
		onSegmentsChange(newSegments);
	}

	function removeSegment(id: number) {
		const newSegments = segments.filter(s => s.id !== id);
		onSegmentsChange(newSegments);
	}

	function updateSegment(id: number, updates: Partial<FiringSegment>) {
		const newSegments = segments.map(s => 
			s.id === id ? { ...s, ...updates } : s
		);
		onSegmentsChange(newSegments);
	}
</script>

<Card class="lg:w-96 lg:flex-shrink-0 lg:order-1">
	<CardHeader>
		<CardTitle>Firing Schedule</CardTitle>
	</CardHeader>
	<CardBody>
		<VStack gap={6}>
			<VStack gap={4}>
				{#each segments as segment (segment.id)}
					<Card role="group" aria-labelledby="segment-{segment.id}-title">
						<CardHeader>
							<div class="flex justify-between items-center">
								<HStack gap={2}>
									<Text fontWeight="semi-bold" id="segment-{segment.id}-title">
										{segment.type === 'ramp' ? '🔥 Ramp' : '⏱️ Hold'} Segment {segment.id}
									</Text>
								</HStack>
								<Button 
									onclick={() => removeSegment(segment.id)}
									aria-label="Remove {segment.type} segment {segment.id}"
									title="Remove this segment"
								>
									×
								</Button>
							</div>
						</CardHeader>
						<CardBody>
							{#if segment.type === 'ramp'}
								<HStack gap={4}>
									<ValidatedInput
										id="rate-{segment.id}"
										label="Rate (°C/h)"
										type="number"
										value={segment.rate?.toString() || ''}
										placeholder="100"
										min="1"
										max="1000"
										validator={(value) => validateRate(Number(value))}
										oninput={(value) => updateSegment(segment.id, { rate: Number(value) })}
										required
									/>
									
									<ValidatedInput
										id="temp-{segment.id}"
										label="Target (°C)"
										type="number"
										value={segment.targetTemp?.toString() || ''}
										placeholder="1000"
										min="0"
										max="1400"
										validator={(value) => validateTemperature(Number(value))}
										oninput={(value) => updateSegment(segment.id, { targetTemp: Number(value) })}
										required
									/>
								</HStack>
							{:else}
								<ValidatedInput
									id="hold-{segment.id}"
									label="Hold Time (minutes)"
									type="number"
									value={segment.holdTime?.toString() || ''}
									placeholder="30"
									min="0"
									max="600"
									validator={(value) => validateHoldTime(Number(value))}
									oninput={(value) => updateSegment(segment.id, { holdTime: Number(value) })}
									required
								/>
							{/if}
						</CardBody>
					</Card>
				{/each}
				
				<div role="group" aria-label="Add firing segments">
					<HStack gap={2}>
						<Button 
						onclick={addRampSegment}
						aria-label="Add a new ramp segment"
						title="Add a ramp segment to heat to a target temperature"
					>
						🔥 Add Ramp
					</Button>
					<Button 
						onclick={addHoldSegment}
						aria-label="Add a new hold segment"
						title="Add a hold segment to maintain current temperature"
					>
						⏱️ Add Hold
						</Button>
					</HStack>
				</div>
			</VStack>
		</VStack>
	</CardBody>
</Card>