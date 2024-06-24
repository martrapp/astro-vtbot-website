import { elementsWithStyleProperty } from 'node_modules/astro-vtbot/components/css';
import { deriveCSSSelector } from 'node_modules/astro-vtbot/components/derive-css-selector';

import bench from "./bench.html?raw";

declare global {
	interface Window {
		__vtbot: {
			framed?: boolean;
		};
	}
}

type Modus = 'bypass' | 'slow-motion' | 'control' | 'compare';
const endProps = [
	'height',
	'inset',
	'perspective-origin',
	'transform',
	'transform-origin',
	'width',
];
const basicProps = [
	...endProps,
	'animation',
	'direction',
	'position',
	'text-orientation',
	'writing-mode',
];

let outerViewTransition: ViewTransition | undefined;
function mayViewTransition(fun: () => void, name: string, disabled = false) {
	if (outerViewTransition) console.warn(name + ': OuterView Transition already in progress');

	if (
		disabled ||
		document.documentElement.classList.contains('vtbot-vt-active') ||
		outerViewTransition ||
		!document.startViewTransition
	) {
		fun();
	} else {
		outerViewTransition = document.startViewTransition(fun);
		outerViewTransition.finished.finally(() => (outerViewTransition = undefined));
	}
}

let viewTransition: ViewTransition | undefined;
let animations: Animation[] | undefined;
let animationMap: Map<string, Animation> | undefined;
let animationDuration = 0;
type Twin = { animations: Animation[]; dom: HTMLElement; map: Map<string, HTMLElement>; };

let twin: Twin | undefined;

function retrieveViewTransitionAnimations(doc: Document) {
	animations = [];
	animationMap = new Map();

	const set = new WeakSet();
	let growing = true;
	while (growing) {
		growing = false;
		doc.getAnimations().forEach((a) => {
			if (
				!set.has(a) &&
				//@ts-ignore
				a.effect?.pseudoElement?.startsWith('::view-transition') &&
				a.playState !== 'finished'
			) {
				animations?.push(a);
				animationMap?.set((a as CSSAnimation).animationName, a);
				a.pause();
				a.currentTime = 0;
//				growing = true;
			}
			set.add(a);
		});
		//growing && (await new Promise((r) => setTimeout(r)));
	}
	const names = new Set<string>();
	animationDuration = ~~animations.reduce(
		(acc, anim) => (
			names.add(viewTransitionNameOfAnimation(anim)),
			Math.max(acc, (anim.effect?.getComputedTiming().activeDuration?.valueOf() as number) ?? 0)
		),
		0
	);

	twin = { animations: [], dom: doc.createElement('div'), map: new Map<string, HTMLElement>() };
	const styles: string[] = [];
	addToTwin(twin.dom, doc, '', '', styles);
	twin.dom = twin.dom.firstElementChild as HTMLElement;
	names.forEach((name: string) => {
		const group = addToTwin(twin!.dom, doc, 'group', name, styles);
		const pair = addToTwin(group, doc, 'image-pair', name, styles);
		addToTwin(pair, doc, 'old', name, styles);
		addToTwin(pair, doc, 'new', name, styles);
	});

	[...twin.dom.children].forEach(async (g) => {
		const name = g.id.substring('vtbot-twin--view-transition-group-'.length);
		const anim = animationMap!.get(`-ua-view-transition-group-anim-${name}`);
		if (anim) {
			const savedTime = anim.currentTime;
			anim.currentTime = animationDuration * 2;
			const endStyle = doc.defaultView!.getComputedStyle(
				doc.documentElement,
				`::view-transition-group(${name})`
			);
			const gStyle = (g as HTMLElement).style;
			endProps.forEach((property) =>
				gStyle.setProperty(property, endStyle.getPropertyValue(property))
			);
			anim.currentTime = savedTime;
		}
	});
	setStyles(
		doc,
		`
@keyframes vtbot-twin-fade-out {
to { opacity: 0; }
}
@keyframes vtbot-twin-fade-in {
from { opacity: 0; }
}
` + styles.join('\n'),
		'keyframes'
	);
	doc.body.insertAdjacentElement('beforeend', twin.dom);

	growing = true;
	while (growing) {
		growing = false;
		doc.getAnimations().forEach(async (a) => {
			//@ts-ignore
			const target = a.effect?.target;
			if (
				!set.has(a) &&
				target.id.startsWith('vtbot-twin--view-transition') &&
				a.playState !== 'finished'
			) {
				twin!.animations?.push(a);
				const animationName = (a as CSSAnimation).animationName;
				animationMap?.set(animationName, a);
				a.pause();
				a.currentTime = 0;
		//		growing = true;
			}
			set.add(a);
		});
	//	await new Promise((r) => setTimeout(r));
	}
}

