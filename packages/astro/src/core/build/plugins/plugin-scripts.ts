import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';

/**
 * Used by the `experimental.directRenderScript` option to inline scripts directly into the HTML.
 */
export function vitePluginScripts(internals: BuildInternals): VitePlugin {
	let assetInlineLimit = 4096;

	return {
		name: '@astro/plugin-scripts',

		configResolved(config) {
			if (config.build?.assetsInlineLimit !== undefined) {
				assetInlineLimit = config.build.assetsInlineLimit;
			}
		},

		async generateBundle(_options, bundle) {
			for (const [id, output] of Object.entries(bundle)) {
				// Try to inline scripts that don't import anything as is within the inline limit
				if (
					output.type === 'chunk' &&
					output.facadeModuleId &&
					internals.discoveredScripts.has(output.facadeModuleId) &&
					output.imports.length === 0 &&
					output.dynamicImports.length === 0 &&
					Buffer.byteLength(output.code) <= assetInlineLimit
				) {
					internals.inlinedScripts.set(output.facadeModuleId, output.code.trim());
					delete bundle[id];
				}
			}
		},
	};
}

export function pluginScripts(internals: BuildInternals): AstroBuildPlugin {
	return {
		targets: ['client'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginScripts(internals),
				};
			},
		},
	};
}
