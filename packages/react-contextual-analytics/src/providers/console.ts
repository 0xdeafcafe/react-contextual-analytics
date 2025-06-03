import { Provider } from '../types';

export default {
	id: 'console',
	send: event => {
		console.dir(event, { depth: null });
	},
} as Provider;
