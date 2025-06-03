import type { Map } from './types';

export interface EventOptions {
	omitContext?: boolean;
}

export interface EventGlobalContext {
	href?: string;
	windowWidth?: number;
	windowHeight?: number;
	userAgent?: string;
}

export interface Event {
	version: '2025-05-29';
	action: string;
	name?: string;
	boundary?: string;
	attributes?: Map;
	context?: EventGlobalContext;
}
