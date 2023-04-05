import { Utils } from "./utils";

/**
 * Default categories and subcategories
 */
export let CATEGORIES = null;

export const CATEGORY_MAP = {
    combat: {
        id: 'combat',
        name: 'PF1.Combat',
        subcategories: {
            base: { id: 'combat-base', name: 'PF1.Base' },
            attack: { id: 'combat-attack', name: 'PF1.Attacks' },
            weaponAttaack: { id: 'combat-weaponAttack', name: 'PF1.AttackTypeWeaponPlural', hasDerivedSubcategories: true },
            naturalAttack: { id: 'combat-naturalAttack', name: 'PF1.AttackTypeNaturalPlural', hasDerivedSubcategories: true },
            classAbilities: { id: 'combat-classAbilities', name: 'PF1.AttackTypeAbilityPlural', hasDerivedSubcategories: true },
            racialAbilities: { id: 'combat-racialAbilities', name: 'Racial Abilities', hasDerivedSubcategories: true },
            items: { id: 'combat-items', name: 'PF1.Items', hasDerivedSubcategories: true },
            miscellaneous: { id: 'combat-miscellaneous', name: 'PF1.SourceInfoMiscFeatures', hasDerivedSubcategories: true },

            other: { id: 'combat-other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    buffs: {
        id: 'buffs',
        name: 'PF1.Buffs',
        subcategories: {
            temporary: { id: 'buffs-temporary', name: 'PF1.Temporary', hasDerivedSubcategories: true },
            item: { id: 'buffs-item', name: 'PF1.Item', hasDerivedSubcategories: true },
            permanent: { id: 'buffs-permanent', name: 'PF1.Permanent', hasDerivedSubcategories: true },
            miscellaneous: { id: 'buffs-miscellaneous', name: 'PF1.Misc', hasDerivedSubcategories: true },

            other: { id: 'buffs-other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    inventory: {
        id: 'inventory',
        name: 'PF1.Inventory',
        subcategories: {
            weapons: { id: 'inventory-weapons', name: 'PF1.InventoryWeapons', hasDerivedSubcategories: true },
            equipment: { id: 'inventory-equipment', name: 'PF1.InventoryArmorEquipment', hasDerivedSubcategories: true },
            consumables: { id: 'inventory-consumables', name: 'PF1.InventoryConsumables', hasDerivedSubcategories: true },
            gear: { id: 'inventory-gear', name: 'PF1.LootTypeGear', hasDerivedSubcategories: true },
            ammunition: { id: 'inventory-ammunition', name: 'PF1.LootTypeAmmo', hasDerivedSubcategories: true },
            miscellaneous: { id: 'inventory-miscellaneous', name: 'PF1.Misc', hasDerivedSubcategories: true },
            tradeGoods: { id: 'inventory-tradeGoods', name: 'PF1.LootTypeTradeGoods', hasDerivedSubcategories: true },
            containers: { id: 'inventory-containers', name: 'PF1.InventoryContainers', hasDerivedSubcategories: true },

            other: { id: 'inventory-other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    spells: {
        id: 'spells',
        name: 'PF1.Spells',
        subcategories: {
            spells: { id: 'spells-spells', name: 'PF1.Spells', hasDerivedSubcategories: true, },
        },
    },
    features: {
        id: 'features',
        name: 'PF1.Features',
        subcategories: {
            classFeat: { id: 'features-classFeat', name: 'PF1.ClassFeaturePlural', hasDerivedSubcategories: true },
            feat: { id: 'features-feat', name: 'PF1.FeatPlural', hasDerivedSubcategories: true },
            racial: { id: 'features-racial', name: 'PF1.RacialTraitPlural', hasDerivedSubcategories: true },
            template: { id: 'features-template', name: 'PF1.TemplatePlural', hasDerivedSubcategories: true },
            trait: { id: 'features-trait', name: 'PF1.TraitPlural', hasDerivedSubcategories: true },
            misc: { id: 'features-misc', name: 'PF1.Misc', hasDerivedSubcategories: true },

            // spheres of power sections
            combatTalents: { id: 'features-combat-talents', name: 'PF1SPHERES.CombatTalentPlural', hasDerivedSubcategories: true },
            magicTalents: { id: 'features-magic-talents', name: 'PF1SPHERES.MagicTalentPlural', hasDerivedSubcategories: true },

            // other
            other: { id: 'features-other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    other: {
        id: 'other',
        name: 'PF1.Other',
        subcategories: {
            other: { id: 'other-other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    skills: {
        id: 'skills',
        name: 'PF1.Skills',
        subcategories: {
            skills: { id: 'skills-skills', name: 'PF1.Skills', hasDerivedSubcategories: true },
        },
    },
    saves: {
        id: 'saves',
        name: 'PF1.SavingThrowPlural',
        subcategories: {
            saves: { id: 'saves-saves', name: 'PF1.SavingThrowPlural' },
        },
    },
    checks: {
        id: 'checks',
        name: 'PF1.BuffTarAbilityChecks',
        subcategories: {
            checks: { id: 'checks-checks', name: 'PF1.BuffTarAbilityChecks' },
        },
    },
    conditions: {
        id: 'conditions',
        name: 'PF1.ConditionPlural',
        subcategories: {
            conditions: { id: 'conditions-conditions', name: 'PF1.ConditionPlural' },
        },
    },
    utility: {
        id: 'utility',
        name: 'categories.utility',
        subcategories: {
            rest: { id: 'utility-rest', name: 'PF1.Rest' },
            token: { id: 'utility-token', name: 'Token' },
            utility: { id: 'utility-utility', name: 'categories.utility' },
        },
    },
};

Hooks.on('i18nInit', async () => {
    // this will have to be updated if I ever need nested pre-defined subcategories
    const allSubcategories = [];
    const getSubCategories = (catMap) => {
        const subcategories = [];
        if (catMap.subcategories) {
            Object.keys(catMap.subcategories).forEach((subKey) => {
                const subMap = catMap.subcategories[subKey];
                subMap.name = Utils.localize(subMap.name);
                subMap.nestId = `${catMap.nestId || catMap.id}_${subMap.id}`;
                subMap.type = 'system';
                subMap.hasDerivedSubcategories = !!subMap.hasDerivedSubcategories;
                const sub = {
                    ...subMap,
                    type: 'system',
                };
                subcategories.push(sub);
                allSubcategories.push(sub);
            });
        }
        return subcategories;
    };

    const categories = Object.keys(CATEGORY_MAP).map((catKey) => {
        const catMap = CATEGORY_MAP[catKey];
        catMap.nestId = catMap.nestId || catMap.id;
        catMap.name = Utils.localize(catMap.name);
        return {
            ...catMap,
            subcategories: getSubCategories(catMap),
        };
    });

    CATEGORIES = {
        categories,
        subcategories: allSubcategories,
    };
});
