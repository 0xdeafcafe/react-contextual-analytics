import React from 'react';
import { AnalyticsEmitter } from './use-analytics';
import { Event } from './event';

export interface Map {
	[k: string]: unknown;
}

export type PropsWithEmitterChild<T> = T & {
	children: React.ReactNode | ((emitter: AnalyticsEmitter) => React.ReactNode | undefined),
};

export interface Provider {
	/**
	 * The unique identifier for the provider.
	 */
	id: string;

	/**
	 * Send an event to the provider.
	 */
	send: (event: Event) => Promise<void>;

	/**
	 * Optional setup function to run when the provider is initialised.
	 */
	setup?: () => void;
}
