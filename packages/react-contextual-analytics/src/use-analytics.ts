import { useContext } from 'react';
import { AnalyticsBoundaryContext, AnalyticsBoundaryContextProperties } from './boundary-provider';
import { AnalyticsContext } from './analytics-provider';
import { EventOptions } from './event';
import type { Map } from './types';

export interface AnalyticsEmitter {
	(action: string, name?: string, attributes?: Map, options?: EventOptions): void;
}

interface UseAnalyticsReturnType {
	emit: AnalyticsEmitter;
}

export function useAnalytics(attributes?: Map): UseAnalyticsReturnType {
	const rootContext = useContext(AnalyticsContext);
	const boundaryContext = useContext(AnalyticsBoundaryContext);

	const emit: AnalyticsEmitter = (
		action: string,
		name?: string,
		eventAttributes?: Map,
		options?: EventOptions,
	): void => {
		rootContext.client?.emit(
			action,
			name,
			boundaryContext?.name,
			{
				...boundaryContext?.attributes,
				...eventAttributes,
				...attributes,
			},
			options,
		);
	}

	return { emit };
}

export interface UnsafeInternalEmitterOptions {
	boundaryOverride?: AnalyticsBoundaryContextProperties;
}

/** This function is used inside the AnalyticsFlowProvider and AnalyticsObjectProvider
 *  components and shouldn't ever be used elsewhere. Use the `useAnalyticsEmitter`
 *  hook, or the provider render function for emitting application events.
 */
export function useUnsafeInternalEmitter(options: UnsafeInternalEmitterOptions): UseAnalyticsReturnType {
	const rootContext = useContext(AnalyticsContext);
	const boundaryContext = useContext(AnalyticsBoundaryContext);

	const emit: AnalyticsEmitter = (
		action: string,
		name?: string,
		attributes?: Map,
		eventOptions?: EventOptions,
	): void => {
		rootContext.client?.emit(
			action,
			name,
			options.boundaryOverride?.name ?? boundaryContext?.name,
			{
				...(options.boundaryOverride?.attributes ?? boundaryContext?.attributes),
				...attributes,
			},
			eventOptions,
		);
	}

	return { emit };
}
