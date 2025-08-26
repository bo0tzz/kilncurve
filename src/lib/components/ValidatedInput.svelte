<script lang="ts">
	import { Input, Field, Label } from '@immich/ui';
	import type { ValidationResult } from '../validation.js';

	interface Props {
		id: string;
		label: string;
		type?: string;
		value: string;
		placeholder?: string;
		min?: string;
		max?: string;
		validator?: (value: string) => ValidationResult;
		oninput: (value: string) => void;
		autofocus?: boolean;
		required?: boolean;
	}

	let { 
		id, 
		label, 
		type = 'text', 
		value, 
		placeholder, 
		min, 
		max, 
		validator, 
		oninput,
		autofocus = false,
		required = false
	}: Props = $props();

	let validation = $state<ValidationResult>({ isValid: true });
	let touched = $state(false);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value;
		
		touched = true;
		
		if (validator) {
			validation = validator(newValue);
		}
		
		oninput(newValue);
	}

	function handleBlur() {
		touched = true;
		if (validator && value) {
			validation = validator(value);
		}
	}

	const showError = $derived(touched && !validation.isValid);
</script>

<Field>
	<Label for={id}>
		{label}
		{#if required}<span class="text-red-500" aria-label="required">*</span>{/if}
	</Label>
	<Input 
		{id}
		{type}
		{value}
		{placeholder}
		{min}
		{max}
		{autofocus}
		oninput={handleInput}
		onblur={handleBlur}
		aria-invalid={showError}
		aria-describedby={showError ? `${id}-error` : undefined}
		class={showError ? 'border-red-500' : ''}
	/>
	{#if showError}
		<div 
			id="{id}-error" 
			class="text-red-600 text-sm mt-1" 
			role="alert"
			aria-live="polite"
		>
			{validation.error}
		</div>
	{/if}
</Field>