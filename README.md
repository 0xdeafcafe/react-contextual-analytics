# react-contextual-analytics

React Contextual Analytics (RCA) is a framework for collecting and emitting analytics events to various providers.

RCA has focuses on improving the developer experience of analytics collection, by providing an API that reduces the amount of code and data usually needed in components to make analytics events useful.

## Overview

The is based around contexts, which are defined over code boundaries to name and collect additional context as react renders down the component tree. This way when an event is emitted, the majority of the wanted data is already known, making the call to the emitter as simple as possible.

## Getting started

### Installation

Install the package using your preferred package manager:

```bash
# Using npm
npm install react-contextual-analytics

# Using yarn
yarn add react-contextual-analytics

# Using pnpm
pnpm add react-contextual-analytics
```

### Basic Setup

1. First, create an analytics client with your desired providers:

```typescript
import { createAnalyticsClient } from 'react-contextual-analytics';
import { console, google } from 'react-contextual-analytics/providers';

const analyticsClient = createAnalyticsClient([
	console, // For development logging
	google,  // For Google Analytics
]);
```

2. Wrap your application with the `AnalyticsProvider`:

```typescript
import { AnalyticsProvider } from 'react-contextual-analytics';

function App() {
	return (
		<AnalyticsProvider client={analyticsClient}>
			<YourApp />
		</AnalyticsProvider>
	);
}
```

3. Start collecting analytics by wrapping components with `AnalyticsBoundary`:

```typescript
import { AnalyticsBoundary } from 'react-contextual-analytics';

function ProductPage({ productId }) {
	return (
		<AnalyticsBoundary 
			name="product-page"
			attributes={{ productId }}
			sendViewedEvent={true}
		>
			<ProductDetails />
			<AddToCartButton 
				onClick={() => emit('clicked', 'add-to-cart')}
			/>
		</AnalyticsBoundary>
	);
}
```

### Next Steps

- Learn more about [Analytics Boundaries](#analytics-boundary) for organizing your analytics hierarchy
- Explore the [useAnalytics hook](#useanalytics-emitter) for emitting events from anywhere in your components
- Check out the [Event Structure](#event-structure) to understand what data is collected
- Create [Custom Providers](#making-a-custom-sentry-provider) to integrate with your analytics tools

## Analytics client

To avoid too much coupling, the base analytics client is completely detached from React, and can be used globally around the application.

## Context providers

### `AnalyticsProvider`

The provider takes in an initalised client, and sets up the context to make this whole thing work.

```typescript
import { AnalyticsProvider, createAnalyticsClient } from 'react-contextual-analytics';
import { console, google } from 'react-contextual-analytics/providers';

const analyticsClient = createAnalyticsClient([
	console,
	google,
]);

const App = ({ children }) => {
	return (
		<AnalyticsProvider client={analyticsClient}>
			{children}
		</AnalyticsProvider>
	);
}
```

### `AnalyticsBoundary`

A boundary is used to define logical hierarchy to your events. When an event is emitted, the library traversed back up the context tree, to build up appropriate context for the event. Nested boundaries will have their context merged into the event context, and names appended.

The boundary children can be either a react node, or an emitter callback, which must return a react node. You can also optionally set `sendViewedEvent` to true to automatically emit a 'viewed' event when the boundary mounts.

#### Example using emitter callback

```typescript
import { AnalyticsBoundary } from 'react-contextual-analytics/src/boundary-provider';
import { useCheckout } from './real-api/checkout';

const Checkout = () => {
	const { checkoutId } = useCheckout();

	return (
		<AnalyticsBoundary 
			name={'checkout'} 
			attributes={{ checkoutId }}
			sendViewedEvent={true}
		>
			{({ emit }) => (
				<>
					<CheckoutHeader />
					<CheckoutBody />
					<CheckoutFooter />
					<CheckoutInfo />
					<CheckoutPurchaseButton
						onClick={() => emit('clicked', 'purchase', {
							exampleAttribute: 'user commits, buys stuff, bravo',
						})}
					/>
					<CheckoutCancelButton
						onClick={() => emit('clicked', 'cancel', {
							exampleAttribute: 'user chickened out, lame',
						})}
					/>
				</>
			)}
		</AnalyticsBoundary>
	);
}
```

#### Example using react node

```typescript
import { AnalyticsBoundary } from 'react-contextual-analytics/src/boundary-provider';
import { useCheckout } from './real-api/checkout';

const Checkout = () => {
	const { checkoutId } = useCheckout();

	return (
		<AnalyticsBoundary 
			name={'checkout'} 
			attributes={{ checkoutId }}
			sendViewedEvent={true}
		>
			<CheckoutHeader />
			<CheckoutBody />
			<CheckoutFooter />
			<CheckoutInfo />
			<CheckoutButtons />
		</AnalyticsBoundary>
	);
}
```

### `useAnalytics` emitter

If the boundary scope is not a suitable place to emit an event, you can use the `useAnalytics` hook to get an emitter function, and call it anywhere. It'll be aware of the current boundary context, and will emit the event with the correct context.

```typescript
import { useAnalytics } from 'react-contextual-analytics/src/use-analytics';

const Checkout = () => {
	const { emit } = useAnalytics();

	return (
		<div>
			<button onClick={() => emit(
				'clicked',
				'purchase',
				{ sexyButton: 'oui' },
				{ omitContext: true }
			)}>
				{'Checkout'}
			</button>
		</div>
	);
}
```

## Events

When we want to emit an event, we need an `action` and optionally a `name`, with attributes being optional. Any flow or object names or properties from above will be attached. There is also various global context which is added to the event too, inside the `context` property, these can be opted out of at an event level by passing in options.

### Event structure

```typescript
export interface Event {
	version: '2025-05-29';
	action: string;
	name?: string;
	boundary?: string;
	attributes?: Record<string, unknown>;
	context?: {
		href: string;
		windowWidth: number;
		windowHeight: number;
		userAgent: string;
	};
}

export interface EventOptions {
	omitContext?: boolean;
}
```

## Analytics providers

Any provider registered when the analytics client is setup will recieve every event. The core logic of this is abstracted into the library, and the library comes with a few providers out of the box. But if you need something a little more _you_, you can implement your own provider.

The only requirement for a provider is that it implements the `Provider` interface, and returns an emitter function.

### Provider structure

The provider interface is as follows:

```typescript
export interface Provider {
	id: string;
	send: (event: Event) => Promise<void>;
	setup?: () => void;
}
```

### Making a custom Sentry provider

To make a custom provider, you need to implement the `Provider` interface, and return a `send` function. The `send` function will receive the event, and you can do with it as you please.

```typescript
import { captureBreadcrumb } from '@sentry/react';

export default {
	id: 'sentry',
	send: (event: Event) => {
		captureBreadcrumb({
			message: [
				event.boundary,
				event.name,
				event.action,
			].filter(Boolean).join(' '),
			level: 'info',
		});
	},
	setup: () => {},
} as Provider;
```
