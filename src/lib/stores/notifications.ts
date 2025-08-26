import { writable } from 'svelte/store';

export interface Notification {
	id: string;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration?: number;
}

export const notifications = writable<Notification[]>([]);

export function addNotification(message: string, type: Notification['type'] = 'info', duration = 5000) {
	const id = Date.now().toString();
	const notification: Notification = { id, message, type, duration };
	
	notifications.update(items => [...items, notification]);
	
	if (duration > 0) {
		setTimeout(() => {
			removeNotification(id);
		}, duration);
	}
	
	return id;
}

export function removeNotification(id: string) {
	notifications.update(items => items.filter(item => item.id !== id));
}