const defaultDiv = document.createElement('div');
document.body.appendChild(defaultDiv);
const defaultStyles = getComputedStyle(defaultDiv);
const defaultStyleValues: Record<string, string> = basicProps.reduce(
	(acc: Record<string, string>, prop: string) => (
		(acc[prop] = defaultStyles.getPropertyValue(prop)), acc
	),
	{}
);

function addToTwin(
	dom: HTMLElement | undefined,
	doc: Document,
	pseudo: string,
	name: string,
	keyframes: string[]
) {
	if (!dom) return undefined;
	const win = doc.defaultView!;
	const styles = win.getComputedStyle(
		doc.documentElement,
		pseudo ? `::view-transition-${pseudo}(${name})` : '::view-transition'
	);
	if (styles.height === 'auto') return undefined;
	const elem = doc.createElement('div');
	elem.id = pseudo
		? `vtbot-twin--view-transition-${pseudo}-${name}`
		: 'vtbot-twin--view-transition';
	dom.insertAdjacentElement('beforeend', elem);
	const elemStyle = elem.style;

	basicProps.forEach((prop) => {
		const val = styles.getPropertyValue(prop);
		if (val !== defaultStyleValues[prop]) {
			elemStyle.setProperty(prop, val);
		}
	});

	//elemStyle.visibility = 'hidden';
	elemStyle.border= '1px solid red';
	const buildIn = styles.getPropertyValue('animation-name').split(',')[0];
	if (buildIn && buildIn.startsWith('-ua-view-transition-')) {
		const twin = buildIn.replace('-ua-view-transition', 'vtbot-twin');

		if (buildIn.startsWith('-ua-view-transition-group-')) {
			const anim = animationMap?.get(buildIn);
			if (anim) {
				keyframes.push(generateCSSKeyframes(anim, twin));
			}
		}
		elemStyle.animationName = twin;
	}
	return elem;
}

function generateCSSKeyframes(animation: Animation, keyframesName: string) {
	//@ts-ignore
	const keyframes = animation.effect!.getKeyframes();
	let keyframesRule = `@keyframes ${keyframesName} {`;

	keyframes.forEach((keyframe: Keyframe, idx: number) => {
		if (idx === keyframes.length - 1) return;
		//@ts-ignore
		const percentage = keyframe.computedOffset * 100;
		keyframesRule += `
			${percentage}% {
				${Object.entries(keyframe)
				.filter(([property, _]) => property !== 'offset' && property !== 'computedOffset')
				.map(([property, value]) => `${property}: ${value};`)
				.join(' ')}
			}
		`;
	});

	keyframesRule += '}';
	return keyframesRule;
}

function sloMoPlay() {
	animations?.forEach(
		(a) => (
			(a.playbackRate =
				1.0 /
				Math.max(
					0.000001,
					parseFloat(document.querySelector<HTMLSpanElement>('#vtbot-ui-tsf')?.innerText ?? '1.0')
				)),
			a.playState === 'paused' && a.play()
		)
	);
}

function controlledPlay() {
	document.querySelector<HTMLSpanElement>('#vtbot-ui-controller-max')!.innerText =
		animationDuration + ' ms';
	document.querySelector<HTMLSpanElement>('#vtbot-ui-progress')!.innerText = '0';
	const controller = document.querySelector<HTMLInputElement>('#vtbot-ui-controller')!;
	controller.max = '' + animationDuration;
	controller.value = '0';
	controller.disabled = false;
	document.querySelector<HTMLSpanElement>('#vtbot-ui-progress2')!.innerText = '0';
	const controller2 = document.querySelector<HTMLInputElement>('#vtbot-ui-controller2')!;
	controller2.max = '' + animationDuration;
	controller2.value = '0';
	controller2.disabled = false;
	control();
}

