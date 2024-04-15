import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import Swup, { updateHistoryRecord } from 'swup';
import type { Visit } from 'swup';

import SwupRouteNamePlugin from '../../src/index.js';

vi.mock('swup', async (importOriginal) => {
	return {
		...(await importOriginal<typeof import('swup')>()),
		updateHistoryRecord: vi.fn()
	};
});

describe('SwupRouteNamePlugin', () => {
	let swup: Swup;
	let plugin: SwupRouteNamePlugin;
	let visit: Visit;

	beforeEach(() => {
		swup = new Swup();
		plugin = new SwupRouteNamePlugin({
			routes: [
				{ name: 'home', path: '' },
				{ name: 'about', path: '/about' },
				{ name: 'user', path: '/users/:id' }
			]
		});
		swup.use(plugin);

		// @ts-ignore - createVisit is marked internal
		visit = swup.createVisit({ to: '/about', from: '' });
		visit.to.document = new window.DOMParser().parseFromString(
			'<html><head></head><body></body></html>',
			'text/html'
		);
	});

	afterEach(() => {
		swup.unuse(plugin);
		swup.destroy();
		vi.resetAllMocks();
	});

	describe('visit object', () => {
		it('adds a route name to each visit object', async () => {
			await swup.hooks.call('visit:start', visit, undefined);
			expect(visit).toMatchObject({
				from: { url: '', route: 'home' },
				to: { url: '/about', route: 'about' }
			});
		});

		it('amends the initial visit object', async () => {
			expect(swup.visit).toMatchObject({
				to: { url: '', route: 'home' }
			});
		});
	});

	describe('history', async () => {
		it('updates the history entry with the visit route', async () => {
			await swup.hooks.call('visit:start', visit, undefined);
			await swup.hooks.call('content:replace', visit, { page: { url: '/about', html: '' } });
			expect(updateHistoryRecord).toHaveBeenCalledWith(undefined, { route: 'about' });
		});

		it('amends the initial history entry', async () => {
			expect(updateHistoryRecord).toHaveBeenCalledWith(undefined, { route: 'home' });
		});
	});

	describe('path classes', async () => {
		it('does not add path classnames by default', async () => {
			await swup.hooks.call('animation:out:start', visit, undefined);
			expect(document.documentElement.classList.contains('from-homepage')).toBe(false);
			expect(document.documentElement.classList.contains('to-about')).toBe(false);
		});

		it('adds and removes path class names if configured', async () => {
			plugin.options.paths = true;

			await swup.hooks.call('animation:out:start', visit, undefined);
			expect(document.documentElement.classList.contains('from-homepage')).toBe(true);
			expect(document.documentElement.classList.contains('to-about')).toBe(true);

			await swup.hooks.call('animation:in:end', visit, undefined);
			expect(document.documentElement.classList.contains('from-homepage')).toBe(false);
			// We can't test this here because the plugin relies on swup removing to-* classes on its own
			// expect(document.documentElement.classList.contains('to-about')).toBe(false);
		});
	});

	describe('route classes', async () => {
		it('adds and removes route class names', async () => {
			await swup.hooks.call('visit:start', visit, undefined);
			await swup.hooks.call('animation:out:start', visit, undefined);
			expect(document.documentElement.classList.contains('from-route-home')).toBe(true);
			expect(document.documentElement.classList.contains('to-route-about')).toBe(true);

			await swup.hooks.call('animation:in:end', visit, undefined);
			expect(document.documentElement.classList.contains('from-route-home')).toBe(false);
			// We can't test this here because the plugin relies on swup removing to-* classes on its own
			// expect(document.documentElement.classList.contains('to-route-about')).toBe(false);
		});

		it('adds classname for unknown routes', async () => {
			visit.to.url = '/no/such/route';

			await swup.hooks.call('visit:start', visit, undefined);
			await swup.hooks.call('animation:out:start', visit, undefined);
			expect(document.documentElement.classList.contains('to-route-unknown')).toBe(true);
		});

		it('makes unknown route classname configurable', async () => {
			visit.to.url = '/no/such/route';
			plugin.options.unknownRoute = 'not-found';

			await swup.hooks.call('visit:start', visit, undefined);
			await swup.hooks.call('animation:out:start', visit, undefined);
			expect(document.documentElement.classList.contains('to-route-not-found')).toBe(true);
		});

		it('adds classname for matching from and to routes', async () => {
			visit.from.url = '/users/1';
			visit.to.url = '/users/2';

			await swup.hooks.call('visit:start', visit, undefined);
			await swup.hooks.call('animation:out:start', visit, undefined);
			expect(document.documentElement.classList.contains('to-same-route')).toBe(true);
		});
	});
});
