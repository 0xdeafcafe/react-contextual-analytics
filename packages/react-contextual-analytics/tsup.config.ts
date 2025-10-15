import { defineConfig } from 'tsup';

export default defineConfig({
	entry: [
		'src/index.ts'
	],
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	minify: true,
	clean: true,
	target: 'es2020',
	platform: 'browser',
	splitting: false,
	external: ['react', 'react-dom', 'react/jsx-runtime'],
});


