import { ActionBuilderActorData } from '../models/actor-data.js';
import { CATEGORY_MAP } from './categories.js';
import { ROLL_TYPE } from './constants.js';
import { Settings } from './settings.js';
import { Utils } from "./utils";

export let HudBuilder = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    HudBuilder = class HudBuilder extends coreModule.api.ActionHandler {
        actorData = new ActionBuilderActorData();

        /**
         * Build System Actions
         * @override
         * @param {array} subcategoryIds
         */
        async buildSystemActions(_subcategoryIds) {
            const { actor, token } = this;
            this.actorData = new ActionBuilderActorData({ actor, token });

            if (!this.actorData.isValid) {
                return;
            }

            this.#_buildSkills();
            this.#_buildSaves();
            this.#_buildChecks();
            this.#_buildConditions();

            this.#_buildCombat();
            this.#_buildBuffs();
            this.#_buildInventory();
            this.#_buildSpells();
            this.#_buildFeatures();
            this.#_buildOtherItems();
            this.#_buildUtils();
        }

        #_handledItemTypes = [
            'attack',
            'buff',
            'consumable',
            'container',
            'equipment',
            'feat',
            'loot',
            'spell',
            'weapon',
        ];

        /**
         * This override lets me call with a fully defined subcategory without blowing up core logic
         *  @override */
        addActionsToActionList(actions, subcateogry) {
            const { name, id } = subcateogry;
            super.addActionsToActionList(actions, { name, id });
        }

        /**
         * This override lets me call with a fully defined parent subcategory without blowing up core logic
         *  @override */
        addSubcategoryToActionList(parentSubcategoryData, subcategoryData) {
            const { type, id } = parentSubcategoryData;
            super.addSubcategoryToActionList({ type, id }, subcategoryData);

            if (subcategoryData.info1 && !Utils.isEmptyObject(subcategoryData.info1)) {
                const data = {
                    id: subcategoryData.id,
                    type: subcategoryData.type,
                    info: { info1: subcategoryData.info1 },
                };
                this.addSubcategoryInfo(data);
            }
        }

        #_buildChecks() {
            const saves = Object.keys(pf1.config.abilities);

            const actions = saves.map((key) => ({
                id: key,
                name: pf1.config.abilities[key],
                encodedValue: this.#_encodeData(ROLL_TYPE.abilityCheck, key),
            }));
            this.addActionsToActionList(actions, CATEGORY_MAP.checks.subcategories.checks);
        }

        #_buildSaves() {
            const saves = Object.keys(pf1.config.savingThrows);

            const actions = saves.map((key) => ({
                id: key,
                name: pf1.config.savingThrows[key],
                encodedValue: this.#_encodeData(ROLL_TYPE.save, key),
            }));
            this.addActionsToActionList(actions, CATEGORY_MAP.saves.subcategories.saves);
        }

        #_buildUtils() {
            const { subcategories } = CATEGORY_MAP.utility;

            const rest = {
                id: 'rest',
                name: Utils.localize('PF1.Rest'),
                encodedValue: this.#_encodeData(ROLL_TYPE.rest),
            }
            this.addActionsToActionList([rest], subcategories.rest);

            const tokenActions = [];
            if (game.user.isGM) {
                const isHidden = this.actorData.tokens
                    .every((token) => token.document.hidden);
                tokenActions.push(isHidden ? {
                    id: 'makeVisible',
                    name: Utils.localize('categories.makeVisible'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.makeVisible),
                } : {
                    id: 'makeInvisible',
                    name: Utils.localize('categories.makeInvisible'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.makeInvisible),
                });
            }

            if (game.user.can('TOKEN_CONFIGURE')
                && this.actorData.tokens.every((token) => token.isOwner)
            ) {
                tokenActions.push({
                    id: 'openTokenConfig',
                    name: Utils.localize('actions.openTokenConfig'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.openTokenConfig),
                });
            };
            this.addActionsToActionList(tokenActions, subcategories.token);

            const utilActions = [{
                id: 'toggleTahGrid',
                name: Utils.localize('actions.toggleTahGrid'),
                encodedValue: this.#_encodeData(ROLL_TYPE.toggleTahGrid),
                cssClass: Settings.tahGrid ? ' active' : '',
            }, {
                id: 'toggleSkip',
                name: Utils.localize(Settings.pf1SkipActionDialogs ? 'actions.toggleSkipEnabled' : 'actions.toggleSkipDisabled'),
                encodedValue: this.#_encodeData(ROLL_TYPE.toggleSkip),
                cssClass: Settings.pf1SkipActionDialogs ? ' active' : '',
            }, {
                id: 'openSettings',
                name: Utils.localize('actions.openSettings'),
                encodedValue: this.#_encodeData(ROLL_TYPE.openSettings),
            }];
            this.addActionsToActionList(utilActions, subcategories.utility);
        }

        #_buildCombat() {
            const { subcategories } = CATEGORY_MAP.combat;

            const needsInitiative = !this.actorData.isMulti && this.actorData.inCombat && this.actorData.combatant.initiative !== null;
            const currentInitiativeInfo = this.actorData.isMulti || !this.actorData.inCombat || !needsInitiative
                ? {}
                : { text: this.actorData.combatant.initiative };
            const basicActions = [{
                id: 'showDefenses',
                name: Utils.localize('actions.displayDefenses'),
                encodedValue: this.#_encodeData(ROLL_TYPE.defenses),
            }, {
                id: 'bab',
                name: Utils.localize('PF1.BABAbbr'),
                encodedValue: this.#_encodeData(ROLL_TYPE.bab),
            }, {
                id: 'cmb',
                name: Utils.localize('PF1.CMBAbbr'),
                encodedValue: this.#_encodeData(ROLL_TYPE.cmb),
            }, {
                id: 'melee',
                name: Utils.localize('PF1.Melee'),
                encodedValue: this.#_encodeData(ROLL_TYPE.melee),
            }, {
                id: 'ranged',
                name: Utils.localize('PF1.Ranged'),
                encodedValue: this.#_encodeData(ROLL_TYPE.ranged),
            }, {
                id: 'initiative',
                name: Utils.localize('PF1.Initiative'),
                encodedValue: this.#_encodeData(ROLL_TYPE.initiative),
                cssClass: needsInitiative ? ' active' : '',
                info1: currentInitiativeInfo,
            }];

            if (game.user.isGM) {
                const action = this.actorData.inCombat ? {
                    id: 'removeFromCombat',
                    name: Utils.localize('COMBAT.CombatantRemove'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.removeFromCombat),
                } : {
                    id: 'addToCombat',
                    name: Utils.localize('COMBAT.CombatantCreate'),
                    encodedValue: this.#_encodeData(ROLL_TYPE.addToCombat),
                };
                basicActions.push(action);
            }

            if (!this.actorData.isMulti && this.actorData.inCombat) {
                const { actorId, tokenId } = this.actorData;
                const combatant = game.combat.combatants.find((combatant) => combatant.actorId === actorId && combatant.tokenId === tokenId);
                if (game.combat.current.combatantId === combatant.id) {
                    basicActions.push({
                        id: 'endTurn',
                        name: game.i18n.translations.COMBAT.TurnEnd,
                        encodedValue: this.#_encodeData(ROLL_TYPE.endTurn),
                    });
                }
            }

            this.addActionsToActionList(basicActions, subcategories.base);

            if (this.actorData.isMulti) {
                return;
            }

            const filter = (subType) => (item) => item.type === 'attack' && item.subType === subType;
            this.#_buildFilteredItemActions(filter('weapon'), subcategories.weaponAttaack);
            this.#_buildFilteredItemActions(filter('natural'), subcategories.naturalAttack);
            this.#_buildFilteredItemActions(filter('ability'), subcategories.classAbilities);
            this.#_buildFilteredItemActions(filter('racialAbility'), subcategories.racialAbilities);
            this.#_buildFilteredItemActions(filter('item'), subcategories.items);
            this.#_buildFilteredItemActions(filter('misc'), subcategories.miscellaneous);

            // leftovers that could be from other mods or from a change in pf1
            const otherFilter = (item) => item.type === 'attack'
                && !['weapon', 'natural', 'ability', 'racialAbility', 'item', 'misc',].includes(item.subType);
            this.#_buildFilteredItemActions(otherFilter, subcategories.other, Settings.showPassiveFeatures);
        }

        #_buildBuffs() {
            if (this.actorData.isMulti) {
                return;
            }

            const mapBuffs = ([id, item]) => ({
                cssClass: 'toggle' + (item.isActive ? ' active' : ''),
                encodedValue: this.#_encodeData(ROLL_TYPE.buff, id, { enable: !item.isActive }),
                id,
                img: item.img,
                name: item.name,
            });

            const addBuffs = (subType, subcategory) => {
                const buffs = this.actorData.items
                    .filter(([_id, item]) => item.type === 'buff' && item.subType === subType)
                    .map(mapBuffs);
                this.addActionsToActionList(buffs, subcategory);
            }

            const { subcategories } = CATEGORY_MAP.buffs;

            addBuffs('item', subcategories.item);
            addBuffs('temp', subcategories.temporary);
            addBuffs('perm', subcategories.permanent);
            addBuffs('misc', subcategories.miscellaneous);

            // leftovers that could be from other mods or from a change in pf1
            const otherBuffs = this.actorData.items
                .filter(([_id, item]) => item.type === 'buff' && !['item', 'temp', 'perm', 'misc'].includes(item.subType))
                .map(mapBuffs);
            this.addActionsToActionList(otherBuffs, subcategories.other);
        }

        #_buildFeatures() {
            if (this.actorData.isMulti) {
                return;
            }

            const { subcategories } = CATEGORY_MAP.features;

            const filter = (subType) => (item) => item.type === 'feat' && item.subType === subType;
            this.#_buildFilteredItemActions(filter('classFeat'), subcategories.classFeat, Settings.showPassiveFeatures);
            this.#_buildFilteredItemActions(filter('feat'), subcategories.feat, Settings.showPassiveFeatures);
            this.#_buildFilteredItemActions(filter('racial'), subcategories.racial, Settings.showPassiveFeatures);
            this.#_buildFilteredItemActions(filter('template'), subcategories.template, Settings.showPassiveFeatures);
            this.#_buildFilteredItemActions(filter('trait'), subcategories.trait, Settings.showPassiveFeatures);
            this.#_buildFilteredItemActions(filter('misc'), subcategories.misc, Settings.showPassiveFeatures);

            // features added by spheres of power mod
            this.#_buildFilteredItemActions(filter('combatTalent'), subcategories.combatTalents, Settings.showPassiveFeatures);
            this.#_buildFilteredItemActions(filter('magicTalent'), subcategories.magicTalents, Settings.showPassiveFeatures);

            // leftovers that could be from other mods or from a change in pf1
            const otherFilter = (item) => item.type === 'feat'
                && !['classFeat', 'feat', 'racial', 'template', 'trait', 'misc', 'combatTalent', 'magicTalent'].includes(item.subType);
            this.#_buildFilteredItemActions(otherFilter, subcategories.other, Settings.showPassiveFeatures);
        }

        #_buildOtherItems() {
            if (this.actorData.isMulti) {
                return;
            }

            const { subcategories } = CATEGORY_MAP.other;

            const filter = (item) => !this.#_handledItemTypes.includes(item.type);
            this.#_buildFilteredItemActions(filter, subcategories.other, Settings.showPassiveFeatures);
        }

        #_buildInventory() {
            if (this.actorData.isMulti) {
                return;
            }

            const { subcategories } = CATEGORY_MAP.inventory;

            this.#_buildFilteredItemActions((item) => item.type === 'weapon', subcategories.weapons, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'equipment', subcategories.equipment, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'consumable', subcategories.consumables, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'container', subcategories.containers, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'loot' && item.subType === 'tradeGoods', subcategories.tradeGoods, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'loot' && item.subType === 'misc', subcategories.miscellaneous, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'loot' && item.subType === 'ammo', subcategories.ammunition, Settings.showPassiveInventory);
            this.#_buildFilteredItemActions((item) => item.type === 'loot' && item.subType === 'gear', subcategories.gear, Settings.showPassiveInventory);

            // leftovers that could be from other mods or from a change in pf1
            const otherFilter = (item) => (item.type === 'loot' && !['tradeGoods', 'misc', 'ammo', 'gear'].includes(item.subType));
            this.#_buildFilteredItemActions(otherFilter, subcategories.other, Settings.showPassiveFeatures);
        }

        #knowledgeSkillIds = ['kar', 'kdu', 'ken', 'kge', 'khi', 'klo', 'kna', 'kno', 'kpl', 'kre'];
        #_buildSkills() {
            const skillCategory = CATEGORY_MAP.skills.subcategories.skills;

            const actorSkills = this.actorData.isMulti
                ? pf1.config.skills
                : this.actorData.actor.system.skills

            const excludedSkills = game.settings.get('pf1', 'allowBackgroundSkills')
                ? []
                : CONFIG.PF1.backgroundOnlySkills;

            const skillIds = Object.keys(actorSkills).filter((id) => !excludedSkills.includes(id));

            if (Settings.categorizeSkills) {
                const skills = skillIds
                    .filter((id) => this.actorData.isMulti || Utils.isEmptyObject(actorSkills[id].subSkills || {}))
                    .filter((id) => !this.#knowledgeSkillIds.includes(id))
                    .map((id) => ({ id, name: pf1.config.skills[id] || actorSkills[id].name }));
                const actions = skills.map(({ id, name }) => ({
                    id,
                    name: name,
                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                }));

                if (!this.actorData.isMulti) {
                    const subSkillIds = Object.keys(actorSkills).filter((id) => !Utils.isEmptyObject(actorSkills[id].subSkills || {}));
                    subSkillIds.forEach((id) => {
                        const subSkillIds = actorSkills[id].subSkills;
                        const subskills = subSkillIds
                            ? Object.keys(subSkillIds).map((sid) => ({
                                id: `categorized-${id}.subSkills.${sid}`,
                                name: subSkillIds[sid].name,
                                encodedValue: this.#_encodeData(ROLL_TYPE.skill, `${id}.subSkills.${sid}`),
                            }))
                            : [];

                        if (subskills.length) {
                            const groupedActions = [
                                {
                                    id: `categorized-${id}`,
                                    name: pf1.config.skills[id] || actorSkills[id].name,
                                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                                },
                                ...subskills,
                            ];
                            const subcategoryData = {
                                id: `${skillCategory.id}-${id}`,
                                name: groupedActions[0].name,
                                type: 'system-derived',
                            };
                            this.addSubcategoryToActionList(skillCategory, subcategoryData);
                            this.addActionsToActionList(groupedActions, subcategoryData);
                        }
                        else {
                            actions.push({
                                id,
                                name: pf1.config.skills[id] || actorSkills[id].name,
                                encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                            });
                        }
                    });
                }

                const knowledgeName = (original) => /\(([^)]+)\)/g.exec(original)[1] || original;
                const knowledges = this.#knowledgeSkillIds.map((id) => ({
                    id: `categorized-${id}`,
                    name: knowledgeName(pf1.config.skills[id]),
                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                }));
                const knowledgeSubcategoryData = {
                    id: `${skillCategory.id}-knowledge`,
                    name: Utils.localize('PF1.KnowledgeSkills'),
                    type: 'system-derived',
                };
                this.addSubcategoryToActionList(skillCategory, knowledgeSubcategoryData);
                this.addActionsToActionList(knowledges, knowledgeSubcategoryData);

                const sorted = [...actions].sort((a, b) => a.name < b.name ? -1 : 1);
                this.addActionsToActionList(sorted, skillCategory);
            }
            else {
                const getSubskills = (key) => actorSkills[key].subSkills
                    ? Object.keys(actorSkills[key].subSkills).map((s) => ({ id: `${key}.subSkills.${s}`, name: actorSkills[key].subSkills[s].name }))
                    : [];
                const skills = [...skillIds.map((id) => ({ id, name: pf1.config.skills[id] || actorSkills[id].name })), ...skillIds.flatMap(getSubskills)];
                const actions = skills.map(({ id, name }) => ({
                    id,
                    name: name,
                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                }));
                const sorted = [...actions].sort((a, b) => a.name < b.name ? -1 : 1);

                this.addActionsToActionList(sorted, skillCategory);
            }
        }

        #_buildConditions() {
            const conditions = Object.keys(pf1.config.conditions);
            const actions = conditions.map((key) => {
                const isEnabled = this.actorData.actors.every((actor) => actor.hasCondition(key));
                return {
                    cssClass: 'toggle' + (isEnabled ? ' active' : ''),
                    encodedValue: this.#_encodeData(ROLL_TYPE.condition, key, { enable: !isEnabled }),
                    id: key,
                    img: pf1.config.conditionTextures[key],
                    name: pf1.config.conditions[key],
                };
            });

            this.addActionsToActionList(actions, CATEGORY_MAP.conditions.subcategories.conditions);
        }

        #_buildSpells() {
            if (this.actorData.isMulti) {
                return;
            }

            const spellCategory = CATEGORY_MAP.spells.subcategories.spells;
            const allSpells = this.actorData.items
                .filter(([_id, item]) => item.type === 'spell' && Utils.canUseItem(item));

            const spellbookKeys = Object.keys(this.actorData.actor.system.attributes.spells.spellbooks)
                .map((key) => ({ key, spellbook: this.actorData.actor.system.attributes.spells.spellbooks[key] }))
                .filter(({ _key, spellbook }) => spellbook.inUse)
                .map(({ key, _spellbook }) => key);

            const { spellbooks } = this.actorData.actor.system.attributes.spells;
            const levels = Array.from(Array(10).keys());

            spellbookKeys.forEach((key) => {
                const spellbook = spellbooks[key];
                const spellbookCategory = {
                    hasDerivedSubcategories: true,
                    id: `${spellCategory.id}-${key}`,
                    name: Utils.localize(spellbook.label) || spellbook.name,
                    type: 'system-derived',
                };
                this.addSubcategoryToActionList(spellCategory, spellbookCategory);

                // todo add roll icons
                const basicActions = [
                    {
                        id: 'casterLevel',
                        name: Utils.localize('PF1.CasterLevelCheck'),
                        encodedValue: this.#_encodeData(ROLL_TYPE.casterLevel, 'casterLevel', { book: key }),
                    },
                    {
                        id: 'concentration',
                        name: Utils.localize('PF1.ConcentrationCheck'),
                        encodedValue: this.#_encodeData(ROLL_TYPE.concentration, 'concentration', { book: key }),
                    },
                ];
                this.addActionsToActionList(basicActions, spellbookCategory);

                let prepFilter;
                switch (Settings.spellPreparation) {
                    case 'allSpells':
                        prepFilter = (_spell) => true;
                        break;
                    case 'allPrepared':
                        prepFilter = (spell) => !!spell.maxCharges;
                        break;
                    case 'onlyRemaining':
                    default:
                        prepFilter = (spell) => !!spell.charges;
                        break;
                }

                const bookSpells = allSpells.filter(([_id, spell]) => spell.system.spellbook === key && prepFilter(spell));

                levels.forEach((level) => {
                    const levelCategory = {
                        hasDerivedSubcategories: true,
                        id: `${spellbookCategory.id}-${level}`,
                        name: Utils.localize(`PF1.SpellLevel${level}`),
                        type: 'system-derived',
                    };

                    const spellLevel = spellbook.spells[`spell${level}`];
                    if (level && spellbook.spontaneous && spellLevel.max) {
                        levelCategory.info1 = { text: `${spellLevel.value || 0}/${spellLevel.max}` };
                    }

                    this.addSubcategoryToActionList(spellbookCategory, levelCategory);

                    const itemChargeInfo = (spell) => spellbook.spontaneous
                        ? {}
                        : { text: spell.maxCharges === Number.POSITIVE_INFINITY ? '' : `${spell.charges}/${spell.maxCharges}` };

                    const levelSpells = bookSpells.filter(([_id, item]) => item.spellLevel === level);
                    this.#_addItemActionsToCategory(levelSpells, levelCategory, itemChargeInfo, () => ({}));
                });
            });
        }

        #_buildFilteredItemActions(filter, subcategory, includeUnusable = false) {
            if (this.actorData.isMulti) {
                return;
            }

            const filtered = this.actorData.items
                .filter(([_id, item]) => filter(item) && Utils.canUseItem(item));
            this.#_addItemActionsToCategory(filtered, subcategory);

            if (includeUnusable) {
                const unusable = this.actorData.items
                    .filter(([_id, item]) => filter(item) && !Utils.canUseItem(item));
                const subcategoryData = {
                    hasDerivedSubcategories: true,
                    id: `${subcategory.id}-unusable`,
                    name: Utils.localize('PF1.ActivationTypePassive'),
                    type: 'system-derived',
                };
                this.addSubcategoryToActionList(subcategory, subcategoryData);
                this.#_addItemActionsToCategory(unusable, subcategoryData);
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

        #_addItemActionsToCategory(
            items,
            parentSubcategoryData,
            itemChargeInfo = null,
            actionChargeInfo = null,
        ) {
            if (this.actorData.isMulti) {
                return;
            }

            const info1 = (_item) => ({});
            const info2 = (_item) => ({});

            itemChargeInfo ??= (item) => item.maxCharges
                ? { text: `${item.charges}/${item.maxCharges}`, class: 'charged' }
                : {};
            actionChargeInfo ??= (action) => {
                const { self } = action.data.uses;
                const cost = action.getChargeCost();
                const values = [];
                if (cost) {
                    values.push(cost);
                }
                if (action.isSelfCharged && self.max) {
                    values.push(`${self.value}/${self.max}`)
                }
                return { text: values.join(', '), class: 'charged' };
            }

            const mapItemToAction = ([id, item], idType) => ({
                id: `${idType}-${id}`,
                img: item.img,
                name: item.name,
                encodedValue: this.#_encodeData(ROLL_TYPE.item, id),
                info1: info1(item),
                info2: info2(item),
                info3: itemChargeInfo(item),
            });
            const mapSubActionToAction = (item, action, idType, { name } = { name: action.name }) => ({
                id: `${idType}-${action.id}`,
                img: item.img,
                name: name,
                encodedValue: this.#_encodeData(ROLL_TYPE.item, item.id, { subActionId: action.id }),
                info1: info1(item),
                info2: info2(item),
                info3: actionChargeInfo(action),
            });

            switch (Settings.actionLayout) {
                case 'onlyItems': {
                    const actions = items.map(([id, item]) => mapItemToAction([id, item], 'onlyItems'));
                    this.addActionsToActionList(actions, parentSubcategoryData);
                } break;
                case 'onlyActions': {
                    const actions = (items.flatMap(([id, item]) => Utils.getItemActions(item).length > 1
                        ? Utils.getItemActions(item).map((action) => mapSubActionToAction(item, action, 'onlyActions', { name: `${item.name} - ${action.name}` }))
                        : mapItemToAction([id, item], 'onlyActions')));
                    this.addActionsToActionList(actions, parentSubcategoryData);
                } break;
                case 'categorized':
                default: {
                    items.forEach(([id, item]) => {
                        if (Utils.getItemActions(item).length > 1) {
                            const subActions = item.actions.map((action) => mapSubActionToAction(item, action, 'categorized'));

                            const subcategoryData = {
                                id: `${parentSubcategoryData.id}-${item.id}`,
                                info1: itemChargeInfo(item),
                                name: item.name,
                                type: 'system-derived',
                            };
                            this.addSubcategoryToActionList(parentSubcategoryData, subcategoryData);
                            this.addActionsToActionList(subActions, subcategoryData);
                        }
                        else {
                            // has a use script call or a single action
                            const action = mapItemToAction([id, item], 'categorized');
                            this.addActionsToActionList([action], parentSubcategoryData);
                        }
                    });
                } break;
            }
        }
    }
});
