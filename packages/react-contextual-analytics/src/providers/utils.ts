import { Event } from '../event';
import { Map } from '../types';

export function flattenEvent(event: Event, keyTransformer?: { pattern: RegExp, replacement: string }): Map {
	const out: Map = {
		version: event.version,
		boundary: event.boundary,
		name: event.name,
		action: event.action,
		...event.attributes,
		...event.context,
	};

	if (!keyTransformer)
		return out;
	
	return Object.keys(out).reduce<Map>((acc, val) => ({
		...acc,
		[val.replace(keyTransformer.pattern, keyTransformer.replacement)]: out[val],
	}), {});
}
