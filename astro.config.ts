import { defineConfig } from 'astro/config';
import starlight from "@astrojs/starlight";
import d2 from "astro-d2";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import remarkHeadingID from 'remark-heading-id';
import remarkToc from 'remark-toc';
import vtbot from 'astro-vtbot';
import type { SidebarItem } from 'node_modules/@astrojs/starlight/schemas/sidebar';
import starlightImageZoom from 'starlight-image-zoom';
import starlightUtils from "@lorenzo_lewis/starlight-utils";
import { visualizer } from "rollup-plugin-visualizer";

//import starlightBlog from 'starlight-blog';

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	site: "https://events-3bg.pages.dev/",
	prefetch: process.env.NODE_ENV === "production",
	markdown: {
		rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, {
			behavior: "wrap"
		}], [rehypeExternalLinks, {
			target: "_blank",
			content: {
				type: "text",
				value: "↗"
			}
		}]],
		remarkPlugins: [remarkToc, remarkHeadingID]
	},
	trailingSlash: 'ignore',
	integrations: [d2({
		skipGeneration: process.env.GITHUB_ACTIONS === "true"
	}), vtbot({}), starlight({
		plugins: [//starlightBlog(),
			starlightImageZoom(),
		starlightUtils({
			multiSidebar: {
				switcherStyle: "horizontalList",
			}, navLinks: {
				leading: { useSidebarLabelled: "leading" },
			}
		}),
		],
		tableOfContents: {
			minHeadingLevel: 2,
			maxHeadingLevel: 4
		},
		components: {
			Head: "./src/components/starlight/Head.astro",
			PageTitle: "./src/components/starlight/PageTitle.astro",
			Pagination: "./src/components/starlight/FeelBack.astro",
			//MarkdownContent: "./src/components/MarkdownContent.astro"
		},
		title: "Bag of Tricks",
		head: [{
			tag: "meta",
			attrs: {
				property: "og:image",
				content: "https://events-3bg.pages.dev/social.png"
			}
		}],
		customCss: ["./src/styles/custom.css"],
		description: "The Jotter of the Bag of Tricks for Astro's View Transitions",
		lastUpdated: true,
		pagination: true,
		logo: {
			src: "/node_modules/astro-vtbot/assets/bag-of-tricks.svg"
		},
		social: {
			github: "https://github.com/martrapp/astro-vtbot",
			blueSky: 'https://bsky.app/profile/martr.app'
		},
		editLink: {
			baseUrl: "https://github.com/martrapp/astro-vtbot-website/edit/main/"
		},
		sidebar: [{
			label: "Astro",
			items: sidebar1()
		}, {
			label: "General",
			items: sidebar2()
		}, {
			label: "leading",
			items: [{
				label: "[C]",
				link: "/components/"
			}, {
				label: "[D]",
				link: "/demos/"
			}]
		}]
	}), react()],
	vite: {
		build: {
			rollupOptions: {
				external: ["/z.ts"]
			}
		},
		server: {
			fs: {
				allow: ['/Users/', '/home/']
			}
		},
		plugins: [visualizer({
			brotliSize: true
		})]
	}
});
function sidebar1() {
	return ([{
		label: "Bag of Tricks",
		items: [{
			label: "A Brief History of The Bag",
			link: "/jotter/history/"
		}, {
			label: "Tech-Demos",
			link: "/jotter/demos/"
		}, {
			label: "Reusable Components",
			link: "/jotter/components/"
		}, {
			label: "The Jotter",
			link: "/jotter/"
		}, {
			label: "Recent Changes",
			link: "/jotter/history-of-changes/",
			badge: {
				text: "start here when re-visiting",
				variant: "success"
			}
		}]
	}, {
		label: "Astro View Transitions",
		items: [{
			label: "<View Transitions />",
			link: "/jotter/astro/"
		}, {
			label: "Transition Directives",
			link: "/jotter/astro/directives/"
		}, {
			label: "Global Flow & Events",
			link: "/jotter/astro/flow-events/"
		}, {
			label: "Loading and Swapping",
			link: "/jotter/astro/loader-swap/"
		}, {
			label: "How Simulation and API differ",
			link: "/jotter/astro/differences/"
		}, {
			label: "Re-initialize Scripts after Transition",
			link: "/jotter/astro/scripts/"
		}]
	}, {
		label: "The Jotter on Starlight",
		items: [{
			label: "Introduction",
			link: "/jotter/starlight/"
		}, {
			label: "Guide: Adding View Transitions",
			link: "/jotter/starlight/guide/"
		}, {
			label: "The Inner Workings",
			items: [{
				label: "Overview",
				link: "/jotter/starlight/inner-workings/"
			}, {
				label: "Hooking into Starlight",
				link: "/jotter/starlight/inner-workings/integration/"
			}, {
				label: "Managing the App State",
				link: "/jotter/starlight/inner-workings/app-state/"
			}, {
				label: "Updating the Sidebar",
				link: "/jotter/starlight/inner-workings/sidebar/"
			}, {
				label: "Defining Transitions",
				link: "/jotter/starlight/inner-workings/transitions/"
			}]
		}]
	}, {
		label: "Lost & Found / to be Curated",
		autogenerate: {
			directory: "jotter/snippets"
		}
	}] as SidebarItem[]);
}
function sidebar2() {
	return ([{
		label: "Browser View Transition API",
		items: [{
			label: "Browser Support",
			link: "/jotter/api/test-page/"
		}, {
			label: "API Overview",
			link: "/jotter/api/"
		}, {
			label: "API Details",
			link: "/jotter/api/details/"
		}, {
			label: "In-Depth Example",
			link: "/jotter/api/example/"
		}, {
			label: "References",
			link: "/jotter/api/references/"
		}]
	}] as SidebarItem[]);
}