function viewTransitionNameOfAnimation(animation: Animation) {
	//@ts-ignore
	return animation.effect?.pseudoElement?.replace(
		/::view-transition-(new|old|group)\((.*)\)/,
		'$2'
	);
}
function control() {
	if (animations) {
		const selectedTime = parseInt(
			document.querySelector<HTMLSpanElement>('#vtbot-ui-progress')!.innerText
		);
		const otherTime = parseInt(
			document.querySelector<HTMLSpanElement>('#vtbot-ui-progress2')!.innerText
		);
		const selectedElements = new Set<string>();
		document
			.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li.selected')
			.forEach((li) => selectedElements.add(li.innerText));
		animations.forEach((animation) => {
			const name = viewTransitionNameOfAnimation(animation);
			animation.currentTime = selectedElements.has(name) ? selectedTime : otherTime;
			const anima = (animation as CSSAnimation).animationName;
			const twin = animationMap?.get(anima.replace('-ua-view-transition', 'vtbot-twin'));
			if (twin) {
				twin.currentTime = animation.currentTime;
			}
		});
	}
}

function setStyles(doc: Document, styles: string, suffix = '') {
	const id = 'vtbot-adopted-sheet' + (suffix ? '-' + suffix : '');
	doc.getElementById(id)?.remove();
	doc.documentElement.offsetHeight;
	styles && doc.head.insertAdjacentHTML('beforeend', `<style id="${id}">${styles}</style>`);
}

function unleashAllAnimations(doc: Document) {
	doc
		.querySelectorAll('#vtbot-adopted-sheet, #vtbot-twin--view-transition')
		.forEach((e) => e.remove());
	animations?.forEach((a) => {
		try {
			a.finish();
		} catch (e) {
			console.error(e, a, a.effect?.getComputedTiming());
		}
	});
}

const oldGlow = [
	// Keyframes
	{ boxShadow: '0 0  0px blue' },
	{ boxShadow: '0 0 50px blue' },
	{
		boxShadow: '0 0 100px blue',
		display: 'inline-block',
		minWidth: '20px',
		minHeight: '20px',
		backgroundColor: 'mediumblue',
	},
	{ boxShadow: '0 0 50px blue' },
	{ boxShadow: '0 0  0px blue' },
];

function glowPseudo(doc: Document, name: string) {
	setStyles(
		doc,
		`
		::view-transition-old(${name}) {
			box-shadow: 0 0 100px darkslateblue;
			background-color: lightblue;
			transition: all 0.5s;
		}
		::view-transition-new(${name}) {
			box-shadow: 0 0 100px darkolivegreen;
			background-color: lightgreen;
			transition: all 0.5s;
		}`,
		'glow'
	);
	setTimeout(() => setStyles(doc, '', 'glow'), 500);
}
function unframe(doc: Document) {
	setStyles(doc, '');
}
function frame(doc: Document) {
	setStyles(
		doc,
		`
::view-transition-old(*) {
	border: 3px dashed darkslateblue;
}
::view-transition-new(*) {
	border: 3px dashed darkolivegreen;
}
::view-transition-group(*),
[data-vtbot-transition-name] {
	border: 1px dotted darkgoldenrod;
}
:root::view-transition {
	position: absolute;
	inset: 0;
}
`
	);
}

function updateImageVisibility(doc: Document) {
	const rules: string[] = [];

	document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
		const name = li.innerText;
		const classes = li.classList;
		if (classes.contains('old-hidden')) {
			rules.push(`::view-transition-old(${name}) { visibility: hidden; }`);
		}
		if (classes.contains('new-hidden')) {
			rules.push(`::view-transition-new(${name}) { visibility: hidden; }`);
		}
	});
	setStyles(doc, rules.join('\n'), 'image-visibility');
}

function updateAnimationNames(doc: Document) {
	const oldNames = new Set<string>();
	const newNames = new Set<string>();

	animations?.forEach((animation) => {
		//@ts-ignore
		const pseudo = animation.effect.pseudoElement;
		const match = pseudo?.match(/::view-transition-(new|old|group)\((.*)\)/);
		if (match) {
			const name = match[2];
			if (match[1] === 'new') newNames.add(name);
			if (match[1] === 'old') oldNames.add(name);
		}
	});
	const names = updateNames(oldNames, newNames);
	updateNameVisibility(doc);
	return names;
}

