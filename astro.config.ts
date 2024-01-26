import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';
import expressiveCode from 'astro-expressive-code';

import vtbot from "astro-vtbot";

// https://astro.build/config
export default defineConfig({
	prefetch: false,
	markdown: {
		remarkPlugins: [remarkToc],
		shikiConfig: {
			experimentalThemes: {
				light: 'github-light',
				dark: 'github-dark'
			},
			wrap: false
		}
	},
	trailingSlash: 'always',
	integrations: [expressiveCode(), mdx(), vtbot({ loadingIndicator: false })],
	vite: {
		server: {
			fs: {
				allow: ['/home/']
			}
		}
	}
});
