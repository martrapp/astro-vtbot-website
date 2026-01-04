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
//import starlightUtils from "@lorenzo_lewis/starlight-utils";

//import starlightBlog from 'starlight-blog';

export default defineConfig({
	site: "https://events-3bg.pages.dev/",
	experimental: {
		preserveScriptOrder: true,
	},
	devToolbar: { enabled: false },
	prefetch: false && process.env.NODE_ENV === "production",
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
	}), vtbot({ loadingIndicator: true, autoLint: false }), starlight({
		plugins: [//starlightBlog(),
			starlightImageZoom(),
			/*
			starlightUtils({
				multiSidebar: {
					switcherStyle: "horizontalList",
				}, navLinks: {
					leading: { useSidebarLabelled: "leading" },
				}
			})*/
		],
		tableOfContents: {
			minHeadingLevel: 2,
			maxHeadingLevel: 4
		},
		components: {
			Head: "./src/components/starlight/Head.astro",
			PageTitle: "./src/components/starlight/PageTitle.astro",
//			Pagination: "./src/components/starlight/FeelBack.astro",
		},
		title: "Bag of Tricks",
		head: [{
			tag: "meta",
			attrs: {
				property: "og:image",
				content: "https://events-3bg.pages.dev/social.png"
			}
		}, {
			tag: "meta",
			attrs: {
				name: "viewport",
				content: "width=device-width, initial-scale=1.0, minimum-scale=1.0"

			}
		}],
		customCss: ["./src/styles/custom.css"],
		description: "The Jotter of the Bag of Tricks for Astro's View Transitions",
		lastUpdated: true,
		pagination: true,
		logo: {
			src: "/node_modules/astro-vtbot/assets/bag-of-tricks.svg"
		},
		social: [
			{ icon: 'github', label: 'GitHub', href: "https://github.com/martrapp/astro-vtbot" },
			{ icon: 'blueSky', label: 'BlueSky', href: 'https://bsky.app/profile/martr.app' }
		],
		editLink: {
			baseUrl: "https://github.com/martrapp/astro-vtbot-website/edit/main/"
		},
		sidebar: sidebar1(),
		/*[{
			label: "Astro",
			items: sidebar1()
		}, {
			label: "General",
			items: sidebar2()
		},{
			label: "leading",
			items: [{
				label: "[C]",
				link: "/components/"
			}, {
				label: "[D]",
				link: "/demos/"
			}]*/
	})],
	vite: {
		build: {
			assetsInlineLimit: 0,
			rollupOptions: {
				external: ["/z.ts"]
			}
		},
		server: {
			fs: {
				allow: ['/Users/', '/home/']
			}
		},
	}
});
function sidebar1() {
	return ([{
		label: "Bag of Tricks",
		items: [{
			label: "A Brief History of The Bag",
			link: "/jotter/history/"
		}, {
			label: "ClientRouter Migration?", collapsed: true,
			items: [{
				label: "High Level Considerations",
				link: "/jotter/astro-view-transitions/"
			}, {
				label: "Feature Comparison",
				link: "/jotter/feature-comparison/"
			}, {
				label: "Migration Path",
				link: "/jotter/migrate/"
			}]
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
			label: "Overview",
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
		}, {
			label: "Extended Styling",
			link: "/jotter/styling/",
		}, {
			label: "Same-Document View Transitions",
			link: "/jotter/same-doc/"
		}, {
			label: "Supported in all Major Browsers",
			link: "/jotter/in-all-major-browsers/",
		}
		]
	}, {
		label: "Tips & Tricks", collapsed: false,
		items: [{
			label: "Introduction",
			link: "/jotter/tips/",
		}, {
			label: "Instant History Scrolling",
			link: "/jotter/tips/instant-scrolling-history-navigation/",
		}, {
			label: "Fix Flash of Unstyled Content",
			link: "/jotter/tips/flash-of-unstyled-content-during-view-transition/",
			badge: { text: "new", variant: "success" }
		} ]
	}, {
		label: "Starlight", collapsed: false,
		items: [{
			label: "Introduction",
			link: "/jotter/starlight/",
			badge: { text: "new", variant: "success" }
		}, {
			label: "Guide: Adding View Transitions",
			link: "/jotter/starlight/guide/"
		}, {
			label: "The Inner Workings", collapsed: true,
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
/*
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
*/
