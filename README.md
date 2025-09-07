# react-contextual-analytics

[![npm version](https://badge.fury.io/js/react-contextual-analytics.svg)](https://badge.fury.io/js/react-contextual-analytics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-contextual-analytics)](https://bundlephobia.com/package/react-contextual-analytics)
[![Build Status](https://github.com/0xdeafcafe/react-contextual-analytics/workflows/CI/badge.svg)](https://github.com/0xdeafcafe/react-contextual-analytics/actions)
[![Coverage](https://img.shields.io/codecov/c/github/0xdeafcafe/react-contextual-analytics)](https://codecov.io/gh/0xdeafcafe/react-contextual-analytics)

A React framework for collecting and emitting analytics events with minimal boilerplate. Automatically collects context through component boundaries, making analytics implementation simpler and more maintainable.

## Quick Start

```bash
# Install
npm install react-contextual-analytics
# or
yarn add react-contextual-analytics
# or
pnpm add react-contextual-analytics
```

```jsx
// 1. Create your analytics client
import { 
	createAnalyticsClient, 
	AnalyticsProvider, 
	AnalyticsBoundary 
} from 'react-contextual-analytics';
import { console, google } from 'react-contextual-analytics/providers';

const analyticsClient = createAnalyticsClient([
	console, // For development logging
	google,  // For Google Analytics
]);

// 2. Wrap your app
function App() {
	return (
		<AnalyticsProvider client={analyticsClient}>
			<YourApp />
		</AnalyticsProvider>
	);
}

// 3. Start collecting analytics
function ProductPage({ product }) {
	return (
		<AnalyticsBoundary 
			name="product-page"
			attributes={{ productId: product.id }}
			sendViewedEvent={true}
		>
			{({ emit }) => (
				<button onClick={() => emit('clicked', 'add-to-cart')}>
					Add to Cart
				</button>
			)}
		</AnalyticsBoundary>
	);
}
```

## Key Concepts

### 1. Context Collection
- Wrap components with `AnalyticsBoundary` to define context
- Context is automatically inherited from parent boundaries
- Events include all relevant context from their location in the tree

```jsx
import { AnalyticsBoundary } from 'react-contextual-analytics';

function StorePage() {
	return (
		<AnalyticsBoundary name="store" attributes={{ storeId: "123" }}>
			<AnalyticsBoundary name="product" attributes={{ productId: "456" }}>
				{({ emit }) => (
					<button onClick={() => emit('clicked', 'view-details')}>
						View Product
					</button>
				)}
			</AnalyticsBoundary>
		</AnalyticsBoundary>
	);
}
// Event includes: { 
//   boundary: "store.product", 
//   context: { storeId: "123", productId: "456" } 
// }
```

### 2. Event Emission
Two ways to emit events:

1. **Using Boundary Callback** (recommended for multiple events):
```jsx
import { AnalyticsBoundary } from 'react-contextual-analytics';

function CheckoutForm() {
	return (
		<AnalyticsBoundary name="checkout" attributes={{ step: 'payment' }}>
			{({ emit }) => (
				<div>
					<button onClick={() => emit('clicked', 'purchase', {
						amount: 99.99,
						productId: '123'
					})}>
						Buy Now
					</button>
					<button onClick={() => emit('clicked', 'cancel')}>
						Cancel
					</button>
				</div>
			)}
		</AnalyticsBoundary>
	);
}
```

2. **Using Hook** (for single events):
```jsx
import { useAnalytics } from 'react-contextual-analytics';

function AddToCartButton({ productId }) {
	const { emit } = useAnalytics();
	
	return (
		<button 
			onClick={() => emit('clicked', 'add-to-cart', { productId })}
		>
			Add to Cart
		</button>
	);
}
```

### 3. Event Structure
```typescript
interface Event {
	action: string;      // e.g., 'clicked', 'viewed'
	name?: string;       // e.g., 'add-to-cart', 'purchase'
	boundary?: string;   // e.g., 'store.product'
	attributes?: object; // Event-specific data
	context?: {          // Automatically collected
		href: string;
		windowWidth: number;
		// ... other global context
	};
}
```

## Best Practices

1. **Boundary Organization**
	- Place boundaries around logical sections (pages, features, forms)
	- Keep hierarchy shallow (2-3 levels)
	- Use meaningful names

2. **Context Management**
	- Define context at highest relevant level
	- Use consistent attribute names
	- Avoid context duplication

3. **Event Naming**
	- Use consistent actions: 'clicked', 'viewed', 'submitted'
	- Make names descriptive but concise
	- Follow consistent patterns

## Custom Providers

Create custom providers by implementing the Provider interface:

```typescript
interface Provider {
	id: string;
	send: (event: Event) => Promise<void>;
	setup?: () => void;
}

// Example: Sentry Provider
const sentryProvider = {
	id: 'sentry',
	send: (event) => {
		captureBreadcrumb({
			message: [event.boundary, event.name, event.action].filter(Boolean).join(' '),
			level: 'info',
		});
	}
};
```

## API Reference

- `AnalyticsProvider`: Root provider component
- `AnalyticsBoundary`: Context boundary component
- `useAnalytics`: Hook for emitting events
- `createAnalyticsClient`: Create analytics client with providers