function addFrames(doc: Document, show: boolean) {
	show ? frame(doc) : unframe(doc);
}

function updateNameVisibility(doc: Document) {
	const controlMode = document.documentElement.dataset.vtbotModus === 'control';
	document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
		doc.documentElement.offsetHeight;
		const name = li.innerText;
		const classes = li.classList;
		classes.remove('old-invisible', 'new-invisible');

		if (controlMode) {
			if (
				classes.contains('old') &&
				insideViewport(doc.querySelector(`#vtbot-twin--view-transition-old-${name}`)) === false
			)
				classes.add('old-invisible');
			if (
				classes.contains('new') &&
				insideViewport(doc.querySelector(`#vtbot-twin--view-transition-new-${name}`)) === false
			)
				classes.add('new-invisible');
		}
	});
	if (controlMode && document.documentElement.classList.contains('vtbot-vt-active')) {
		setTimeout(() => updateNameVisibility(doc), 100);
	}
}

if (window === window.parent || !window.parent?.__vtbot?.framed) {
	window.__vtbot ??= {};
	window.__vtbot.framed = true;

	window.addEventListener('pageshow', () => {
		const docTitle = document.title;

		setTimeout(async () => {
			const root = document.documentElement;
			const page = bench.replace(
				'<iframe id="vtbot-main-frame" src="/"></iframe>',
				`<iframe id="vtbot-main-frame" style="opacity: 0" src="${location.href}"></iframe>`
			);
			setOrientation();
			root.innerHTML = page;

			document.title = '⛑️ ' + docTitle;
			root.dataset.vtbotModus = '';
			const mainFrame = document.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!;
			await new Promise((r) => (mainFrame.onload = r));
			const frameDocument = mainFrame.contentDocument!;

			if (!document.startViewTransition) {
				document.querySelector('#vtbot-ui-messages')!.innerHTML = `
				<h4>You are &hellip;</h4>
				<p>&hellip; in the <b>Engine Room</b><img style="width:4em; float:right" src="/favicon.svg" /> deep down at the bottom of <b>The Bag!</b></p>
				<p>I'm sorry!</p><p>Native view transitions are required to make the Test Chamber work, but they are not supported by this browser.</p>
				<p>Sadly have to give up.</p>`;
				document
					.querySelectorAll('#vtbot-ui-modi, #vtbot-ui-filter, #vtbot-ui-names, #vtbot-ui-info')
					.forEach((e) => e.remove());
				return;
			}
			const original = frameDocument.startViewTransition;
			frameDocument.startViewTransition = (cb: () => void) => {
				addFrames(frameDocument, false);
				const viewTransition = original.call(frameDocument, ()=>{
					const colorScheme = document.documentElement.style.colorScheme;
					cb();
					document.documentElement.style.colorScheme = colorScheme;
				});
				beforeSwap(viewTransition);
				return viewTransition;
			};

			updateNames(markTransitions(frameDocument));
			initPanelHandlers(mainFrame);
			initGrabbing();
			mainFrame.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 50,
				fill: 'forwards',
			});
			//			frameDocument.addEventListener("astro:before-swap", (e) => beforeSwap(e.viewTransition));
			frameDocument.addEventListener("astro:after-swap", () => {
				history.replaceState(history.state, '', mainFrame.contentWindow!.location.href);
			});
			frameDocument.addEventListener('click', innerClick);
		}, 500);
	});
}

function beforeSwap(eViewTransition: ViewTransition) {
	viewTransition = eViewTransition;
	const root = document.documentElement;
	const mainFrame = document.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!;
	const frameDocument = mainFrame.contentDocument!;
	const mode: Record<Modus, () => void> = {
		bypass: () => { },
		'slow-motion': sloMoPlay,
		control: controlledPlay,
		compare: () => { },
	};
	sessionStorage.setItem('vtbot-ui-colorScheme', document.documentElement.style.colorScheme);
	root.classList.add('vtbot-vt-active');
	const modus = root.dataset.vtbotModus as Modus;

	if (modus && modus !== 'bypass') {
		viewTransition!.ready.then(async () => {
			retrieveViewTransitionAnimations(frameDocument);
			addFrames(
				frameDocument,
				document.querySelector<HTMLInputElement>('#vtbot-ui-styled')!.checked
			);
			updateAnimationNames(frameDocument);
			mode[modus]();
		});
	}
	viewTransition!.finished.finally(() => {
		viewTransition = undefined;
		root.classList.remove('vtbot-vt-active');
		unleashAllAnimations(frameDocument);
		animations = undefined;
		updateNames(markTransitions(frameDocument));
		updateImageVisibility(frameDocument);
	});
}

