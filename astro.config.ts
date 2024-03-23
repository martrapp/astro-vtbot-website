import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import { defineConfig } from 'astro/config';
import remarkToc from 'remark-toc';

import vtbot from 'astro-vtbot';

// https://astro.build/config
export default defineConfig({
	prefetch: false,
	markdown: {
		remarkPlugins: [remarkToc],
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			wrap: false,
		},
	},
	trailingSlash: 'always',
	integrations: [expressiveCode(), mdx(), vtbot()],
	vite: {
		server: {
			fs: {
				allow: ['/home/'],
			},
		},
	},
});
