import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';
import expressiveCode from 'astro-expressive-code';
import starlight from "@astrojs/starlight";


// https://astro.build/config
export default defineConfig({
	prefetch: true,
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
	integrations: [expressiveCode(), mdx()],
	vite: {
		server: {
			fs: {
				allow: ['/home/']
			},
		},
	},
});