function innerClick(e: MouseEvent) {
	const target = e.target as HTMLElement;
	if (!document.documentElement.classList.contains('vtbot-vt-active')) {
		const vt = target.closest<HTMLElement>('[data-vtbot-transition-name]');
		if (vt) {
			const name = vt.dataset.vtbotTransitionName;
			document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
				if (li.innerText === name) {
					li.click();
				}
			});
		}
	} else {
		let entry: HTMLLIElement | undefined;
		let size = Infinity;
		target.ownerDocument
			.querySelectorAll<HTMLElement>('#vtbot-twin--view-transition > div > div > div')
			.forEach((d) => {
				const { clientX, clientY } = e;
				const { top, bottom, left, right, width, height } = d.getBoundingClientRect();
				const name = d.id.substring('vtbot-twin--view-transition-new-'.length);
				const len = 'vtbot-twin--view-transition-'.length;
				const pseudo = d.id.substring(len, len + 3);
				if (
					width * height < size &&
					top <= clientY &&
					clientY <= bottom &&
					left <= clientX &&
					clientX <= right
				) {
					let visible = true;
					let me;
					document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li').forEach((li) => {
						if (li.innerText === name) {
							me = li;
							if (li.classList.contains(`${pseudo}-hidden`)) visible = false;
						}
					});
					if (visible) {
						size = width * height;
						entry = me;
					}
				}
			});
		entry?.click();
	}
}

function markTransitions(doc: Document) {
	const els = elementsWithStyleProperty(doc, 'view-transition-name');
	els.forEach((set, key) => {
		if (key === 'none') {
			els.delete(key);
		} else {
			set.forEach((el) => {
				(el as HTMLElement).dataset.vtbotTransitionName = key;
			});
		}
	});
	return new Set(els.keys());
}

function updateControl() {
	if (
		document.documentElement.classList.contains('vtbot-vt-active') &&
		document.documentElement.dataset.vtbotModus === 'control'
	) {
		control();
	}
}

