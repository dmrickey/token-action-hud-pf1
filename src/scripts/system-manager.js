// System Module Imports
import { GROUPS } from './groups.js'
import { HudBuilder } from './hud-builder.js';
import { RollHandler as Core } from './roll-handler.js'
import { Utils } from './utils.js';
import * as systemSettings from './settings.js'

export let SystemManager = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    SystemManager = class SystemManager extends coreModule.api.SystemManager {
        /** @override */
        doGetCategoryManager(_user) {
            return new coreModule.api.CategoryManager();
        }

        /** @override */
        doGetActionHandler(categoryManager) {
            const actionHandler = new HudBuilder(categoryManager);
            return actionHandler;
        }

        /** @override */
        getAvailableRollHandlers() {
            const coreTitle = Utils.localize('PF1.Default');

            const choices = { core: coreTitle };

            return choices;
        }

        /** @override */
        doGetRollHandler(handlerId) {
            switch (handlerId) {
                case 'core':
                default:
                    return new Core();
            }
        }

        /** @override */
        doRegisterSettings(updateFunc) {
            systemSettings.register(updateFunc);
        }

        /** @override */
        async doRegisterDefaultFlags() {
            return GROUPS;
        }
    }
});
