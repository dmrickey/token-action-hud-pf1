import { Utils } from './utils.js'

// Core Module Imports
import { MODULE, ROLL_TYPE } from './constants.js';
import { RollHandlerActorData } from './models/actor-data.js';
import { Settings } from './settings.js';

export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    RollHandler = class RollHandler extends coreModule.api.RollHandler {

        actorData = new RollHandlerActorData();

        get skipActionDialog() {
            const skip = Settings.pf1SkipActionDialogs;
            return skip !== this.isShift;
        }

        #logInvalidMulti = () => {
            console.error(`TAH - this shouldn't happen`, action);
            ui.notifications.warn(`TAH tried to perform an action that wasn't intended for multiple tokens`);
        };

        #logInvalidAction = () => {
            console.error(`TAH - this shouldn't happen`, action);
            ui.notifications.warn(`TAH tried to perform an action that doesn't exist`);
        }

        /**
         * Handle Action Event
         * @override
         * @param {object} event
         * @param {string} encodedValue
         */
        async handleActionClick(event, encodedValue) {
            const action = JSON.parse(encodedValue);
            this.actorData = new RollHandlerActorData(action);

            const { actionId, actor, actors, book, enable, rollType, tokens } = this.actorData;

            switch (rollType) {
                case ROLL_TYPE.abilityCheck: await Promise.all(actors.map((actor) => actor.rollAbilityTest(actionId, { skipDialog: this.skipActionDialog }))); break;
                case ROLL_TYPE.addToCombat: await this.#_addToCombat(); break;
                case ROLL_TYPE.bab: await Promise.all(actors.map((actor) => actor.rollBAB({ skipDialog: this.skipActionDialog }))); break;
                case ROLL_TYPE.buff: await this.#_rollBuff(); break;
                case ROLL_TYPE.casterLevel: this.actorData.isMulti ? this.#logInvalidMulti() : await actor.rollCL(book, { skipDialog: this.skipActionDialog }); break;
                case ROLL_TYPE.cmb: await Promise.all(actors.map((actor) => actor.rollAttack({ maneuver: true, skipDialog: this.skipActionDialog }))); break;
                case ROLL_TYPE.concentration: this.actorData.isMulti ? this.#logInvalidMulti() : await actor.rollConcentration(book, { skipDialog: this.skipActionDialog }); break;
                case ROLL_TYPE.condition: await Promise.all(actors.map((actor) => actor.setCondition(actionId, enable))); break;
                case ROLL_TYPE.defenses: await Promise.all(tokens.map((token) => token.actor.displayDefenseCard({ token }))); break;
                case ROLL_TYPE.endTurn: this.#_endTurn(); break;
                case ROLL_TYPE.initiative: await Promise.all(actors.map((actor) => actor.rollInitiative({ createCombatants: true, skipDialog: this.skipActionDialog, rerollInitiative: game.user.isGM }))); break;
                case ROLL_TYPE.item: await this.#_rollItem(); break;
                case ROLL_TYPE.makeInvisible: await this.#_makeInvisible(); break;
                case ROLL_TYPE.makeVisible: await this.#_makeVisible(); break;
                case ROLL_TYPE.melee: await Promise.all(actors.map((actor) => actor.rollAttack({ skipDialog: this.skipActionDialog, ranged: false }))); break;
                case ROLL_TYPE.openSettings: await this.#_openSettings(); break;
                case ROLL_TYPE.openTokenConfig: tokens.map((token) => new TokenConfig(token.document).render(true)); break;
                case ROLL_TYPE.ranged: await Promise.all(actors.map((actor) => actor.rollAttack({ skipDialog: this.skipActionDialog, ranged: true }))); break;
                case ROLL_TYPE.removeFromCombat: await this.#_removeFromCombat(); break;
                case ROLL_TYPE.rest: await this.#_rest(); break;
                case ROLL_TYPE.save: await Promise.all(actors.map((actor) => actor.rollSavingThrow(actionId, { skipDialog: this.skipActionDialog }))); break;
                case ROLL_TYPE.skill: await Promise.all(actors.map((actor) => actor.rollSkill(actionId, { skipDialog: this.skipActionDialog }))); break;
                case ROLL_TYPE.toggleSkip: await this.#_toggleSkipDialog(); break;
                case ROLL_TYPE.toggleTahGrid: await this.#_toggleTahGrid(); break;
                case ROLL_TYPE.toggleUntrainedSkills: await this.#_toggleUntrainedSkills(); break;
                default: this.#logInvalidAction(); break;
            }
        }

        async #_addToCombat() {
            if (canvas.tokens.controlled.length) {
                await canvas.tokens.toggleCombat(true, game.combat);
            }
            else {
                const { actorId, tokenId } = this.actorData;
                if (!(game.combat?.combatants || []).find((combatant) => combatant.actorId === actorId)) {
                    await Combatant.create({ actorId, tokenId }, { parent: game.combat });
                }
            }
            Hooks.callAll('forceUpdateTokenActionHud');
        }

        async #_endTurn() {
            if (this.actorData.isMulti) {
                this.#logInvalidMulti();
                return;
            }

            const combat = game.combat;
            if (combat && this.actorData.isCurrentCombatant) {
                await combat.nextTurn();
            }
        }

        async #_makeVisible() {
            const updates = this.actorData.tokens
                .filter((token) => token.document.hidden)
                .map(t => ({ _id: t.id, hidden: false }));
            await canvas.scene.updateEmbeddedDocuments("Token", updates);
        }

        async #_makeInvisible() {
            const updates = this.actorData.tokens
                .filter((token) => !token.document.hidden)
                .map(t => ({ _id: t.id, hidden: true }));
            await canvas.scene.updateEmbeddedDocuments("Token", updates);
        }

        async #_openSettings() {
            new SettingsConfig().render(true);
            await new Promise(r => setTimeout(r, 100)).then(() => ui.activeWindow.activateTab(MODULE.ID));
        }

        async #_removeFromCombat() {
            const combat = game.combat;
            if (!combat) {
                return;
            }

            if (canvas.tokens.controlled.length) {
                await canvas.tokens.toggleCombat(false, combat);
            }
            else {
                const { actorId, tokenId } = this.actorData;
                const combatant = combat.combatants.find((combatant) => combatant.actorId === actorId && combatant.tokenId === tokenId);
                if (combatant) {
                    await combat.deleteEmbeddedDocuments('Combatant', [combatant.id]);
                }
            }

            Hooks.callAll('forceUpdateTokenActionHud');
        }

        async #_rest() {
            pf1.utils.party.rest({ actors: this.actorData.actors });
        }

        async #_rollBuff() {
            const { enable, isMulti, item: buff } = this.actorData;
            if (isMulti) {
                this.#logInvalidMulti();
                return;
            }

            if (this.isRightClick) {
                buff.sheet.render(true, { focus: true });
                return;
            }

            await buff.setActive(enable);
        }

        async #_rollItem() {
            if (this.actorData.isMulti) {
                this.#logInvalidMulti();
                return;
            }

            const { item, subAction } = this.actorData;

            if (this.isRightClick) {
                if (subAction) {
                    const app = new pf1.applications.component.ItemActionSheet(subAction);
                    app.render(true);
                    return;
                }
                item.sheet.render(true, { focus: true });
                return;
            }

            if (subAction) {
                item.use({ actionID: subAction.id, skipDialog: this.skipActionDialog });
            }
            else if (Utils.getItemActions(item).size === 1) {
                const actionId = Utils.getItemActions(item)[0].id;
                item.use({ actionID: actionId, skipDialog: this.skipActionDialog });
            }
            else {
                if (item.hasAction || item.getScriptCalls("use").length) {
                    item.use({ skipDialog: this.skipActionDialog });
                }
                else {
                    item.displayCard();
                }
            }
        }

        async #_toggleSkipDialog() {
            await Settings.toggleSkipDialog();
            Hooks.callAll('forceUpdateTokenActionHud');
        }

        async #_toggleTahGrid() {
            await Settings.toggleTahGrid();
            Hooks.callAll('forceUpdateTokenActionHud');
        }

        async #_toggleUntrainedSkills() {
            await Settings.toggleUntrainedSkills();
            Hooks.callAll('forceUpdateTokenActionHud');
        }
    }
});