function initPanelHandlers(frame: HTMLIFrameElement) {
	const frameDocument = frame.contentDocument!;
	frame.addEventListener('load', () => {
		location.href = frame.contentWindow!.location.href;
	});
	document.querySelector('#vtbot-ui-turn')!.addEventListener('click', switchOrientation);
	document.querySelector('#vtbot-ui-modi ul')!.addEventListener('change', updateModus);

	document.querySelector('#vtbot-ui-names ol')!.addEventListener('click', (e) => {
		if (e.target instanceof HTMLElement) {
			const targetLi = e.target.closest('li');

			if (targetLi && e instanceof MouseEvent) {
				//	mayViewTransition(() => {
				const { left, width } = targetLi.getBoundingClientRect();
				const x = e.clientX - left;
				const leftClick = x >= 0 && x <= 20;
				const rightClick = x >= width - 20 && x <= width;

				const classes = targetLi.classList;
				if (leftClick && classes.contains('old')) {
					classes.toggle('old-hidden');
					updateImageVisibility(frameDocument);
					return;
				}
				if (rightClick && classes.contains('new')) {
					classes.toggle('new-hidden');
					updateImageVisibility(frameDocument);
					return;
				}
				const name = targetLi.innerText;
				highlightInFrame(name, frame);
				highlightNames(name);
				const elem = frameDocument.querySelector(`[data-vtbot-transition-name="${name}"]`);
				writeSelectorToClipboard(elem);
				//	}, 'names');
			}
		}
		updateControl();
	});

	document.querySelector('#vtbot-ui-filter ul')!.addEventListener('change', refreshNames);
	document
		.querySelector('#vtbot-ui-filter input[type="text"]')!
		.addEventListener('input', refreshNames);
	document.querySelector('#vtbot-ui-filter button')!.addEventListener('click', resetFilter);
	document
		.querySelector('#vtbot-ui-names button')!
		.addEventListener('click', () => resetSelected(frameDocument));

	document
		.querySelector('#vtbot-ui-styled')
		?.addEventListener('change', (e) =>
			addFrames(frameDocument, (e.target as HTMLInputElement).checked)
		);

	const sloMo = document.querySelector('#vtbot-ui-slo-mo')!;
	const sloMoTsf = document.querySelector<HTMLInputElement>('#vtbot-ui-tsf')!;
	sloMo.addEventListener('input', (e) => {
		if (e.target instanceof HTMLInputElement) {
			const value = (Math.exp(parseInt(e.target.value, 10) / 100) - 100) / 100 + 1 - 0.14;
			sloMoTsf.innerText = `${value.toFixed(1)}`;
			sloMoPlay();
		}
	});

	document
		.querySelectorAll('#vtbot-ui-control-exit, #vtbot-ui-control-play')
		.forEach((e) => e.addEventListener('click', exitViewTransition));
	const controller = document.querySelector<HTMLInputElement>('#vtbot-ui-controller')!;
	const progress = document.querySelector<HTMLInputElement>('#vtbot-ui-progress')!;
	controller.addEventListener('input', (e) => {
		if (e.target instanceof HTMLInputElement) {
			progress.innerText = '' + ~~e.target.value;
			control();
		}
	});
	const controller2 = document.querySelector<HTMLInputElement>('#vtbot-ui-controller2')!;
	const progress2 = document.querySelector<HTMLInputElement>('#vtbot-ui-progress2')!;
	controller2.addEventListener('input', (e) => {
		if (e.target instanceof HTMLInputElement) {
			progress2.innerText = '' + ~~e.target.value;
			control();
		}
	});

	window.addEventListener('keyup', function (e) {
		if (e.key === 'Escape') {
			if (document.documentElement.classList.contains('vtbot-vt-active')) {
				exitViewTransition();
			} else {
				window.location.reload();
			}
		}
	});
}

function writeSelectorToClipboard(elem?: Element | null) {
	if (elem) {
		navigator.clipboard.writeText(
			`inspect(top.document.querySelector("#vtbot-main-frame").contentDocument.querySelector("${deriveCSSSelector(elem)}"))`
		);
		document.querySelector<HTMLInputElement>('#vtbot-ui-info')!.innerHTML = `<h4>Info</h4>
						<p>DevTools selector '<b><code>${deriveCSSSelector(elem)}</code></b>' copied to clipboard. Paste to DevTools console to further inspect the element.</p>`;
	} else {
		navigator.clipboard.writeText(
			`inspect(top.document.querySelector("#vtbot-main-frame").contentDocument.querySelector(":root"))`
		);
		document.querySelector<HTMLInputElement>('#vtbot-ui-info')!.innerHTML = `<h4>Info</h4>
						<p>DevTools selector '<b><code>:root</code></b>' copied to clipboard. Paste to DevTools console, then expand the element and its <code>::view-transition</code> pseudo element.</p>`;
	}
}
function updateNames(leftTransitionNames: Set<string>, rightTransitionNames?: Set<string>) {
	//navigator.clipboard.writeText("");
	document.querySelector('#vtbot-ui-info')!.innerHTML = '';
	document.querySelectorAll('#vtbot-ui-names li').forEach((li) => li.remove());
	document.querySelector<HTMLElement>('#vtbot-ui-names h4')!.innerText = rightTransitionNames
		? 'Animations'
		: 'Elements w/ View Transition Names';

	document.querySelector<HTMLElement>('#vtbot-ui-names div')!.style.display = rightTransitionNames
		? 'flex'
		: 'none';
	const list = document.querySelector('#vtbot-ui-names > ol')!;
	const names = [...new Set([...leftTransitionNames, ...(rightTransitionNames ?? [])])].sort();
	names.forEach((name, idx) => {
		const li = document.createElement('li');
		li.innerText = name;
		if (rightTransitionNames && leftTransitionNames.has(name)) {
			li.classList.add('old');
		}
		if (rightTransitionNames?.has(name)) {
			li.classList.add('new');
		}
		li.style.viewTransitionName = `vtbot-name-${idx}`;
		list.appendChild(li);
	});
	document.querySelector<HTMLElement>('#vtbot-ui-filter ul')!.style.display = rightTransitionNames
		? 'block'
		: 'none';
	refreshNames();
	return names;
}

