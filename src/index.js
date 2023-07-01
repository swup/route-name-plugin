import Plugin from '@swup/plugin';
import { classify, matchPath } from 'swup';

export default class SwupRouteNamePlugin extends Plugin {
	name = 'SwupRouteNamePlugin';

	requires = { swup: '>=4' };

	defaults = {
		routes: [],
		unknownRoute: 'unknown',
		matchOptions: {},
		paths: false
	};

	constructor(options = {}) {
		super();
		this.options = { ...this.defaults, ...options };
		this.compileRoutePatterns();
	}

	mount() {
		this.swup.hooks.before('transitionStart', this.addRouteKey);
		this.swup.hooks.on('animationOutStart', this.addPathClasses);
		this.swup.hooks.on('animationOutStart', this.addRouteClasses);
		this.swup.hooks.on('animationInDone', this.removeClasses);
	}

	unmount() {
		this.swup.hooks.off('transitionStart', this.addRouteKey);
		this.swup.hooks.off('animationOutStart', this.addPathClasses);
		this.swup.hooks.off('animationOutStart', this.addRouteClasses);
		this.swup.hooks.off('animationInDone', this.removeClasses);
	}

	// Compile route patterns to match functions and valid classnames
	compileRoutePatterns() {
		this.routePatterns = this.options.routes.map((route) => {
			const name = this.sanitizeRouteName(route.name);
			const matches = matchPath(route.path, this.options.matchOptions);
			return { ...route, name, matches };
		});
	}

	sanitizeRouteName(name) {
		return name.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s]/g, '');
	}

	// Get route name for any path
	getRouteName(path) {
		const { name } = this.routePatterns.find((route) => route.matches(path)) || {};
		return name || null;
	}

	// Get path name for any path
	getPathName(path) {
		return classify(path) || 'homepage';
	}

	// Add a `route` key to the context object's `from` and `to` properties
	addRouteKey = (context) => {
		if (!this.options.routes.length) {
			return;
		}

		context.from.route = this.getRouteName(context.from.url);
		context.to.route = this.getRouteName(context.to.url);
		this.swup.log(
			`Route: '${context.from.route || unknown || '(unknown)'}'` +
				` to '${context.to.route || unknown || '(unknown)'}'`
		);
	};

	// Add `from-route-*` and `to-route-*` classnames to html tag
	addRouteClasses = (context) => {
		if (!this.options.routes.length) {
			return;
		}

		const from = context.from.route;
		const to = context.to.route;
		const unknown = this.options.unknownRoute;

		if (from || unknown) {
			document.documentElement.classList.add(`from-route-${from || unknown}`);
		}
		if (to || unknown) {
			document.documentElement.classList.add(`to-route-${to || unknown}`);
		}
		if (from && from === to) {
			document.documentElement.classList.add('to-same-route');
		}
	};

	// Add `from-*` and `to-*` classnames for slugified path
	addPathClasses = (context) => {
		if (!this.options.paths) {
			return;
		}

		const from = this.getPathName(context.from.url);
		const to = this.getPathName(context.to.url);

		document.documentElement.classList.add(`from-${from}`);
		document.documentElement.classList.add(`to-${to}`);
	};

	// Remove `from-*` and `from-route-*` classnames from html tag
	// Note: swup removes `to-*` classnames on its own already
	removeClasses = () => {
		const htmlClasses = document.documentElement.className.split(' ');
		const removeClasses = htmlClasses.filter((classItem) => classItem.startsWith('from-'));
		document.documentElement.classList.remove(...removeClasses);
	};
}
