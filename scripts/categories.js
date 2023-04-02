import { Utils } from "./utils";

/**
 * Default categories and subcategories
 */
export let CATEGORIES = null

export const CATEGORY_MAP = {
    combat: {
        id: '__combat',
        name: 'PF1.Combat',
        subcategories: {
            base: { id: 'combat_base', name: 'PF1.Base', /*BAB, CMB, Init*/ },
            attack: { id: 'combat_attack', name: 'PF1.Attacks' },
            weaponAttaack: { id: 'combat_weaponAttack', name: 'PF1.AttackTypeWeaponPlural', hasDerivedSubcategories: true },
            naturalAttack: { id: 'combat_naturalAttack', name: 'PF1.AttackTypeNaturalPlural', hasDerivedSubcategories: true },
            classAbilities: { id: 'combat_classAbilities', name: 'PF1.AttackTypeAbilityPlural', hasDerivedSubcategories: true },
            racialAbilities: { id: 'combat_racialAbilities', name: 'Racial Abilities', hasDerivedSubcategories: true },
            items: { id: 'combat_items', name: 'PF1.Items', hasDerivedSubcategories: true },
            miscellaneous: { id: 'combat_miscellaneous', name: 'PF1.SourceInfoMiscFeatures', hasDerivedSubcategories: true },

            other: { id: 'combat_other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    buffs: {
        id: '__buffs',
        name: 'PF1.Buffs',
        subcategories: {
            temporary: { id: 'buffs_temporary', name: 'PF1.Temporary', hasDerivedSubcategories: true },
            item: { id: 'buffs_item', name: 'PF1.Item', hasDerivedSubcategories: true },
            permanent: { id: 'buffs_permanent', name: 'PF1.Permanent', hasDerivedSubcategories: true },
            miscellaneous: { id: 'buffs_miscellaneous', name: 'PF1.Misc', hasDerivedSubcategories: true },

            other: { id: 'buffs_other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    inventory: {
        id: '__inventory',
        name: 'PF1.Inventory',
        subcategories: {
            weapons: { id: 'inventory_weapons', unequipped: { id: 'unequipped' }, name: 'PF1.InventoryWeapons', hasDerivedSubcategories: true },
            equipment: { id: 'inventory_equipment', unequipped: { id: 'unequipped' }, name: 'PF1.InventoryArmorEquipment', hasDerivedSubcategories: true },
            consumables: { id: 'inventory_consumables', name: 'PF1.InventoryConsumables', hasDerivedSubcategories: true },
            gear: { id: 'inventory_gear', unequipped: { id: 'unequipped' }, name: 'PF1.LootTypeGear', hasDerivedSubcategories: true },
            ammunition: { id: 'inventory_ammunition', name: 'PF1.LootTypeAmmo', hasDerivedSubcategories: true },
            miscellaneous: { id: 'inventory_miscellaneous', name: 'PF1.Misc', hasDerivedSubcategories: true },
            tradeGoods: { id: 'inventory_tradeGoods', name: 'PF1.LootTypeTradeGoods', hasDerivedSubcategories: true },
            containers: { id: 'inventory_containers', name: 'PF1.InventoryContainers', hasDerivedSubcategories: true },

            other: { id: 'inventory_other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    spells: {
        id: '__spells',
        name: 'PF1.Spells',
        subcategories: {
            spells: { id: 'spells_spells', name: 'PF1.Spells', hasDerivedSubcategories: true, },
        },
    },
    features: {
        id: '__features',
        name: 'PF1.Features',
        subcategories: {
            classFeat: { id: 'features_classFeat', name: 'PF1.ClassFeaturePlural', hasDerivedSubcategories: true },
            feat: { id: 'features_feat', name: 'PF1.FeatPlural', hasDerivedSubcategories: true },
            racial: { id: 'features_racial', name: 'PF1.RacialTraitPlural', hasDerivedSubcategories: true },
            template: { id: 'features_template', name: 'PF1.TemplatePlural', hasDerivedSubcategories: true },
            trait: { id: 'features_trait', name: 'PF1.TraitPlural', hasDerivedSubcategories: true },
            misc: { id: 'features_misc', name: 'PF1.Misc', hasDerivedSubcategories: true },

            // spheres of power sections
            combatTalents: { id: 'features_combat_talents', name: 'PF1SPHERES.CombatTalentPlural', hasDerivedSubcategories: true },
            magicTalents: { id: 'features_magic_talents', name: 'PF1SPHERES.MagicTalentPlural', hasDerivedSubcategories: true },

            // other
            other: { id: 'features_other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    other: {
        id: '__other',
        name: 'PF1.Other',
        subcategories: {
            other: { id: 'other_other', name: 'PF1.Other', hasDerivedSubcategories: true },
        },
    },
    skills: {
        id: '__skills',
        name: 'PF1.Skills',
        subcategories: {
            skills: { id: 'skills_skills', name: 'PF1.Skills', hasDerivedSubcategories: true },
        },
    },
    saves: {
        id: '__saves',
        name: 'PF1.SavingThrowPlural',
        subcategories: {
            saves: { id: 'saves_saves', name: 'PF1.SavingThrowPlural' },
            defenses: { id: 'saves_defenses', name: 'PF1.Defenses' },
        },
    },
    checks: {
        id: '__checks',
        name: 'PF1.BuffTarAbilityChecks',
        subcategories: {
            checks: { id: 'checks_checks', name: 'PF1.BuffTarAbilityChecks' },
        },
    },
    conditions: {
        id: '__conditions',
        name: 'PF1.ConditionPlural',
        subcategories: {
            conditions: { id: 'conditions_conditions', name: 'PF1.ConditionPlural' },
        },
    },
    utility: {
        id: '__utility',
        name: 'categories.utility',
        subcategories: {
            rest: { id: 'utility_rest', name: 'PF1.Rest' },
            token: { id: 'utility_token', name: 'Token' }, // gm-only: make (in)visible
            utility: { id: 'utility_utility', name: 'categories.utility' },
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
                const sub = {
                    id: subMap.id,
                    name: Utils.localize(subMap.name),
                    nestId: `${catMap.nestId || catMap.id}_${subMap.id}`,
                    type: 'system',
                    hasDerivedSubcategories: !!subMap.hasDerivedSubcategories,
                };
                subcategories.push(sub);
                allSubcategories.push(sub);
            });
        }
        return subcategories;
    };

    const categories = Object.keys(CATEGORY_MAP).map((catKey) => {
        const catMap = CATEGORY_MAP[catKey];
        return {
            id: catMap.id,
            nestId: catMap.id,
            name: Utils.localize(catMap.name),
            subcategories: getSubCategories(catMap),
        };
    });

    CATEGORIES = {
        categories,
        subcategories: allSubcategories,
    };
});
