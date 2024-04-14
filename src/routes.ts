import { classify, matchPath } from 'swup';

export type MatchOptions = Parameters<typeof matchPath>[1];
export type MatchFunction = ReturnType<typeof matchPath>;

export type Route = {
	/** The name of the route. */
	name: string;
	/** The path pattern to match the URL against. */
	path: string;
};

export type CompiledRoute = Route & {
	/** Match function to check if the pattern matches a given URL */
	matches: MatchFunction;
};

// Compile route patterns to match functions and valid classnames
export function compileRoutePattern(route: Route, matchOptions: MatchOptions) {
	const name = sanitizeRouteName(route.name);
	const matches = matchPath(route.path, matchOptions);
	return { ...route, name, matches };
}

export function compileRoutePatterns(routes: Route[], matchOptions: MatchOptions) {
	return routes.map((route) => compileRoutePattern(route, matchOptions));
}

export function sanitizeRouteName(name: string): string {
	return name.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s]/g, '');
}

// Get route name for any path
export function getRouteName(path: string, routes: CompiledRoute[]): string | undefined {
	return routes.find((route) => route.matches(path))?.name;
}

// Get path name for any path
export function getPathName(path: string) {
	return classify(path) || 'homepage';
}
