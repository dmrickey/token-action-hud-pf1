/**
 *  see https://foundryvtt.wiki/en/development/api/settings for defaults
 */

import { MODULE } from './constants.js';
import { Utils } from './utils.js';

const keys = {
    actionLayout: 'actionLayout',
    categorizeSkills: 'categorizeSkills',
    migrationVersion: 'migrationVersion',
    showModifiers: 'showModifiers',
    showPassiveFeatures: 'showPassiveFeatures',
    showPassiveInventory: 'showPassiveInventory',
    simplifySkillNames: 'simplifySkillNames',
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
            choices: {
                'onlyItems': Utils.localize('settings.actionLayout.choices.onlyItems'),
                'onlyActions': Utils.localize('settings.actionLayout.choices.onlyActions'),
                'categorized': Utils.localize('settings.actionLayout.choices.categorized'),
            },
            default: 'categorized',
            type: String,
        },
        [keys.showModifiers]: {
            default: true,
            type: Boolean,
        },
        [keys.categorizeSkills]: {
            default: true,
            type: Boolean,
        },
        [keys.showPassiveFeatures]: {
            default: false,
            type: Boolean,
        },
        [keys.showPassiveInventory]: {
            default: false,
            type: Boolean,
        },
        [keys.simplifySkillNames]: {
            default: true,
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
        .forEach((key) =>
            game.settings.register(MODULE.ID, key, {
                ...defaultSetting,
                name: Utils.localize(`settings.${key}.name`),
                hint: Utils.localize(`settings.${key}.hint`),
                ...settings[key],
            })
        );
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

    static get migrationVersion() {
        return Settings.#getSetting(keys.migrationVersion);
    }

    static set migrationVersion(version) {
        Settings.#setSetting(keys.migrationVersion, version);
    }

    /**
     * @returns {boolean} Simplifies skill names to only the name in parenthesis
     */
    static get simplifySkillNames() {
        return Settings.#getSetting(keys.simplifySkillNames);
    }

    /**
     * @returns {boolean} Simplifies skill names to only the name in parenthesis
     */
    static set simplifySkillNames(value) {
        return Settings.#setSetting(keys.simplifySkillNames, value);
    }

    /**
     * @returns {boolean} Should show roll modifiers
     */
    static get showModifiers() {
        return Settings.#getSetting(keys.showModifiers);
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

    static async toggleSkipDialog() {
        const current = Settings.pf1SkipActionDialogs;
        await Settings.#setSetting('skipActionDialogs', !current, 'pf1');
    }

    static async toggleTahGrid() {
        const current = Settings.tahGrid;
        await Settings.#setSetting('grid', !current, 'token-action-hud-core');
    }

    static #getSetting(key, moduleId = MODULE.ID) {
        return game.settings.get(moduleId, key);
    }

    static async #setSetting(key, value, moduleId = MODULE.ID) {
        await game.settings.set(moduleId, key, value);
    }
}
