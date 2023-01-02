import Plugin from '@swup/plugin';
import { match } from 'path-to-regexp';
import classify from 'swup/lib/helpers/classify';

export default class SwupRouteNamePlugin extends Plugin {
	name = 'SwupRouteNamePlugin';

	constructor(options = {}) {
		super();

		this.options = {
			routes: [{ name: 'any', path: '(.*)' }],
			pathToRegexpOptions: {},
			unknownName: 'unknown',
			...options
		};

		this.compileRoutePatterns();
	}

	mount() {
		this.swup.on('animationOutStart', this.addPathClasses);
		this.swup.on('animationOutStart', this.addRouteClasses);
		this.swup.on('animationInDone', this.removeClasses);
	}

	unmount() {
		this.swup.off('animationOutStart', this.addPathClasses);
		this.swup.off('animationOutStart', this.addRouteClasses);
		this.swup.off('animationInDone', this.removeClasses);
	}

	// Compile route patterns to match functions and valid classnames
	compileRoutePatterns() {
		this.routePatterns = this.options.routes.map((route) => {
			const name = route.name.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s]/g, '');
			const matches = match(route.path, this.options.pathToRegexpOptions);
			return { ...route, name, matches };
		});
	}

	// Get route name for any path
	getRouteName(path) {
		const { name } = this.routePatterns.find((route) => route.matches(path)) || {};
		return name || null;
	}

	// Get path name for any path
	getPathName(path) {
		return classify(path, 'homepage');
	}

	// Add `from-*` and `to-*` classnames for slugified path

	addPathClasses = () => {
		const { from, to } = this.swup.transition;

		const fromPath = this.getPathName(from);
		const toPath = this.getPathName(to);

		document.documentElement.classList.add(`from-${fromPath}`);
		document.documentElement.classList.add(`to-${toPath}`);
	};

	// Add `from-route-*` and `to-route-*` classnames to html tag
	addRouteClasses = () => {
		const { from, to } = this.swup.transition;
		const unknown = this.options.unknownName;

		const fromRoute = this.getRouteName(from);
		const toRoute = this.getRouteName(to);

		if (fromRoute || unknown) {
			document.documentElement.classList.add(`from-route-${fromRoute || unknown}`);
		}
		if (toRoute || unknown) {
			document.documentElement.classList.add(`to-route-${toRoute || unknown}`);
		}
		if (fromRoute && fromRoute === toRoute) {
			document.documentElement.classList.add('to-same-route');
		}

		this.swup.log(`Route: '${fromRoute || unknown || '(unknown)'}' to '${toRoute || unknown || '(unknown)'}'`);
	};

	// Remove `from-*` and `from-route-*` classnames from html tag
	// Note: swup removes `to-*` classnames on its own already
	removeClasses = () => {
		const removeClasses = document.documentElement.className.split(' ').filter(
			(classItem) => classItem.startsWith('from-')
		);
		document.documentElement.classList.remove(...removeClasses);
	};
}
