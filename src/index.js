import Plugin from '@swup/plugin';
import { match } from 'path-to-regexp';

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
		this.swup.on('animationOutStart', this.addRouteNameClasses);
		this.swup.on('animationInDone', this.removeRouteNameClasses);
	}

	unmount() {
		this.swup.off('animationOutStart', this.addRouteNameClasses);
		this.swup.off('animationInDone', this.removeRouteNameClasses);
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
		const matchedRoute = this.routePatterns.find((route) => route.matches(path)) || {};
		return matchedRoute.name || null;
	}

	// Add `from-route-*` and `to-route-*` classnames to html tag
	addRouteNameClasses = () => {
		const { from, to } = this.swup.transition;
		const unknown = this.options.unknownName;

		const routeFrom = this.getRouteName(from);
		const routeTo = this.getRouteName(to);

		if (routeFrom || unknown) {
			document.documentElement.classList.add(`from-route-${routeFrom || unknown}`);
		}
		if (routeTo || unknown) {
			document.documentElement.classList.add(`to-route-${routeTo || unknown}`);
		}
		if (routeFrom && routeFrom === routeTo) {
			document.documentElement.classList.add('to-same-route');
		}

		this.swup.log(`Route: '${routeFrom || unknown || '(unknown)'}' to '${routeTo || unknown || '(unknown)'}'`);
	};

	// Remove `from-route-*` classnames from html tag
	// Note: swup removes `to-*` classnames on its own already
	removeRouteNameClasses = () => {
		document.documentElement.className.split(' ')
			.filter((classItem) => classItem.indexOf('from-route-') === 0)
			.forEach((classItem) => {
				document.documentElement.classList.remove(classItem);
			});
	};
}
