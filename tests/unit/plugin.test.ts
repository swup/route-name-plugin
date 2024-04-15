import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import Swup, { updateHistoryRecord } from 'swup';
import type { Visit } from 'swup';

import SwupRouteNamePlugin from '../../src/index.js';

vi.mock('swup', async (importOriginal) => {
	return {
		...await importOriginal<typeof import('swup')>(),
		updateHistoryRecord: vi.fn()
	}
});

describe('SwupRouteNamePlugin', () => {
	let swup: Swup;
	let plugin: SwupRouteNamePlugin;
	let visit: Visit;

	beforeEach(() => {
		swup = new Swup();
		plugin = new SwupRouteNamePlugin({
			routes: [
				{ name: 'home', path: '/' },
				{ name: 'about', path: '/about' },
				{ name: 'user', path: '/users/:id' }
			]
		});
		swup.use(plugin);

		// @ts-ignore - createVisit is marked internal
		visit = swup.createVisit({ to: '/about', from: '/' });
		visit.to.document = new window.DOMParser().parseFromString(
			'<html><head></head><body></body></html>',
			'text/html'
		);
	});

	afterEach(() => {
		swup.unuse(plugin);
		swup.destroy();
	});

	describe('visit object', () => {
		it('adds a route name to the visit object', async () => {
			await swup.hooks.call('visit:start', visit, undefined);
			expect(visit).toMatchObject({
				from: { url: '/', route: 'home' },
				to: { url: '/about', route: 'about' }
			});
		});
	});

	describe('history', async () => {
		it('updates the history entry', async () => {
			await swup.hooks.call('visit:start', visit, undefined);
			await swup.hooks.call('content:replace', visit, { page: { url: '/about', html: '' } });

			expect(updateHistoryRecord).toHaveBeenCalledWith(undefined, {
				route: 'about'
			});
		});
	});
});