function highlightInFrame(name: string, frame: HTMLIFrameElement) {
	const doc = frame.contentDocument;
	if (doc) {
		scrollIntoView(doc, name);
	}
}

function highlightNames(name: string) {
	const control =
		false &&
		document.documentElement.dataset.vtbotModus === 'control' &&
		document.querySelector<HTMLElement>('#vtbot-ui-names h4')!.innerText === 'Animations';
	const lis = document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li');
	let selected: HTMLLIElement | undefined;
	lis.forEach((li) => {
		if (li.innerText === name) {
			const sel = document.querySelector<HTMLInputElement>('#vtbot-ui-controller')!;
			const prog = document.querySelector<HTMLInputElement>('#vtbot-ui-progress')!;
			const unsel = document.querySelector<HTMLInputElement>('#vtbot-ui-controller2')!;
			const unprog = document.querySelector<HTMLInputElement>('#vtbot-ui-progress2')!;
			if (li.classList.contains('selected')) {
				unsel.value = sel.value;
				unprog.innerText = prog.innerText;
			} else {
				sel.value = unsel.value;
				prog.innerText = unprog.innerText;
			}

			li.classList[control ? 'toggle' : 'add']('selected');
			selected = li;
			if (li.style.display === 'none') resetFilter();
		} else {
			if (!control) li.classList.remove('selected');
		}
	});
	selected &&
		selected.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
}

function scrollIntoView(doc: Document, name: string) {
	if (document.documentElement.classList.contains('vtbot-vt-active')) {
		glowPseudo(doc, name);
	} else {
		const el = doc.querySelector<HTMLElement>(`[data-vtbot-transition-name="${name}"]`);
		if (el) {
			el.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
			const display = window.getComputedStyle(el).display;
			oldGlow[2]!.display = !display.includes('block') ? 'inline-block' : display;
			el.animate(oldGlow, { duration: 500, iterations: 1 });
		}
	}
}

window.addEventListener('resize', setOrientation);
function setOrientation() {
	const html = document.documentElement;
	if (
		window.matchMedia('(orientation: landscape)').matches !==
		html.classList.contains('vtbot-ui-column')
	)
		switchOrientation();
}

function switchOrientation() {
	// changing the snapshot containing block size skips the transition
	mayViewTransition(() => {
		viewTransition?.skipTransition();
		document.documentElement.classList.toggle('vtbot-ui-column');
	}, 'switch orientation');
}

function exitViewTransition() {
	viewTransition?.skipTransition();
}
function resetFilter() {
	document.querySelector<HTMLInputElement>('#vtbot-ui-filter input[type="text"]')!.value = '';
	document.querySelector<HTMLInputElement>('#vtbot-ui-filter ul input')!.click();
	refreshNames();
}
function resetSelected(doc: Document) {
	document
		.querySelectorAll<HTMLInputElement>('#vtbot-ui-names li')
		.forEach((item) => item.classList.remove('selected', 'old-hidden', 'new-hidden'));
	updateImageVisibility(doc);
	updateControl();
}
function refreshNames() {
	const names = document.querySelectorAll<HTMLLIElement>('#vtbot-ui-names li');
	const filter = document
		.querySelector<HTMLInputElement>('#vtbot-ui-filter ul input:checked')!
		.id.replace('vtbot-c-', '');
	const fragment = document.querySelector<HTMLInputElement>(
		'#vtbot-ui-filter input[type="text"]'
	)!.value;
	mayViewTransition(() => {
		names.forEach((name) => {
			const style = name.style;
			const classes = name.classList;
			const text = name.innerText;
			style.display =
				(fragment === '' || text.includes(fragment)) &&
					(filter === 'all' ||
						(filter === 'both' && classes.contains('new') && classes.contains('old')) ||
						(filter === 'old-only' && classes.contains('old') && !classes.contains('new')) ||
						(filter === 'new-only' && classes.contains('new') && !classes.contains('old')) ||
						(filter === 'old' && classes.contains('old')) ||
						(filter === 'new' && classes.contains('new')))
					? 'list-item'
					: 'none';
		});
	}, 'refresh names');
}

