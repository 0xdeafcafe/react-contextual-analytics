import { isBrowser } from './utils/is-browser';
import { Event, EventOptions } from './event';
import { Provider } from './types';

export interface AnalyticsClient {
	emit: (
		action: string,
		name?: string,
		boundary?: string,
		attributes?: Record<string, unknown>,
		options?: EventOptions,
	) => Promise<void>;
	providers: Provider[];
}

/**
 * Create an analytics client.
 * 
 * @param providers - The providers to use.
 * @param loggingEnabledHostnames - The hostnames where logging should be enabled.
 * @returns The analytics client.
 */
export function createAnalyticsClient(
	providers: Provider[],
	loggingEnabledHostnames: string[] = ['localhost', '127.0.0.1']
): AnalyticsClient {
	if (!isBrowser) {
		console.warn('Analytics client is not available in the server');

		return {
			emit: () => Promise.resolve(),
			providers: [],
		};
	}

	async function emit(
		action: string,
		name?: string,
		boundary?: string,
		attributes?: Record<string, unknown>,
		options?: EventOptions,
	) {
		// Create event
		const event: Event = {
			version: '2025-05-29',
			boundary,
			action,
			name,
			attributes: { ...attributes },
			context: {
				// TODO(afr): Pull in more global context
				href: window.location.href,
				windowWidth: window.innerWidth,
				windowHeight: window.innerHeight,
				userAgent: window.navigator.userAgent,
			},
		};

		// Handle options
		const opts: EventOptions = options ?? {};

		if (opts.omitContext) event.context = void 0;

		// Check if we should output console logs of events
		const shouldPrintLogs = typeof window !== 'undefined' && loggingEnabledHostnames.includes(window.location.hostname);

		if (shouldPrintLogs) {
			console.group('Analytics event:');
			console.dir(event, { depth: null });
			console.groupEnd();
		}

		// Fire events to all providers
		await Promise.all(providers.map(async p => {
			try {
				await p.send(event);
			} catch (error) {
				console.error(`analytic provider ${p.id} failed`, event);
			}
		}));
	}

	const client: AnalyticsClient = {
		emit,
		providers,
	};

	if (isBrowser) {
		window.__0xdeafcafe_rca__ = client;
	}

	return client;
}
