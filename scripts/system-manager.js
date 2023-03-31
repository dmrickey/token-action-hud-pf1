// System Module Imports
import { CATEGORIES } from './categories.js'
import { HudBuilder } from './hud-builder.js';
import { RollHandler as Core } from './roll-handler.js'
import * as systemSettings from './settings.js'

// Core Module Imports
import { CoreSystemManager, CoreCategoryManager, CoreUtils } from './config.js'

export class SystemManager extends CoreSystemManager {
    /** @override */
    doGetCategoryManager(_user) {
        return new CoreCategoryManager();
    }

    /** @override */
    doGetActionHandler(categoryManager) {
        const actionHandler = new HudBuilder(categoryManager);
        return actionHandler;
    }

    /** @override */
    getAvailableRollHandlers() {
        const coreTitle = CoreUtils.i18n('PF1.Default');

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
        return CATEGORIES;
    }
}
