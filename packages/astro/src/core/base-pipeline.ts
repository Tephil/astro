import type {
	MiddlewareHandler,
	RouteData,
	RuntimeMode,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../@types/astro.js';
import type { Logger } from './logger/core.js';
import { RouteCache } from './render/route-cache.js';
import { createI18nMiddleware } from '../i18n/middleware.js';

/**
 * The `Pipeline` represents the static parts of rendering that do not change between requests.
 * These are mostly known when the server first starts up and do not change.
 *
 * Thus, a `Pipeline` is created once at process start and then used by every `RenderContext`.
 */
export abstract class Pipeline {
	readonly internalMiddleware: MiddlewareHandler[];

	constructor(
		readonly logger: Logger,
		readonly manifest: SSRManifest,
		/**
		 * "development" or "production"
		 */
		readonly mode: RuntimeMode,
		readonly renderers: SSRLoadedRenderer[],
		/**
		 * Based on Astro config's `output` option, `true` if "server" or "hybrid".
		 */
		readonly serverLike: boolean,
		readonly streaming: boolean,
		/**
		 * Used to provide better error messages for `Astro.clientAddress`
		 */
		readonly adapterName = manifest.adapterName,
		readonly clientDirectives = manifest.clientDirectives,
		readonly compressHTML = manifest.compressHTML,
		readonly i18n = manifest.i18n,
		readonly middleware = manifest.middleware,
		readonly routeCache = new RouteCache(logger, mode),
		readonly routes = manifest.routes.map((route) => route.routeData),
		/**
		 * Used for `Astro.site`.
		 */
		readonly site = manifest.site
	) {
		this.internalMiddleware = [
			createI18nMiddleware(i18n, manifest.base, manifest.trailingSlash, manifest.buildFormat),
		];
	}

	abstract componentMetadata(
		routeData: RouteData
	): Promise<SSRResult['componentMetadata']> | SSRResult['componentMetadata'];
	abstract headElements(routeData: RouteData): Promise<HeadElements> | HeadElements;

	/**
	 * Resolves specifiers in the inline hydrated scripts, such as
	 * - \@astrojs/preact/client.js
	 * - \@/components/Foo.vue
	 * - /Users/macos/project/src/Foo.vue
	 * - C:/Windows/project/src/Foo.vue (normalized slash)
	 */
	abstract resolve(s: string): Promise<string> | string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HeadElements extends Pick<SSRResult, 'scripts' | 'styles' | 'links'> {}
