import { Utils } from "./utils";

/**
 * Default categories and groups
 */
export let GROUPS = null;

export const GROUP_MAP = {
    combat: {
        id: 'combat',
        name: 'PF1.Combat',
        groups: {
            base: { id: 'combat-base', name: 'PF1.Base', settings: { showTitle: false } },
            attack: { id: 'combat-attack', name: 'PF1.Attacks' },
            weaponAttaack: { id: 'combat-weaponAttack', name: 'PF1.AttackTypeWeaponPlural' },
            naturalAttack: { id: 'combat-naturalAttack', name: 'PF1.AttackTypeNaturalPlural' },
            classAbilities: { id: 'combat-classAbilities', name: 'PF1.AttackTypeAbilityPlural' },
            racialAbilities: { id: 'combat-racialAbilities', name: 'Racial Abilities' },
            items: { id: 'combat-items', name: 'PF1.Items' },
            miscellaneous: { id: 'combat-miscellaneous', name: 'PF1.SourceInfoMiscFeatures' },

            other: { id: 'combat-other', name: 'PF1.Other' },
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
            weapons: { id: 'inventory-weapons', name: 'PF1.InventoryWeapons' },
            equipment: { id: 'inventory-equipment', name: 'PF1.InventoryArmorEquipment' },
            consumables: { id: 'inventory-consumables', name: 'PF1.InventoryConsumables' },
            gear: { id: 'inventory-gear', name: 'PF1.LootTypeGear' },
            ammunition: { id: 'inventory-ammunition', name: 'PF1.LootTypeAmmo' },
            miscellaneous: { id: 'inventory-miscellaneous', name: 'PF1.Misc' },
            tradeGoods: { id: 'inventory-tradeGoods', name: 'PF1.LootTypeTradeGoods' },
            containers: { id: 'inventory-containers', name: 'PF1.InventoryContainers' },

            other: { id: 'inventory-other', name: 'PF1.Other' },
        },
    },
    features: {
        id: 'features',
        name: 'PF1.Features',
        groups: {
            classFeat: { id: 'features-classFeat', name: 'PF1.ClassFeaturePlural' },
            feat: { id: 'features-feat', name: 'PF1.FeatPlural' },
            racial: { id: 'features-racial', name: 'PF1.RacialTraitPlural' },
            template: { id: 'features-template', name: 'PF1.TemplatePlural' },
            trait: { id: 'features-trait', name: 'PF1.TraitPlural' },
            misc: { id: 'features-misc', name: 'PF1.Misc' },

            // spheres of power sections
            combatTalents: { id: 'features-combat-talents', name: 'PF1SPHERES.CombatTalentPlural' },
            magicTalents: { id: 'features-magic-talents', name: 'PF1SPHERES.MagicTalentPlural' },

            // other
            other: { id: 'features-other', name: 'PF1.Other' },
        },
    },
    skills: {
        id: 'skills',
        name: 'PF1.Skills',
        groups: {
            skills: { id: 'skills-skills', name: 'PF1.Skills', settings: { showTitle: false } },
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
            temporary: { id: 'buffs-temporary', name: 'PF1.Temporary' },
            item: { id: 'buffs-item', name: 'PF1.Item' },
            permanent: { id: 'buffs-permanent', name: 'PF1.Permanent' },
            miscellaneous: { id: 'buffs-miscellaneous', name: 'PF1.Misc' },

            other: { id: 'buffs-other', name: 'PF1.Other' },
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
            other: { id: 'other-other', name: 'PF1.Other' },
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
