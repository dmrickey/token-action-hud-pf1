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

        /**
         * This override lets me call with a fully defined group without blowing up core logic
         *  @override */
        addActions(actions, subcateogry) {
            const { name, id } = subcateogry;
            super.addActions(actions, { name, id });
        }

        // could change this to directly take an info object instead if more than just "info1" is needed later
        #hasInfoChanged(sub1, sub2) {
            return sub1?.info1?.class !== sub2?.info1?.class
                || sub1?.info1?.title !== sub2?.info1?.title
                || sub1?.info1?.text !== sub2?.info1?.text;
        }

        // todo no category manager in v1.4 - quick patch for 1.4
        /**
         * This override lets me call with a fully defined parent group without blowing up core logic
         *  @override */
        addGroup(groupData, parentGroupData) {
            const { type, id } = parentGroupData;

            // todo
            const current = Object.values(game.tokenActionHud.actionHandler.groups).find((g) => g.id === groupData.id);
            const infoChanged = !!current && this.#hasInfoChanged(groupData, current);

            if (!infoChanged) {
                super.addGroup(groupData, { type, id });
            }
            else {
                current.info1 = groupData.info1;
                super.updateGroup(current, { type, id });
            }
        }

        #_buildChecks() {
            const saves = Object.keys(pf1.config.abilities);

            const actions = saves.map((key) => ({
                id: `ability-${key}`,
                info1: this.#modToInfo(this.actorData.actor.system.abilities[key].mod),
                encodedValue: this.#_encodeData(ROLL_TYPE.abilityCheck, key),
                name: pf1.config.abilities[key],
            }));
            this.addActions(actions, GROUP_MAP.checks.groups.checks);
        }

        #_buildSaves() {
            const saves = Object.keys(pf1.config.savingThrows);

            const actions = saves.map((key) => ({
                id: `save-${key}`,
                encodedValue: this.#_encodeData(ROLL_TYPE.save, key),
                info1: this.#modToInfo(this.actorData.actor.system.attributes.savingThrows[key].total),
                name: pf1.config.savingThrows[key],
            }));
            this.addActions(actions, GROUP_MAP.saves.groups.saves);
        }

        #_buildUtils() {
            const { groups } = GROUP_MAP.utility;

            const rest = {
                id: 'util-rest',
                name: Utils.localize('PF1.Rest'),
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

        #_buildCombat() {
            const { groups } = GROUP_MAP.combat;

            let meleeMod, rangedMod;

            if (this.actorData.isSingle) {
                const { system } = this.actorData.actor;
                const attributes = system.attributes;
                const abilities = system.abilities;
                const sizeModifier = pf1.config.sizeMods[system.traits.size];
                const baseBonus = attributes.attack.shared + attributes.attack.general + sizeModifier;
                const meleeAbility = abilities[attributes.attack.meleeAbility]?.mod ?? 0;
                const rangedAbility = abilities[attributes.attack.rangedAbility]?.mod ?? 0;

                meleeMod = baseBonus + attributes.attack.melee + meleeAbility;
                rangedMod = baseBonus + attributes.attack.ranged + rangedAbility;
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
                cssClass: `${this.actorData.inCombat ? 'active' : ''} ${game.user.isGM ? '' : 'flat-disabled'}`,
                info1: this.actorData.combatant.initiative === null
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

            Object.entries(groups)
                .filter(([key, _]) => key !== 'base')
                .map(([_, g]) => g)
                .forEach((group) => this.#_buildFilteredItemActions(group, Settings.showPassiveInventory));
        }

        #_buildBuffs() {
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

            addBuffs('item', groups.item);
            addBuffs('temp', groups.temporary);
            addBuffs('perm', groups.permanent);
            addBuffs('misc', groups.miscellaneous);

            const withActions = this.actorData.buffs
                .filter((buff) => buff.isActive && Utils.getItemActions(buff).length > 0);
            this.#_addItemActions(withActions, groups.actions, { actionLayout: 'onlyActions' });

            // leftovers that could be from other mods or from a change in pf1
            const otherBuffs = this.actorData.buffs
                .filter((item) => !['item', 'temp', 'perm', 'misc'].includes(item.subType))
                .map(mapBuff);
            this.addActions(otherBuffs, groups.other);
        }

        #_buildFeatures() {
            if (this.actorData.isMulti) {
                return;
            }

            Object.values(GROUP_MAP.features.groups)
                .forEach((group) => this.#_buildFilteredItemActions(group, Settings.showPassiveInventory));
        }

        #_buildOtherItems() {
            if (this.actorData.isMulti) {
                return;
            }

            this.#_buildFilteredItemActions(GROUP_MAP.other.groups.other, Settings.showPassiveFeatures);
        }

        #_buildInventory() {
            if (this.actorData.isMulti) {
                return;
            }

            Object.values(GROUP_MAP.inventory.groups)
                .forEach((group) => this.#_buildFilteredItemActions(group, Settings.showPassiveInventory));
        }

        #toSignedString = (mod) => !mod ? '±0' : mod > 0 ? `+${mod}` : `${mod}`;
        #modToInfo = (mod) => Settings.showModifiers && this.actorData.isSingle ? { class: 'roll-modifier', text: this.#toSignedString(mod) } : undefined;

        #knowledgeSkillIds = ['kar', 'kdu', 'ken', 'kge', 'khi', 'klo', 'kna', 'kno', 'kpl', 'kre'];
        #_buildSkills() {
            const skillGroup = GROUP_MAP.skills.groups.skills;

            const actorSkills = this.actorData.isMulti
                ? pf1.config.skills
                : this.actorData.actor.system.skills;

            const excludedSkills = game.settings.get('pf1', 'allowBackgroundSkills')
                ? []
                : CONFIG.PF1.backgroundOnlySkills;

            const skillIds = Object.keys(actorSkills).filter((id) => !excludedSkills.includes(id));

            const getParentheticalName = (original) => /\(([^)]+)\)/g.exec(original)?.[1] || original;

            const nameFilter = (name) => Settings.simplifySkillNames
                ? getParentheticalName(name)
                : name;

            if (Settings.categorizeSkills) {
                const skills = skillIds
                    .filter((id) => this.actorData.isMulti || Utils.isEmptyObject(actorSkills[id].subSkills || {}))
                    .filter((id) => !this.#knowledgeSkillIds.includes(id))
                    .map((id) => ({ id, name: pf1.config.skills[id] || actorSkills[id].name }));
                const actions = skills
                    .filter(({ id }) => !Settings.hideUntrainedSkills || !actorSkills[id]?.rt || !!actorSkills[id].rank)
                    .map(({ id, name }) => ({
                        id: `skill_${id}`,
                        cssClass: this.actorData.isSingle && actorSkills[id].rt && !actorSkills[id].rank ? 'action-nulled-out' : '',
                        encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                        info1: this.#modToInfo(actorSkills[id]?.mod),
                        name: nameFilter(name),
                    }));

                if (this.actorData.isSingle) {
                    const subSkillIds = Object.keys(actorSkills).filter((id) => !Utils.isEmptyObject(actorSkills[id].subSkills || {}));
                    subSkillIds.forEach((id) => {
                        const currentSubskills = actorSkills[id].subSkills;
                        const subskillActions = currentSubskills
                            ? Object.keys(currentSubskills)
                                .filter((sid) => !Settings.hideUntrainedSkills || !currentSubskills[sid].rt || !!currentSubskills[sid].rank)
                                .map((sid) => ({
                                    id: `categorized-${id}.subSkills.${sid}`,
                                    cssClass: currentSubskills[sid].rt && !currentSubskills[sid].rank ? 'action-nulled-out' : '',
                                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, `${id}.subSkills.${sid}`),
                                    info1: this.#modToInfo(currentSubskills[sid].mod),
                                    name: nameFilter(currentSubskills[sid].name),
                                }))
                            : [];

                        if (subskillActions.length) {
                            const groupedActions =
                                !Settings.hideUntrainedSkills || !actorSkills[id].rt || !!actorSkills[id].rank
                                    ? [
                                        {
                                            id: `categorized-${id}`,
                                            cssClass: actorSkills[id].rt && !actorSkills[id].rank ? 'action-nulled-out' : '',
                                            encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                                            info1: this.#modToInfo(actorSkills[id].mod),
                                            name: nameFilter(pf1.config.skills[id] || actorSkills[id].name),
                                        },
                                        ...subskillActions,
                                    ]
                                    : subskillActions;
                            const subSkillGroup = {
                                id: `${skillGroup.id}-${id}`,
                                name: groupedActions[0].name,
                                type: 'system-derived',
                            };
                            this.addGroup(subSkillGroup, skillGroup);
                            this.addActions(groupedActions, subSkillGroup);
                        }
                        else {
                            // if there are no subskills don't categorize it
                            // (e.g. if the actor doesn't have any specific "perform" skills, then just put the single generic "perform" skill alongside the rest of the non-categorized skills)
                            if (!Settings.hideUntrainedSkills || !actorSkills[id].rt || !!actorSkills[id].rank) {
                                actions.push({
                                    id,
                                    cssClass: actorSkills[id].rt && !actorSkills[id].rank ? 'action-nulled-out' : '',
                                    encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                                    info1: this.#modToInfo(actorSkills[id].mod),
                                    name: nameFilter(pf1.config.skills[id] || actorSkills[id].name),
                                });
                            }
                        }
                    });
                }

                const knowledges = this.#knowledgeSkillIds
                    .filter((id) => !Settings.hideUntrainedSkills || !actorSkills[id].rt || !!actorSkills[id].rank)
                    .map((id) => ({
                        id: `categorized-${id}`,
                        cssClass: this.actorData.isSingle && actorSkills[id].rt && !actorSkills[id].rank ? 'action-nulled-out' : '',
                        encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                        info1: this.#modToInfo(actorSkills[id]?.mod),
                        name: nameFilter(getParentheticalName(pf1.config.skills[id])),
                    }));
                const knowledgeGroupData = {
                    id: `${skillGroup.id}-knowledge`,
                    name: Utils.localize('token-action-hud-pf1.knowledge-skills'),
                    type: 'system-derived',
                };
                this.addGroup(knowledgeGroupData, skillGroup);
                this.addActions(knowledges, knowledgeGroupData);

                const sorted = [...actions].sort((a, b) => a.name < b.name ? -1 : 1);
                this.addActions(sorted, skillGroup);
            }
            else {
                const getSubskills = (key) => actorSkills[key].subSkills
                    ? Object.keys(actorSkills[key].subSkills).map((s) => ({
                        id: `${key}.subSkills.${s}`,
                        ...actorSkills[key].subSkills[s], // rank, name, rt
                    }))
                    : [];
                const skills = [
                    ...skillIds.map((id) => ({
                        id,
                        name: pf1.config.skills[id],
                        ...actorSkills[id], // rank, name (if it exists overwrite previous), rt
                    })),
                    ...skillIds.flatMap(getSubskills),
                ];
                const actions = skills
                    .filter(({ rank, rt }) => !Settings.hideUntrainedSkills || !rt || !!rank)
                    .map(({ id, name, rt }) => ({
                        id,
                        cssClass: this.actorData.isSingle && rt && !actorSkills[id]?.rank ? 'action-nulled-out' : '',
                        encodedValue: this.#_encodeData(ROLL_TYPE.skill, id),
                        info1: this.#modToInfo(actorSkills[id]?.mod),
                        name: nameFilter(name),
                    }));
                const sorted = [...actions].sort((a, b) => a.name < b.name ? -1 : 1);

                this.addActions(sorted, skillGroup);
            }
        }

        #_buildConditions() {
            const actions = pf1.registry.conditions.contents.map(({ id, name, texture }) => {
                const isEnabled = this.actorData.actors.every((actor) => actor.hasCondition(id));
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

        #_buildSpells() {
            if (this.actorData.isMulti) {
                return;
            }

            const spellGroup = GROUP_MAP.spells.groups.spells;
            const allSpells = this.actorData.items
                .filter((item) => item.type === 'spell');

            const spellbookKeys = Object.keys(this.actorData.actor.system.attributes.spells.spellbooks)
                .map((key) => ({ key, spellbook: this.actorData.actor.system.attributes.spells.spellbooks[key] }))
                .filter(({ _key, spellbook }) => spellbook.inUse)
                .map(({ key, _spellbook }) => key);

            const { spellbooks } = this.actorData.actor.system.attributes.spells;
            const levels = Array.from(Array(10).keys());

            spellbookKeys.forEach((key) => {
                const spellbook = spellbooks[key];
                let spellbookGroup = spellGroup;
                if (spellbookKeys.length > 1) {
                    spellbookGroup = {
                        id: `${spellGroup.id}-${key}`,
                        name: Utils.localize(spellbook.label) || spellbook.name,
                        type: 'system-derived',
                        settings: { style: 'tab' },
                    };
                    this.addGroup(spellbookGroup, spellGroup);
                }

                // todo add roll icons
                const basicActions = [
                    {
                        id: `casterLevel-${key}`,
                        name: Utils.localize('PF1.CasterLevelCheck'),
                        encodedValue: this.#_encodeData(ROLL_TYPE.casterLevel, 'casterLevel', { book: key }),
                    },
                    {
                        id: `concentration-${key}`,
                        name: Utils.localize('PF1.ConcentrationCheck'),
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
                        prepFilter = (spell) => !!spell.maxCharges;
                        break;
                    case 'onlyRemaining':
                    default:
                        prepFilter = (spell) => (spell.charges || 0) - (spell.slotCost || 0) >= 0;
                        // todo v10
                        //prepFilter = (spell) => !!spell.canUse;
                        break;
                }

                const bookSpells = allSpells.filter((spell) => spell.system.spellbook === key && prepFilter(spell));

                levels.forEach((level) => {
                    const levelGroup = {
                        id: `${spellbookGroup.id}-${level}`,
                        name: Utils.localize(`PF1.SpellLevel${level}`),
                        type: 'system-derived',
                    };

                    const spellLevel = spellbook.spells[`spell${level}`];
                    if (level && spellbook.spontaneous && spellLevel.max) {
                        levelGroup.info1 = { text: `${spellLevel.value || 0}/${spellLevel.max}` };
                    }

                    this.addGroup(levelGroup, spellbookGroup);

                    const itemChargeInfo = (spell) => spellbook.spontaneous
                        ? {}
                        : { text: spell.maxCharges === Number.POSITIVE_INFINITY ? '' : `${spell.charges}/${spell.maxCharges}` };

                    const levelSpells = bookSpells.filter((item) => item.system.level === level);
                    this.#_addItemActions(levelSpells, levelGroup, { itemChargeInfo, actionChargeInfo: () => ({}) });
                });
            });
        }

        /**
         * @param {{id: string, name: string, filter: (ItemPF): booelean}} parentGroup
         * @param {boolean} includeUnusable
         */
        #_buildFilteredItemActions(parentGroup, includeUnusable = false) {
            if (this.actorData.isMulti) {
                return;
            }

            const { filter } = parentGroup;

            const filtered = this.actorData.items.filter(filter);
            this.#_addItemActions(filtered, parentGroup);

            if (includeUnusable) {
                const unusable = this.actorData.unusableItems.filter(filter);
                const itemGroup = {
                    id: `${parentGroup.id}-unusable`,
                    name: Utils.localize('PF1.ActivationTypePassive'),
                    type: 'system-derived',
                };
                this.addGroup(itemGroup, parentGroup);
                this.#_addItemActions(unusable, itemGroup);
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

        #_addItemActions(
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

            const mapItemToAction = (item, idType) => ({
                id: `${item.id}-${idType}-${item.id}`,
                img: item.img,
                name: item.name,
                encodedValue: this.#_encodeData(ROLL_TYPE.item, item.id),
                info1: info1(item),
                info2: info2(item),
                info3: itemChargeInfo(item),
            });
            const mapSubActionToAction = (item, action, idType, { name } = { name: action.name }) => ({
                id: `${idType}-${item.id}-${action.id}`,
                img: action.img || item.img,
                name: name,
                encodedValue: this.#_encodeData(ROLL_TYPE.item, item.id, { subActionId: action.id }),
                info1: info1(item),
                info2: info2(item),
                info3: actionChargeInfo(action),
            });

            switch (actionLayout) {
                case 'onlyItems': {
                    const actions = items.map((item) => mapItemToAction(item, 'onlyItems'));
                    this.addActions(actions, parentGroupData);
                } break;
                case 'onlyActions': {
                    const actions = (items.flatMap((item) => Utils.getItemActions(item).length > 1
                        ? Utils.getItemActions(item).map((action) => mapSubActionToAction(item, action, 'onlyActions', { name: `${item.name} - ${action.name}` }))
                        : mapItemToAction(item, 'onlyActions')));
                    this.addActions(actions, parentGroupData);
                } break;
                case 'categorized':
                default: {
                    items.forEach((item) => {
                        if (Utils.getItemActions(item).length > 1) {
                            const subActions = item.actions.map((action) => mapSubActionToAction(item, action, 'categorized'));

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
                    });
                } break;
            }
        }
    }
});
