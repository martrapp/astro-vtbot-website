

export function attachShadowRoots(root: HTMLElement|DocumentFragment) {
	root.querySelectorAll<HTMLTemplateElement>("template[shadowrootmode]").forEach(template => {
		if (template.parentElement) {
			const mode = template.getAttribute("shadowrootmode");
			const shadowRoot = template.parentElement.attachShadow({ mode: mode as ShadowRootMode });
			attachShadowRoots(template.content);
			shadowRoot.appendChild(template.content);
			template.remove();
		}
	});
}
