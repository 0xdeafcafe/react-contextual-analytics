import { Event } from '../event';
import { Map } from '../types';

export function flattenEvent(event: Event, keyTransformer?: { pattern: RegExp, replacement: string | ((match: string) => string) }): Map {
	const out: Map = {
		version: event.version,
		boundary: event.boundary,
		name: event.name,
		action: event.action,
		...event.attributes,
		...event.context,
	};

	if (!keyTransformer) return out;
	
	return Object.fromEntries(
		Object.entries(out).map(([key, value]) => {
			const transformedKey = typeof keyTransformer.replacement === 'function'
				? key.replace(keyTransformer.pattern, keyTransformer.replacement)
				: key.replace(keyTransformer.pattern, keyTransformer.replacement);

			const transformedValue = typeof keyTransformer.replacement === 'function' && typeof value === 'string'
				? value.replace(keyTransformer.pattern, keyTransformer.replacement)
				: value;

			return [transformedKey, transformedValue];
		}),
	);
}
