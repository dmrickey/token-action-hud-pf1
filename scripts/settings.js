/**
 *  see https://foundryvtt.wiki/en/development/api/settings for defaults
 */

import { MODULE } from './constants.js';
import { Utils } from './utils.js';

const keys = {
    actionLayout: 'actionLayout',
    categorizeSkills: 'categorizeSkills',
    showPassiveFeatures: 'showPassiveFeatures',
    showPassiveInventory: 'showPassiveInventory',
    spellPreparation: 'spellPreparation',
};

export function register(updateFunc) {
    const defaultSetting = {
        config: true,
        scope: 'client',
        onChange: (value) => {
            updateFunc(value)
        },
    }

    const settings = {
        [keys.actionLayout]: {
            ...defaultSetting,
            choices: {
                'onlyItems': Utils.localize('settings.actionLayout.choices.onlyItems'),
                'onlyActions': Utils.localize('settings.actionLayout.choices.onlyActions'),
                'categorized': Utils.localize('settings.actionLayout.choices.categorized'),
            },
            default: 'categorized',
            type: String,
        },
        [keys.categorizeSkills]: {
            ...defaultSetting,
            default: true,
            type: Boolean,
        },
        [keys.showPassiveFeatures]: {
            ...defaultSetting,
            default: false,
            type: Boolean,
        },
        [keys.showPassiveInventory]: {
            ...defaultSetting,
            default: false,
            type: Boolean,
        },
        [keys.spellPreparation]: {
            ...defaultSetting,
            choices: {
                'onlyRemaining': Utils.localize('settings.spellPreparation.choices.onlyRemaining'),
                'allPrepared': Utils.localize('settings.spellPreparation.choices.allPrepared'),
                'allSpells': Utils.localize('settings.spellPreparation.choices.allSpells'),
            },
            default: 'onlyRemaining',
            type: String,
        },
    };

    Object.keys(settings)
        .forEach((key) => {
            game.settings.register(MODULE.ID, key, {
                name: Utils.localize(`settings.${key}.name`),
                hint: Utils.localize(`settings.${key}.hint`),
                ...settings[key],
            })
        });
}

export class Settings {
    /**
     * User: determines how to layout sub-actions
     */
    static get actionLayout() {
        return Settings.#getSetting(keys.actionLayout);
    }

    static get categorizeSkills() {
        return Settings.#getSetting(keys.categorizeSkills);
    }

    static get showPassiveFeatures() {
        return Settings.#getSetting(keys.showPassiveFeatures);
    }

    static get showPassiveInventory() {
        return Settings.#getSetting(keys.showPassiveInventory);
    }

    static get spellPreparation() {
        return Settings.#getSetting(keys.spellPreparation);
    }

    static get pf1SkipActionDialogs() {
        return Settings.#getSetting('skipActionDialogs', 'pf1');
    }

    static get tahGrid() {
        return Settings.#getSetting('grid', 'token-action-hud-core');
    }

    static #getSetting(key, moduleId = MODULE.ID) {
        return game.settings.get(moduleId, key);
    }
}
