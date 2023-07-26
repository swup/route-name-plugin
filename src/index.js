import Plugin from '@swup/plugin';
import { classify, getCurrentUrl, matchPath, updateHistoryRecord } from 'swup';

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
		this.routes = this.compileRoutePatterns();
	}

	mount() {
		// Save route to current history record
		this.swup.visit.to.route = this.getRouteName(getCurrentUrl());
		this.updateHistory(this.swup.visit);

		this.before('visit:start', this.addRouteKey);
		this.on('animation:out:start', this.addPathClasses);
		this.on('animation:out:start', this.addRouteClasses);
		this.on('content:replace', this.updateHistory);
		this.on('animation:in:end', this.removeClasses);
	}

	// Compile route patterns to match functions and valid classnames
	compileRoutePatterns() {
		return this.options.routes.map((route) => {
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
		const { name } = this.routes.find((route) => route.matches(path)) || {};
		return name || null;
	}

	// Get path name for any path
	getPathName(path) {
		return classify(path) || 'homepage';
	}

	// Add a `route` key to the visit object's `from` and `to` properties
	addRouteKey(visit) {
		if (!this.options.routes.length) {
			return;
		}

		visit.from.route = this.getRouteName(visit.from.url);
		visit.to.route = this.getRouteName(visit.to.url);

		this.swup.log(
			`Route: '${visit.from.route || unknown || '(unknown)'}'` +
				` to '${visit.to.route || unknown || '(unknown)'}'`
		);
	}

	// Add `from-route-*` and `to-route-*` classnames to html tag
	addRouteClasses(visit) {
		if (!this.options.routes.length) {
			return;
		}

		const from = visit.from.route;
		const to = visit.to.route;
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
	}

	// Add `from-*` and `to-*` classnames for slugified path
	addPathClasses(visit) {
		if (!this.options.paths) {
			return;
		}

		const from = this.getPathName(visit.from.url);
		const to = this.getPathName(visit.to.url);

		document.documentElement.classList.add(`from-${from}`);
		document.documentElement.classList.add(`to-${to}`);
	}

	// Remove `from-*` and `from-route-*` classnames from html tag
	// Note: swup removes `to-*` classnames on its own already
	removeClasses = () => {
		const htmlClasses = document.documentElement.className.split(' ');
		const removeClasses = htmlClasses.filter((classItem) => classItem.startsWith('from-'));
		document.documentElement.classList.remove(...removeClasses);
	}

	updateHistory(visit) {
		updateHistoryRecord(undefined, { route: visit.to.route });
	}
}
