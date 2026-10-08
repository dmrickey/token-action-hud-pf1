import { ActionBuilderActorData } from './models/actor-data.js';
import { GROUP_MAP } from './groups.js';
import { ROLL_TYPE } from './constants.js';
import { Settings } from './settings.js';
import { Utils } from "./utils.js";

export let HudBuilder = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    HudBuilder = class HudBuilder extends coreModule.api.ActionHandler {
        actorData = new ActionBuilderActorData();

        /**
         * Build System Actions
         * @override
         * @param {array} groupIds
         */
        async buildSystemActions(_groupIds) {
            const { actor, token } = this;
            this.actorData = new ActionBuilderActorData({ actor, token });

            if (!this.actorData.isValid) {
                return;
            }

            await Promise.all([
                this.#_buildSkills(),
                this.#_buildSaves(),
                this.#_buildChecks(),
                this.#_buildConditions(),

                //  this.#_buildCombat(),
                //  this.#_buildBuffs(),
                //  this.#_buildInventory(),
                this.#_buildSpells(),
                //  this.#_buildFeatures(),
                //  this.#_buildOtherItems(),
                this.#_buildUtils(),
            ]);
        }

        async #_buildChecks() {
            const saves = Object.keys(pf1.config.abilities);

            const actions = saves.map((key) => ({
                id: `ability-${key}`,
                info1: this.#modToInfo(this.actorData.actor.system.abilities[key].mod),
                encodedValue: this.#_encodeData(ROLL_TYPE.abilityCheck, key),
                name: pf1.config.abilities[key],
            }));
            this.addActions(actions, GROUP_MAP.checks.groups.checks);
        }

        async #_buildSaves() {
            const saves = Object.keys(pf1.config.savingThrows);

            const actions = saves.map((key) => ({
                id: `save-${key}`,
                encodedValue: this.#_encodeData(ROLL_TYPE.save, key),
                info1: this.#modToInfo(this.actorData.actor.system.attributes.savingThrows[key].total),
                name: pf1.config.savingThrows[key].label,
            }));
            this.addActions(actions, GROUP_MAP.saves.groups.saves);
        }

        async #_buildUtils() {
            const { groups } = GROUP_MAP.utility;

            const rest = {
                id: 'util-rest',
                name: Utils.localize('PF1.Rest.Verb'),
                encodedValue: this.#_encodeData(ROLL_TYPE.rest),
            }
            this.addActions([rest], groups.rest);

            const tokenActions = [];
            if (game.user.isGM) {
                const isHidden = this.actorData.tokens
                    .every((token) => token.document.hidden);
                tokenActions.push(isHidden ? {
                    id: 'util-makeVisible',
                    name: Utils.localize('categories.makeVisible'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.makeVisible),
                } : {
                    id: 'util-makeInvisible',
                    name: Utils.localize('categories.makeInvisible'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.makeInvisible),
                });
            }

            if (game.user.can('TOKEN_CONFIGURE')
                && this.actorData.tokens.every((token) => token.isOwner)
            ) {
                tokenActions.push({
                    id: 'util-openTokenConfig',
                    name: Utils.localize('actions.openTokenConfig'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.openTokenConfig),
                });
            };
            this.addActions(tokenActions, groups.token);

            const utilActions = [{
                id: 'util-toggleTahGrid',
                name: Utils.localize('actions.toggleTahGrid'),
                encodedValue: this.#_encodeData(ROLL_TYPE.toggleTahGrid),
                cssClass: Settings.tahGrid ? ' active' : '',
            }, {
                id: 'util-toggleSkip',
                name: Utils.localize(Settings.pf1SkipActionDialogs ? 'actions.toggleSkipEnabled' : 'actions.toggleSkipDisabled'),
                encodedValue: this.#_encodeData(ROLL_TYPE.toggleSkip),
                cssClass: Settings.pf1SkipActionDialogs ? ' active' : '',
            }, {
                id: 'util-openSettings',
                name: Utils.localize('actions.openSettings'),
                encodedValue: this.#_encodeData(ROLL_TYPE.openSettings),
            }];
            this.addActions(utilActions, groups.utility);
        }

        async #_buildCombat() {
            const { groups } = GROUP_MAP.combat;

            let meleeMod, rangedMod;

            if (this.actorData.isSingle) {
                const { abilities, attributes, traits } = this.actorData.actor.system;
                const { attack } = attributes;
                const sizeModifier = pf1.config.sizeMods[traits.size.base]
                const baseBonus = attack.shared + attack.general;
                const meleeAbility = abilities[attack.meleeAbility]?.mod ?? 0;
                const rangedAbility = abilities[attack.rangedAbility]?.mod ?? 0;

                meleeMod = baseBonus + attack.melee + meleeAbility + sizeModifier;
                rangedMod = baseBonus + attack.ranged + rangedAbility + sizeModifier;
            }

            const basicActions = [{
                id: 'combat-showDefenses',
                name: Utils.localize('actions.displayDefenses'),
                encodedValue: this.#_encodeData(ROLL_TYPE.defenses),
            }, {
                id: 'combat-bab',
                encodedValue: this.#_encodeData(ROLL_TYPE.bab),
                info1: this.#modToInfo(this.actorData.actor.system.attributes.bab.total),
                name: Utils.localize('PF1.BABAbbr'),
            }, {
                id: 'combat-cmb',
                encodedValue: this.#_encodeData(ROLL_TYPE.cmb),
                info1: this.#modToInfo(this.actorData.actor.system.attributes.cmb.total),
                name: Utils.localize('PF1.CMBAbbr'),
            }, {
                id: 'combat-melee',
                encodedValue: this.#_encodeData(ROLL_TYPE.melee),
                info1: this.#modToInfo(meleeMod),
                name: Utils.localize('PF1.Melee'),
            }, {
                id: 'combat-ranged',
                encodedValue: this.#_encodeData(ROLL_TYPE.ranged),
                info1: this.#modToInfo(rangedMod),
                name: Utils.localize('PF1.Ranged'),
            }, {
                id: 'combat-initiative',
                name: Utils.localize('PF1.Initiative'),
                encodedValue: this.#_encodeData(ROLL_TYPE.initiative),
                cssClass: this.actorData.inCombat ? 'active' : '',
                info1: [null, undefined].includes(this.actorData.combatant.initiative)
                    ? this.#modToInfo(this.actorData.actor.system.attributes.init.total)
                    : { text: this.actorData.combatant.initiative },
            }];

            if (game.user.isGM) {
                const action = this.actorData.inCombat ? {
                    id: 'combat-removeFromCombat',
                    name: Utils.localize('COMBAT.CombatantRemove'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.removeFromCombat),
                } : {
                    id: 'combat-addToCombat',
                    name: Utils.localize('COMBAT.CombatantCreate'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.addToCombat),
                };
                basicActions.push(action);
            }

            if (this.actorData.isCurrentCombatant) {
                basicActions.push({
                    id: 'combat-endTurn',
                    name: Utils.localize('COMBAT.TurnEnd'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.endTurn),
                });
            }

            this.addActions(basicActions, groups.base);

            if (this.actorData.isMulti) {
                return;
            }

            var builds = Object.entries(groups)
                .filter(([key, _]) => key !== 'base')
                .map(([_, g]) => g)
                .map((group) => this.#_buildFilteredItemActions(group, Settings.showPassiveInventory));
            await Promise.all(builds);
        }

        async #_buildBuffs() {
            if (this.actorData.isMulti) {
                return;
            }

            const mapBuff = (buff) => ({
                cssClass: 'toggle' + (buff.isActive ? ' active' : ''),
                encodedValue: this.#_encodeData(ROLL_TYPE.buff, buff.id, { enable: !buff.isActive }),
                id: buff.id,
                img: buff.img,
                name: buff.name,
            });

            const addBuffs = (subType, group) => {
                const buffs = this.actorData.buffs
                    .filter((buff) => buff.subType === subType)
                    .map(mapBuff);
                this.addActions(buffs, group);
            };

            const { groups } = GROUP_MAP.buffs;

            addBuffs('temp', groups.temporary);
            addBuffs('spell', groups.spell);
            addBuffs('item', groups.item);
            addBuffs('feat', groups.feat);
            addBuffs('perm', groups.permanent);
            addBuffs('misc', groups.miscellaneous);

            const withActions = this.actorData.buffs
                .filter((buff) => buff.isActive && Utils.getItemActions(buff).length > 0);
            await this.#_addItemActions(withActions, groups.actions, { actionLayout: 'onlyActions' });

            // leftovers that could be from other mods or from a change in pf1
            const otherBuffs = this.actorData.buffs
                .filter((item) => !['item', 'temp', 'perm', 'misc', 'feat', 'spell'].includes(item.subType))
                .map(mapBuff);
            this.addActions(otherBuffs, groups.other);
        }

        async #_buildFeatures() {
            if (this.actorData.isMulti) {
                return;
            }

            var builds = Object.values(GROUP_MAP.features.groups)
                .map((group) => this.#_buildFilteredItemActions(group, Settings.showPassiveInventory));
            await Promise.all(builds);
        }

        async #_buildOtherItems() {
            if (this.actorData.isMulti) {
                return;
            }

            await this.#_buildFilteredItemActions(GROUP_MAP.other.groups.other, Settings.showPassiveFeatures);
        }

        async #_buildInventory() {
            if (this.actorData.isMulti) {
                return;
            }

            var builds = Object.values(GROUP_MAP.inventory.groups)
                .map((group) => this.#_buildFilteredItemActions(group, Settings.showPassiveInventory));
            await Promise.all(builds);
        }

        #toSignedString = (mod) => !mod ? '±0' : mod > 0 ? `+${mod}` : `${mod}`;
        #modToInfo = (mod) => Settings.showModifiers && this.actorData.isSingle ? { class: 'roll-modifier', text: this.#toSignedString(mod) } : undefined;

        async #_buildSkills() {
            const skillGroup = GROUP_MAP.skills.groups.skills;

            const actorSkills = this.actorData.isMulti
                ? new Collection((await pf1.utils.internal.getSkillSet()).map(skill => [skill.system.identifier, skill]))
                : this.actorData.actor.skills;

            const skills = [];
            const subs = {};
            actorSkills.contents.forEach(skill => {
                if (Settings.hideUntrainedSkills && skill.system.rt && !skill.system.rank) {
                    return;
                }

                const isGroupedSkill = skill.system.parentSkill || skill.system.subskills;
                const data = {
                    id: skill.system.identifier,
                    cssClass: this.actorData.isSingle && skill.system.rt && !skill.system.rank ? 'action-nulled-out' : '',
                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, skill.system.identifier),
                    info1: this.#modToInfo(skill.system.mod),
                    name: skill.name,
                };

                if (Settings.categorizeSkills && isGroupedSkill) {
                    const parentId = skill.system.parentSkill ? skill.system.parentSkill.system.identifier : skill.system.identifier;
                    subs[parentId] ||= [];
                    subs[parentId].push(data);
                }
                else {
                    skills.push(data);
                }
            });

            Object.entries(subs).forEach(([parentId, subSkills]) => {
                subSkills.sort((a, b) =>
                    a.id === parentId
                        ? -1 : b.id === parentId
                            ? 1 : a.name < b.name
                                ? -1 : 1
                );

                if (subSkills[0].id !== parentId) {
                    const parent = actorSkills.get(parentId);
                    subSkills.unshift({
                        id: `categorized-${parentId}`,
                        cssClass: parent.system.rt && !parent.system.rank ? 'action-nulled-out' : '',
                        encodedValue: this.#_encodeData(ROLL_TYPE.skill, parentId),
                        info1: this.#modToInfo(parent.system.mod),
                        name: parent.name,
                    });
                }

                const subSkillGroup = {
                    id: `${skillGroup.id}-${parentId}`,
                    name: subSkills[0].name,
                    type: 'system-derived',
                };

                this.addGroup(subSkillGroup, skillGroup);
                this.addActions(subSkills, subSkillGroup);
            });

            skills.sort((a, b) => a.name < b.name ? -1 : 1);
            this.addActions(skills, skillGroup);

            // add skill utilities
            {
                const utils = [];
                const areHidden = Settings.hideUntrainedSkills;
                utils.push(areHidden ? {
                    id: 'util-makeVisible',
                    name: Utils.localize('actions.toggleUntrainedSkillsDisabled'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.toggleUntrainedSkills),
                } : {
                    id: 'util-makeInvisible',
                    name: Utils.localize('actions.toggleUntrainedSkillsEnabled'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.toggleUntrainedSkills),
                });

                const showGrouped = Settings.categorizeSkills;
                utils.push(showGrouped ? {
                    id: 'util-groupSkills',
                    name: Utils.localize('actions.categorizeSkillsEnabled'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.toggleCategorizeSkills),
                } : {
                    id: 'util-ungroupSkills',
                    name: Utils.localize('actions.categorizeSkillsDisabled'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.toggleCategorizeSkills),
                });

                this.addActions(utils, GROUP_MAP.skills.groups.utils);
            }
        }

        async #_buildConditions() {
            const actions = pf1.registry.conditions.contents.map(({ id, name, texture }) => {
                const isEnabled = this.actorData.actors.every((actor) => actor.statuses.has(id));
                return {
                    cssClass: 'toggle' + (isEnabled ? ' active' : ''),
                    encodedValue: this.#_encodeData(ROLL_TYPE.condition, id, { enable: !isEnabled }),
                    id,
                    img: texture,
                    name,
                };
            });

            this.addActions(actions, GROUP_MAP.conditions.groups.conditions);
        }

        async #_buildSpells() {
            if (this.actorData.isMulti) {
                return;
            }

            const spellGroup = GROUP_MAP.spells.groups.spells;

            const spellbookKeys = Object.keys(this.actorData.actor.system.spells);
            const spellbooks = this.actorData.actor.system.spells;

            const levels = Array.from(Array(10).keys());

            for (const key of spellbookKeys) {
                const spellbook = spellbooks[key];
                let spellbookGroup = spellGroup;
                if (spellbookKeys.length > 1) {
                    spellbookGroup = {
                        id: `${spellGroup.id}-${key}`,
                        name: spellbook.parent.name,
                        type: 'system-derived',
                        settings: { style: 'tab' },
                    };
                    this.addGroup(spellbookGroup, spellGroup);
                }

                // todo add roll icons
                const basicActions = [
                    {
                        id: `casterLevel-${key}`,
                        name: Utils.localize('PF1.CasterLevel.Check'),
                        encodedValue: this.#_encodeData(ROLL_TYPE.casterLevel, 'casterLevel', { book: key }),
                    },
                    {
                        id: `concentration-${key}`,
                        name: Utils.localize('PF1.Concentration.Check.Label'),
                        encodedValue: this.#_encodeData(ROLL_TYPE.concentration, 'concentration', { book: key }),
                    },
                ];
                this.addActions(basicActions, spellbookGroup);

                let prepFilter;
                switch (Settings.spellPreparation) {
                    case 'allSpells':
                        prepFilter = (_spell) => true;
                        break;
                    case 'allPrepared':
                        prepFilter = (spell) => !!spell.maxCharges || spell.canUse;
                        break;
                    case 'onlyRemaining':
                    default:
                        prepFilter = (spell) => spell.canUse && (!spellbook.spontaneous || spell.system.level === 0 || !!spell.spellbook.levels[spell.system.level]?.value);
                        break;
                }

                const bookSpells = spellbook.items.filter((spell) => prepFilter(spell));

                for (const level of levels) {
                    const levelGroup = {
                        id: `${spellbookGroup.id}-${level}`,
                        name: Utils.localize(`PF1.SpellLevels.${level}`),
                        type: 'system-derived',
                    };

                    const spellLevel = spellbook.levels[level];
                    if (level && spellbook.spontaneous && spellLevel.max) {
                        levelGroup.info1 = { text: `${spellLevel.value || 0}/${spellLevel.max}` };
                    }

                    this.addGroup(levelGroup, spellbookGroup);

                    const itemChargeInfo = (spell) => spellbook.spontaneous
                        ? {}
                        : { text: spell.maxCharges === Number.POSITIVE_INFINITY ? '' : `${spell.charges}/${spell.maxCharges}` };

                    const levelSpells = bookSpells.filter((item) => item.system.level === level);
                    await this.#_addItemActions(levelSpells, levelGroup, { itemChargeInfo, actionChargeInfo: () => ({}) });
                }
            }
        }

        /**
         * @param {{id: string, name: string, filter: (item: ItemPF) => booelean}} parentGroup
         * @param {boolean} includeUnusable
         */
        async #_buildFilteredItemActions(parentGroup, includeUnusable = false) {
            if (this.actorData.isMulti) {
                return;
            }

            const { filter } = parentGroup;

            const filtered = this.actorData.items.filter(filter);
            await this.#_addItemActions(filtered, parentGroup);

            if (includeUnusable) {
                const unusable = this.actorData.unusableItems.filter(filter);
                const itemGroup = {
                    id: `${parentGroup.id}-unusable`,
                    name: Utils.localize('PF1.ActivationTypePassive'),
                    type: 'system-derived',
                };
                this.addGroup(itemGroup, parentGroup);
                await this.#_addItemActions(unusable, itemGroup);
            }
        }

        #_encodeData = (
            rollType,
            actionId,
            extraData = {},
        ) => JSON.stringify({
            rollType,
            actionId,
            actorId: this.actorData.isMulti ? '' : this.actorData.actorId,
            tokenId: this.actorData.isMulti ? '' : this.actorData.tokenId,
            isMulti: this.actorData.isMulti,
            ...extraData,
        });

        /**
         * @param {Array<Item>} items
         * @param {object} parentGroupData
         * @param {object} [options]
         * @param {(item: Item) => string} [options.itemChargeInfo]
         * @param {(action: Action) => Promise<{ text: string, class?: string }>} [options.actionChargeInfo]
         * @param {'onlyItems' | 'onlyActions' | 'categorized'} [options.actionLayout]
         * @returns {Promise}
         */
        async #_addItemActions(
            items,
            parentGroupData, {
                itemChargeInfo = null,
                actionChargeInfo = null,
                actionLayout = Settings.actionLayout,
            } = {}) {
            if (this.actorData.isMulti) {
                return;
            }

            const info1 = (_item) => ({});
            const info2 = (_item) => ({});

            itemChargeInfo ??= (item) => item.maxCharges && item.maxCharges !== Number.POSITIVE_INFINITY
                ? { text: `${item.charges}/${item.maxCharges}`, class: 'charged' }
                : {};
            actionChargeInfo ??= async (action) => {
                const { self } = action.uses;
                const cost = await action.getChargeCost();
                const values = [];
                if (cost) {
                    values.push(cost);
                }
                if (action.isSelfCharged && self.max) {
                    values.push(`${self.value}/${self.max}`)
                }
                return { text: values.join(', '), class: 'charged' };
            }

            const mapItemToAction = (item, idType) => ({
                id: `${item.id}-${idType}-${item.id}`,
                img: item.img,
                name: item.name,
                encodedValue: this.#_encodeData(ROLL_TYPE.item, item.id),
                info1: info1(item),
                info2: info2(item),
                info3: itemChargeInfo(item),
            });
            const mapSubActionToAction = async (item, action, idType, { name } = { name: action.name }) => ({
                id: `${idType}-${item.id}-${action.id}`,
                img: action.img || item.img,
                name,
                encodedValue: this.#_encodeData(ROLL_TYPE.item, item.id, { subActionId: action.id }),
                info1: info1(item),
                info2: info2(item),
                info3: await actionChargeInfo(action),
            });

            switch (actionLayout) {
                case 'onlyItems': {
                    const actions = items.map((item) => mapItemToAction(item, 'onlyItems'));
                    this.addActions(actions, parentGroupData);
                } break;
                case 'onlyActions': {
                    const actions = await Promise.all(items.flatMap((item) => (Utils.getItemActions(item).length > 1 || item.type === 'buff')
                        ? Utils.getItemActions(item).map((action) => mapSubActionToAction(item, action, 'onlyActions', { name: `${item.name} - ${action.name}` }))
                        : mapItemToAction(item, 'onlyActions'))
                    );
                    this.addActions(actions, parentGroupData);
                } break;
                case 'categorized':
                default: {
                    for (const item of items) {
                        if (Utils.getItemActions(item).length > 1) {
                            const subActions = await Promise.all(item.actions.map((action) => mapSubActionToAction(item, action, 'categorized')));

                            const groupData = {
                                id: `${parentGroupData.id}-${item.id}`,
                                info1: itemChargeInfo(item),
                                name: item.name,
                                type: 'system-derived',
                            };
                            this.addGroup(groupData, parentGroupData);
                            this.addActions(subActions, groupData);
                        }
                        else {
                            // has a use script call or a single action
                            const action = mapItemToAction(item, 'categorized');
                            this.addActions([action], parentGroupData);
                        }
                    }
                } break;
            }
        }
    }
});
