import { describe, expect, it } from 'vitest';
import {
	compileRoutePattern,
	compileRoutePatterns,
	getPathName,
	getRouteName
} from '../../src/routes.js';

describe('routes', () => {
	describe('compileRoutePattern', () => {
		it('compiles a route pattern', () => {
			const route = { name: 'home', path: '/' };
			const result = compileRoutePattern(route);
			expect(result).toMatchObject({
				name: 'home',
				path: '/',
				matches: expect.any(Function)
			});
		});

		it('sanitizes the route name', () => {
			const route = { name: 'some route? name! with@special$chars', path: '/' };
			const result = compileRoutePattern(route);
			expect(result).toMatchObject({ name: 'someroutenamewithspecialchars' });
		});

		it('creates a match function', () => {
			const route = { name: 'user', path: '/users/:id' };
			const { matches } = compileRoutePattern(route);
			expect(matches).toBeInstanceOf(Function);
			expect(matches('/')).toBe(false);
			expect(matches('/users')).toBe(false);
			expect(matches('/users/5')).toMatchObject({ path: '/users/5', params: { id: '5' } });
		});
	});

	describe('compileRoutePatterns', () => {
		it('compiles multiple route patterns', () => {
			const routes = [
				{ name: 'home', path: '/' },
				{ name: 'about', path: '/about' }
			];
			const result = compileRoutePatterns(routes);
			expect(result).toMatchObject([
				{ name: 'home', path: '/', matches: expect.any(Function) },
				{ name: 'about', path: '/about', matches: expect.any(Function) }
			]);
		});
	});

	describe('getRouteName', () => {
		it('returns the first matching route name', () => {
			const routes = compileRoutePatterns([
				{ name: 'about', path: '/about' },
				{ name: 'home', path: '/' },
				{ name: 'about-2', path: '/about' }
			]);
			expect(getRouteName('/', routes)).toBe('home');
			expect(getRouteName('/about', routes)).toBe('about');
			expect(getRouteName('/404', routes)).toBeUndefined();
			expect(getRouteName('', routes)).toBeUndefined();
		});
	});

	describe('getPathName', () => {
		it('simplifies the path name', () => {
			expect(getPathName('/page')).toBe('page');
			expect(getPathName('/some/long/path')).toBe('some-long-path');
		});
		it('falls back to home page', () => {
			expect(getPathName('/')).toBe('homepage');
			expect(getPathName('')).toBe('homepage');
		});
	});
});
