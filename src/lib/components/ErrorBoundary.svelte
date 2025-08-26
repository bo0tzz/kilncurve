<script lang="ts">
	import { Card, CardBody, Button, VStack, Text, Heading } from '@immich/ui';
	import { addNotification } from '../stores/notifications.js';
	
	interface Props {
		children?: any;
		fallbackMessage?: string;
		onError?: (error: Error) => void;
	}
	
	let { 
		children, 
		fallbackMessage = "Something went wrong. Please try refreshing the page.",
		onError 
	}: Props = $props();
	
	let hasError = $state(false);
	let errorMessage = $state('');
	
	function handleError(error: Error) {
		hasError = true;
		errorMessage = error.message || 'An unexpected error occurred';
		console.error('ErrorBoundary caught error:', error);
		
		addNotification(`Error: ${errorMessage}`, 'error');
		
		if (onError) {
			onError(error);
		}
	}
	
	function retry() {
		hasError = false;
		errorMessage = '';
	}
	
	// Listen for global errors
	if (typeof window !== 'undefined') {
		window.addEventListener('error', (event) => {
			handleError(event.error || new Error(event.message));
		});
		
		window.addEventListener('unhandledrejection', (event) => {
			handleError(new Error(event.reason?.message || 'Unhandled promise rejection'));
		});
	}
</script>

{#if hasError}
	<Card class="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
		<CardBody>
			<VStack gap={4} class="items-center">
				<div class="text-red-600 dark:text-red-400">
					<svg class="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				
				<VStack gap={2} class="items-center text-center">
					<Heading tag="h3" class="text-red-800 dark:text-red-200">
						Oops! Something went wrong
					</Heading>
					<Text class="text-red-700 dark:text-red-300 text-center max-w-md">
						{fallbackMessage}
					</Text>
					{#if errorMessage}
						<Text class="text-red-600 dark:text-red-400 font-mono text-sm">
							{errorMessage}
						</Text>
					{/if}
				</VStack>
				
				<Button onclick={retry}>
					Try Again
				</Button>
			</VStack>
		</CardBody>
	</Card>
{:else}
	{@render children()}
{/if}