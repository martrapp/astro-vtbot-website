import { TRANSITION_PAGE_LOAD } from 'astro:transitions/client';

export function theme() {
	[...document.querySelectorAll('iframe')].forEach((iframe) => {
		if (iframe instanceof HTMLIFrameElement && iframe.contentDocument) {
			iframe.contentDocument.documentElement.dataset.theme = document.documentElement.dataset.theme;
		}
	});
}

const observer = new MutationObserver(theme);
observer.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ['data-theme'],
});
document.addEventListener(TRANSITION_PAGE_LOAD, () => setTimeout(theme, 100));
