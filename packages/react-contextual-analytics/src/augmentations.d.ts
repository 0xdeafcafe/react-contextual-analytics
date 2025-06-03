import type { AnalyticsClient } from './client';
import type { Event } from './event';

declare global {
	interface Window {
		__0xdeafcafe_rca__?: AnalyticsClient | undefined;

		gtag?: {
			event: (name: string, event: Event) => void;
		}
	}
}
