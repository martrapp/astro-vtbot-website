import { navigate } from 'astro:transitions/client';

declare global {
	var vtbotNavigate: (hashFragment: string, textFragment: string) => void;
}

window.vtbotNavigate = (hashFragment: string, textFragment: string) =>
	navigate(
		!('fragmentDirective' in document)
			? hashFragment
			: hashFragment.replace(/#.*$/, '') + '#:~:text=' + textFragment
	);
