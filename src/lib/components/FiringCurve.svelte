<script lang="ts">
	import { Card, CardHeader, CardTitle, CardBody, VStack, HStack, Text } from '@immich/ui';
	import type { CurvePoint, HoverPoint } from '../types.js';
	import { getInterpolatedPoint } from '../curve-utils.js';
	import { throttle } from '../utils.js';

	interface Props {
		curveData: CurvePoint[];
		maxTemp: number;
		maxTime: number;
	}

	let { curveData, maxTemp, maxTime }: Props = $props();

	let hoverPoint = $state<HoverPoint | null>(null);
	let containerRect = $state<{width: number, height: number}>({width: 800, height: 500});

	function handleMouseMoveImpl(e: MouseEvent) {
		if (!curveData.length || maxTime === 0 || maxTemp === 0) return;
		
		const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
		containerRect = { width: rect.width, height: rect.height };
		const x = e.clientX - rect.left;
		
		// Convert screen X to SVG X coordinate
		const svgX = (x / rect.width) * 800;
		
		// Check if we're within the chart area horizontally
		if (svgX >= 80 && svgX <= 720) {
			// Convert SVG X to time
			const hoverTime = ((svgX - 80) / 640) * maxTime;
			
			const interpolated = getInterpolatedPoint(curveData, hoverTime);
			
			// Calculate SVG coordinates for the interpolated point
			const pointX = 80 + (hoverTime / maxTime) * 640;
			const pointY = 420 - (interpolated.temp / maxTemp) * 340;
			
			// Convert SVG coordinates to container coordinates
			const containerX = (pointX / 800) * rect.width;
			const containerY = (pointY / 500) * rect.height;
			
			hoverPoint = {
				x: containerX,
				y: containerY,
				svgX: pointX,
				svgY: pointY,
				time: hoverTime,
				temp: interpolated.temp
			};
		} else {
			hoverPoint = null;
		}
	}

	// Throttle mouse move events to ~60fps for better performance
	const handleMouseMove = throttle(handleMouseMoveImpl, 16);
</script>

<Card class="lg:flex-1 lg:order-2">
	<CardHeader>
		<CardTitle>Firing Curve</CardTitle>
	</CardHeader>
	<CardBody>
		<VStack gap={4}>
			<div class="relative">
				<svg 
					viewBox="0 0 800 500" 
					class="w-full h-auto border rounded min-h-[300px] lg:min-h-[400px]"
					role="application"
					aria-label="Interactive firing curve chart showing temperature over time"
					aria-describedby="curve-description"
					tabindex="0"
					onmousemove={handleMouseMove}
					onmouseleave={() => hoverPoint = null}
					onkeydown={(e) => {
						if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
							e.preventDefault();
							// Basic keyboard navigation could be implemented here
						}
					}}
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

			<Card>
				<CardBody>
					<HStack gap={8}>
						<Text>
							<Text fontWeight="semi-bold">Total Time:</Text> {maxTime.toFixed(1)} hours
						</Text>
						<Text>
							<Text fontWeight="semi-bold">Max Temperature:</Text> {maxTemp}°C
						</Text>
					</HStack>
				</CardBody>
			</Card>
			
			<div id="curve-description" class="sr-only">
				Interactive firing curve chart with {curveData.length} data points. 
				Total duration: {maxTime.toFixed(1)} hours. 
				Maximum temperature: {maxTemp} degrees Celsius.
				{#if hoverPoint}
					Currently hovering at {hoverPoint.time.toFixed(1)} hours, {hoverPoint.temp.toFixed(0)} degrees.
				{/if}
			</div>
		</VStack>
	</CardBody>
</Card>