function insideViewport(element: HTMLElement | null) {
	if (!element) return undefined;
	const { top, right, bottom, left, width, height } = element.getBoundingClientRect();
	return (
		width > 0 &&
		height > 0 &&
		top < window.innerHeight &&
		bottom > 0 &&
		left < window.innerWidth &&
		right > 0
	);
}

const message: Record<Modus, string> = {
	bypass: `<h4>How to Bypass</h4><p>Navigation is <b>not intercepted</b>.</p><ol><li>Optional: Examine elements by selecting from the View Transition Name list</li><li>Navigate your page as usual</li></ol>`,
	'slow-motion': `<h4>Use Slow Motion</h4><ol><li>Use the slider to set a <b>time stretch factor</b></li><li>Press a link on your page to start a view transition and study the <b>slowed down animations!</li></ol>`,
	control: `<h4>Take Full Control</h4><ol><li>Start a transition</li><li>Select animations</li><li>Move freely through the timeline and concentrate on selected elements and groups.</li></ol>`,
	compare: `<h4>Compare Side-by-side</h4><p>Sometimes you need a clear view of where you're coming from and where you're going!</p><p>Compare the <b>old and new pages side by side</b> and see what morphs where.</p>`,
};

let firstModusInteraction = true;

function updateModus() {
	const root = document.documentElement;
	const checked = document.querySelector<HTMLInputElement>('#vtbot-ui-modi ul input:checked');
	if (checked) {
		const modus = checked.id.replace('vtbot-m-', '') as Modus;
		if (modus !== root.dataset.vtbotModus) {
			mayViewTransition(() => {
				root.dataset.vtbotModus = modus;
				exitViewTransition();
				if (modus !== 'compare')
					document.querySelector<HTMLInputElement>('#vtbot-ui-filter ul input')!.click();
				if (modus === 'slow-motion') {
					attachFrameToggle('#vtbot-ui-slow-motion');
				}
				if (modus === 'control') {
					attachFrameToggle('#vtbot-ui-control');
				}
				document.querySelector<HTMLInputElement>('#vtbot-ui-messages')!.innerHTML =
					message[modus];

				if (firstModusInteraction) {
					firstModusInteraction = false;
					document
						.querySelector('#vtbot-ui-panel')
						?.insertAdjacentElement(
							'afterbegin',
							document.querySelector<HTMLInputElement>('#vtbot-ui-modi')!
						);
				}
			}, 'update-modus');
		}
	}
}

function attachFrameToggle(divId: string) {
	const styled = document.querySelector('#vtbot-ui-styled')?.parentElement;
	const div = document.querySelector(divId);
	if (styled && div && styled.parentElement !== div)
		div.insertAdjacentElement('beforeend', styled);
}

function initGrabbing() {
	const startDragging = (e: Event) => {
		root.classList.add('dragging');
		root.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!.style.pointerEvents = 'none';
		if (e.cancelable) e.preventDefault();
	};

	const drag = (e: MouseEvent | TouchEvent) => {
		if (root.classList.contains('dragging')) {
			const clientX = (e instanceof TouchEvent ? e.touches[0]?.clientX : e.clientX) ?? 0;
			const clientY = (e instanceof TouchEvent ? e.touches[0]?.clientY : e.clientY) ?? 0;

			if (root.classList.contains('vtbot-ui-column')) {
				root.style.setProperty(
					'--vtbot-panel-width',
					`calc(max(188px, 100vw - ${Math.max(100, clientX + 1)}px))`
				);
			} else {
				root.style.setProperty(
					'--vtbot-panel-height',
					`calc(max(204px, 100vh - ${Math.max(100, clientY + 1)}px))`
				);
			}
		}
	};

	const stopDragging = () => {
		if (root.classList.contains('dragging')) {
			root.classList.remove('dragging');
			root.querySelector<HTMLIFrameElement>('#vtbot-main-frame')!.style.pointerEvents = 'auto';
		}
	};

	const root = document.documentElement;

	const divider = document.querySelector('#divider')!;
	divider.addEventListener('mousedown', startDragging);
	divider.addEventListener('touchstart', startDragging, { passive: false });

	document.addEventListener('mousemove', drag);
	document.addEventListener('touchmove', drag);

	document.addEventListener('mouseup', stopDragging);
	document.addEventListener('touchend', stopDragging);
}
