import adapter from '@sveltejs/adapter-static';
import { relative, sep, resolve } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			$: resolve('./src')
		},
		output: {
			bundleStrategy: 'single'
		}
	}
};

export default config;