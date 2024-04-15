import { getCurrentUrl, updateHistoryRecord } from 'swup';
import type { Visit } from 'swup';
import Plugin from '@swup/plugin';

import {
	CompiledRoute,
	MatchOptions,
	Route,
	compileRoutePatterns,
	getPathName,
	getRouteName
} from './routes.js';

declare module 'swup' {
	export interface VisitFrom {
		/** Identified route name */
		route?: string;
	}
	export interface VisitTo {
		/** Identified route name */
		route?: string;
	}
}

type Options = {
	/** Array of patterns for identifying named routes. */
	routes: Route[];
	/** Default route name if no match was found. */
	unknownRoute: string;
	/** Options for matching paths. Directly passed into `path-to-regexp`. */
	matchOptions: MatchOptions;
	/** Add classnames for raw URLs. */
	paths: boolean;
};

export default class SwupRouteNamePlugin extends Plugin {
	name = 'SwupRouteNamePlugin';

	requires = { swup: '>=4' };

	defaults: Options = {
		routes: [],
		unknownRoute: 'unknown',
		matchOptions: {},
		paths: false
	};
	options: Options;

	routes: CompiledRoute[];

	constructor(options: Partial<Options> = {}) {
		super();
		this.options = { ...this.defaults, ...options };
		this.routes = compileRoutePatterns(this.options.routes, this.options.matchOptions);
	}

	mount() {
		// Save route to current history record
		this.swup.visit.to.route = getRouteName(getCurrentUrl(), this.routes);
		this.updateHistory(this.swup.visit);

		this.before('visit:start', this.addRouteKey);
		this.on('animation:out:start', this.addClasses);
		this.on('content:replace', this.updateHistory);
		this.on('animation:in:end', this.removeClasses);
	}

	// Add a `route` key to the visit object's `from` and `to` properties
	addRouteKey(visit: Visit) {
		if (!this.routes.length) return;

		visit.from.route = getRouteName(visit.from.url, this.routes);
		visit.to.route = getRouteName(visit.to.url!, this.routes);
		const unknown = this.options.unknownRoute;

		this.swup.log(
			`Route: '${visit.from.route || unknown || '(unknown)'}'` +
				` to '${visit.to.route || unknown || '(unknown)'}'`
		);
	}

	// Add corresponding path classnames to html tag
	addClasses(visit: Visit) {
		if (this.routes.length) {
			this.addRouteClasses(visit);
		}
		if (this.options.paths) {
			this.addPathClasses(visit);
		}
	}

	// Add `from-route-*` and `to-route-*` classnames to html tag
	addRouteClasses(visit: Visit) {
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
	addPathClasses(visit: Visit) {
		const from = getPathName(visit.from.url);
		const to = getPathName(visit.to.url!);

		document.documentElement.classList.add(`from-${from}`, `to-${to}`);
	}

	// Remove `from-*` and `from-route-*` classnames from html tag
	// Note: swup removes `to-*` classnames on its own already
	removeClasses() {
		const htmlClasses = document.documentElement.className.split(' ');
		const removeClasses = htmlClasses.filter((classItem) => classItem.startsWith('from-'));
		document.documentElement.classList.remove(...removeClasses);
	}

	updateHistory(visit: Visit) {
		updateHistoryRecord(undefined, { route: visit.to.route });
	}
}
