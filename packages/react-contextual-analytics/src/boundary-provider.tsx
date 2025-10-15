import React, { createContext, useContext, useEffect } from 'react';
import { useUnsafeInternalEmitter } from './use-analytics';
import { Map, PropsWithEmitterChild } from './types';

export interface AnalyticsBoundaryContextProperties {
	name: string;
	attributes?: Map;
	sendViewedEvent?: boolean;
}

interface AnalyticsBoundaryProviderProps extends AnalyticsBoundaryContextProperties { }

export const AnalyticsBoundaryContext = createContext<AnalyticsBoundaryContextProperties | null>(null);

export const AnalyticsBoundary: React.FC<PropsWithEmitterChild<AnalyticsBoundaryProviderProps>> = (props) => {
	const { children, name, attributes, sendViewedEvent } = props;
	const parentBoundary = useContext(AnalyticsBoundaryContext);

	const fullName = parentBoundary ? `${parentBoundary.name}.${name}` : name;
	const fullAttributes = {
		...parentBoundary?.attributes,
		...attributes,
	};

	const { emit } = useUnsafeInternalEmitter({
		boundaryOverride: { name: fullName, attributes: fullAttributes },
	});

	useEffect(() => {
		if (sendViewedEvent) emit('viewed');
	}, [fullName, sendViewedEvent]);

	return (
		<AnalyticsBoundaryContext.Provider value={{ name: fullName, attributes: fullAttributes }}>
			{typeof children === 'function' ? children(emit) : children}
		</AnalyticsBoundaryContext.Provider>
	);
};
