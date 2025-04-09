import { MODULE } from "./constants";
import { Utils } from "./utils";

/**
 * Default categories and groups
 */
export let GROUPS = null;

const gearSubtypes = ['gear', 'adventuring', 'tool', 'reagent', 'remedy', 'herb', 'animal', 'animalGear'];
const miscSubtypes = ['misc', 'food', 'entertainment', 'vehicle'];
const tradeSubtypes = ['tradeGoods', 'treasure'];
const handledItemTypes = [
    'attack',
    'buff',
    'consumable',
    'container',
    'equipment',
    'feat',
    'implant',
    'loot',
    'spell',
    'weapon',
];

export const GROUP_MAP = {
    combat: {
        id: 'combat',
        name: 'PF1.Combat',
        groups: {
            // misc actions not defined by Items (e.g. initiative, cmb, etc)
            base: { id: 'combat-base', name: 'PF1.Base', settings: { showTitle: false } },

            weaponAttaack: { id: 'combat-weaponAttack', name: 'PF1.Subtypes.Item.attack.weapon.Plural', filter: (item) => item.type === 'attack' && item.subType === 'weapon' },
            naturalAttack: { id: 'combat-naturalAttack', name: 'PF1.Subtypes.Item.attack.natural.Plural', filter: (item) => item.type === 'attack' && item.subType === 'natural' },
            classAbilities: { id: 'combat-classAbilities', name: 'PF1.Subtypes.Item.attack.ability.Plural', filter: (item) => item.type === 'attack' && item.subType === 'ability' },
            racialAbilities: { id: 'combat-racialAbilities', name: 'PF1.Subtypes.Item.attack.racial.Plural', filter: (item) => item.type === 'attack' && item.subType === 'racialAbility' },
            items: { id: 'combat-items', name: 'PF1.Subtypes.Item.attack.item.Plural', filter: (item) => item.type === 'attack' && item.subType === 'item' },
            miscellaneous: { id: 'combat-miscellaneous', name: 'PF1.Subtypes.Item.attack.misc.Plural', filter: (item) => item.type === 'attack' && item.subType === 'misc' },

            other: {
                id: 'combat-other',
                name: 'PF1.Other',
                filter: (item) => {
                    Object.entries(GROUP_MAP.combat.groups)
                        .filter(([key, _]) => key !== 'other' && key !== 'base')
                        .map(([_, value]) => value.filter)
                        .every((filter) => !filter(item));
                },
            },
        },
    },
    saves: {
        id: 'saves',
        name: 'PF1.SavingThrowPlural',
        groups: {
            saves: { id: 'saves-saves', name: 'PF1.SavingThrowPlural', settings: { showTitle: false } },
        },
    },
    checks: {
        id: 'checks',
        name: 'PF1.BuffTarAbilityChecks',
        groups: {
            checks: { id: 'checks-checks', name: 'PF1.BuffTarAbilityChecks', settings: { showTitle: false } },
        },
    },
    inventory: {
        id: 'inventory',
        name: 'PF1.Inventory',
        groups: {
            weapons: { id: 'inventory-weapons', name: 'PF1.InventoryWeapons', filter: (item) => item.type === 'weapon' },
            armor: { id: 'inventory-armor', name: 'PF1.ArmorOrShield', filter: (item) => item.type === 'equipment' && ['armor', 'shield'].includes(item.subType) },
            equipment: { id: 'inventory-equipment', name: 'PF1.InventoryEquipment', filter: (item) => item.type === 'equipment' && ['wondrous', 'other', 'clothing'].includes(item.subType) },
            implant: { id: 'inventory-implant', name: 'PF1.InventoryImplants', filter: (item) => item.type === 'implant' },
            consumables: { id: 'inventory-consumables', name: 'PF1.InventoryConsumables', filter: (item) => item.type === 'consumable' },
            gear: { id: 'inventory-gear', name: 'PF1.Subtypes.Item.loot.gear.Plural', filter: (item) => item.type === 'loot' && gearSubtypes.includes(item.subType) },
            ammunition: { id: 'inventory-ammunition', name: 'PF1.Subtypes.Item.loot.ammo.Plural', filter: (item) => item.type === 'loot' && item.subType === 'ammo' },
            miscellaneous: { id: 'inventory-miscellaneous', name: 'PF1.Subtypes.Item.loot.misc.Plural', filter: (item) => item.type === 'loot' && miscSubtypes.includes(item.subType) },
            tradeGoods: { id: 'inventory-tradeGoods', name: 'PF1.Subtypes.Item.loot.tradeGoods.Plural', filter: (item) => item.type === 'loot' && tradeSubtypes.includes(item.subType) },
            containers: { id: 'inventory-containers', name: 'PF1.InventoryContainers', filter: (item) => item.type === 'container' },

            // leftovers that could be from other mods or from a change in pf1
            other: {
                id: 'inventory-other',
                name: 'PF1.Other',
                filter: (item) => {
                    Object.entries(GROUP_MAP.inventory.groups)
                        .filter(([key, _]) => key !== 'other')
                        .map(([_, value]) => value.filter)
                        .every((filter) => !filter(item));
                },
            },
        },
    },
    features: {
        id: 'features',
        name: 'PF1.Features',
        groups: {
            classFeat: { id: 'features-classFeat', name: 'PF1.Subtypes.Item.feat.classFeat.Plural', filter: (item) => item.type === 'feat' && item.subType === 'classFeat' },
            feat: { id: 'features-feat', name: 'PF1.Subtypes.Item.feat.feat.Plural', filter: (item) => item.type === 'feat' && item.subType === 'feat' },
            racial: { id: 'features-racial', name: 'PF1.Subtypes.Item.feat.racial.Plural', filter: (item) => item.type === 'feat' && item.subType === 'racial' },
            template: { id: 'features-template', name: 'PF1.Subtypes.Item.feat.template.Plural', filter: (item) => item.type === 'feat' && item.subType === 'template' },
            trait: { id: 'features-trait', name: 'PF1.Subtypes.Item.feat.trait.Plural', filter: (item) => item.type === 'feat' && item.subType === 'trait' },
            misc: { id: 'features-misc', name: 'PF1.Subtypes.Item.feat.misc.Plural', filter: (item) => item.type === 'feat' && item.subType === 'misc' },

            // spheres of power sections
            combatTalents: { id: 'features-combat-talents', name: 'PF1SPHERES.CombatTalentPlural', filter: (item) => item.type === 'feat' && item.subType === 'combatTalent' },
            magicTalents: { id: 'features-magic-talents', name: 'PF1SPHERES.MagicTalentPlural', filter: (item) => item.type === 'feat' && item.subType === 'magicTalent' },

            // leftovers that could be from other mods or from a change in pf1
            other: {
                id: 'features-other',
                name: 'PF1.Other',
                filter: (item) => {
                    Object.entries(GROUP_MAP.features.groups)
                        .filter(([key, _]) => key !== 'other')
                        .map(([_, value]) => value.filter)
                        .every((filter) => !filter(item));
                },
            },
        },
    },
    skills: {
        id: 'skills',
        name: 'PF1.Skills',
        groups: {
            skills: { id: 'skills-skills', name: 'PF1.Skills', settings: { showTitle: false } },
            utils: { id: 'skills-utils', name: 'categories.utility' }
        },
    },
    spells: {
        id: 'spells',
        name: 'PF1.Spells',
        groups: {
            spells: { id: 'spells-spells', name: 'PF1.Spells', settings: { showTitle: false } },
        },
    },
    buffs: {
        id: 'buffs',
        name: 'PF1.Buffs',
        groups: {
            actions: { id: 'buffs-actions', name: `${MODULE.ID}.categories.activeBuffActions` },

            temporary: { id: 'buffs-temporary', name: 'PF1.Temporary', filter: (item) => item.type === 'buff' && item.subType === 'temp' },
            spell: { id: 'buffs-spell', name: 'PF1.Spells', filter: (item) => item.type === 'buff' && item.subType === 'spell' },
            item: { id: 'buffs-item', name: 'PF1.Items', filter: (item) => item.type === 'buff' && item.subType === 'item' },
            feat: { id: 'buffs-feat', name: 'PF1.Features', filter: (item) => item.type === 'buff' && item.subType === 'feat' },
            permanent: { id: 'buffs-permanent', name: 'PF1.Permanent', filter: (item) => item.type === 'buff' && item.subType === 'perm' },
            miscellaneous: { id: 'buffs-miscellaneous', name: 'PF1.Misc', filter: (item) => item.type === 'buff' && item.subType === 'misc' },

            other: {
                id: 'buffs-other',
                name: 'PF1.Other',
                filter: (item) => {
                    Object.entries(GROUP_MAP.buffs.groups)
                        .filter(([key, _]) => key !== 'other')
                        .map(([_, value]) => value.filter)
                        .every((filter) => !filter(item));
                },
            },
        },
    },
    conditions: {
        id: 'conditions',
        name: 'PF1.ConditionPlural',
        groups: {
            conditions: { id: 'conditions-conditions', name: 'PF1.ConditionPlural', settings: { showTitle: false } },
        },
    },
    other: {
        id: 'other',
        name: 'PF1.Other',
        groups: {
            other: { id: 'other-other', name: 'PF1.Other', filter: (item) => !handledItemTypes.includes(item.type) },
        },
    },
    utility: {
        id: 'utility',
        name: 'categories.utility',
        groups: {
            rest: { id: 'utility-rest', name: 'PF1.Rest' },
            token: { id: 'utility-token', name: 'Token' },
            utility: { id: 'utility-utility', name: 'categories.utility' },
        },
    },
};

Hooks.on('i18nInit', async () => {
    // this will have to be updated if I ever need nested pre-defined groups
    const allGroups = [];
    const getGroups = (catMap) => {
        const groups = [];
        if (catMap.groups) {
            Object.keys(catMap.groups).forEach((subKey) => {
                const subMap = catMap.groups[subKey];
                subMap.name = Utils.localize(subMap.name);
                subMap.nestId = `${catMap.nestId || catMap.id}_${subMap.id}`;
                subMap.type = 'system';
                subMap.listName = `${catMap.name} - ${subMap.name}`;
                const sub = {
                    ...subMap,
                    type: 'system',
                };
                groups.push(sub);
                allGroups.push(sub);
            });
        }
        return groups;
    };

    const layout = Object.keys(GROUP_MAP).map((catKey) => {
        const catMap = GROUP_MAP[catKey];
        catMap.nestId = catMap.nestId || catMap.id;
        catMap.name = Utils.localize(catMap.name);
        return {
            ...catMap,
            groups: getGroups(catMap),
        };
    });

    GROUPS = {
        layout,
        groups: allGroups,
    };
});
