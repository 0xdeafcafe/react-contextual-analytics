import React, { createContext } from 'react';
import { AnalyticsClient } from './client';

export interface AnalyticsRootContextProperties {
	client: AnalyticsClient | undefined;
}

export interface AnalyticsRootProviderProps {
	client: AnalyticsClient | undefined;
}

export const AnalyticsContext = createContext<AnalyticsRootContextProperties>({
	client: void 0,
});

export const AnalyticsProvider: React.FC<React.PropsWithChildren<AnalyticsRootProviderProps>> = (props) => {
	const { children, client } = props;

	return (
		<AnalyticsContext.Provider value={{ client }}>
			{children}
		</AnalyticsContext.Provider>
	);
};
