import { Provider } from '../types';

export default {
	id: 'google',
	send: event => {
		const name = [
			event.boundary,
			event.name,
			event.action,
		].filter(Boolean).join(' ');

		if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'object' && 'event' in window.gtag) {
			window.gtag.event(name, event);
		} else {
			console.warn('gtag is not available');
		}
	},
} as Provider;
