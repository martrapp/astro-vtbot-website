import { defineConfig } from 'astro/config';
import starlight from "@astrojs/starlight";
import starlightLinksValidator from "starlight-links-validator";
import d2 from "astro-d2";

import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';

import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';

import remarkToc from 'remark-toc';

import vtbot from 'astro-vtbot';

// https://astro.build/config
export default defineConfig({
	site: "https://events-3bg.pages.dev/",
	prefetch: true,
	markdown: {
		rehypePlugins: [
			rehypeSlug,
			[rehypeAutolinkHeadings, { behavior: "wrap" }],
			[
				rehypeExternalLinks,
				{
					target: "_blank",
					content: { type: "text", value: "↗" },
				},
			],
		],
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
	integrations: [d2(), expressiveCode(), vtbot({ autoLint: false }),
	starlight({
		title: "Bag of Tricks",
		customCss: ["./src/styles/custom.css"],
		description:
			"The Jotter of the Bag of Tricks for Astro's View Transitions",
		lastUpdated: true,
		pagination: true,
		logo: {
			src: "/public/favicon.svg",
		},
		expressiveCode: {
			styleOverrides: {
				borderRadius: "0.5rem",
			},
			plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
		},
		social: {
			github: "https://github.com/martrapp/astro-vtbot",
		},
		editLink: {
			baseUrl: "https://github.com/martrapp/astro-vtbot-starlight/edit/main/",
		},
		components: {
			Head: "./src/components/starlight/Head2.astro",
		},
		sidebar: sidebar(),
		plugins: [starlightLinksValidator()],
	}), mdx()],
	vite: {
		server: {
			fs: {
				allow: ['/home/'],
			},
		},
	},
});
function sidebar() {
	return [
		{
			label: "The Jotter",
			link: "/jotter/",
		},
		{
			label: "A Brief History of The Bag",
			link: "/jotter/history/",
		},
		{
			label: "Astro View Transition Support",
			items: [
				{ label: "Overview", link: "/jotter/astro/" },
				{ label: "Transition Directives", link: "/jotter/astro/directives/" },
				{ label: "Global Flow & Events", link: "/jotter/astro/flow-events/" },
				{ label: "Loading and Swapping", link: "/jotter/astro/loader-swap/" },
				{ label: "Limitations of the Simulation", link: "/jotter/astro/limitations/" }
			],
		},
		{
			label: "Browser View Transitions API",
			items: [
				{ label: "API Overview", link: "/jotter/api/" },
				{ label: "API Details", link: "/jotter/api/details/" },
				{ label: "In Depth Example", link: "/jotter/api/example/" },
				{ label: "References", link: "/jotter/api/references/" },
			],
		},
		{ label: "The Jotter on Starlight", link: "/jotter/on-starlight/" },
		{
			label: "Lost & Found / to be Curated",
			autogenerate: {
				directory: "jotter/snippets",
			},
		},
	];
}
