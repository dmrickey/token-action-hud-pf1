import { Utils } from './utils.js'

// Core Module Imports
import { CoreRollHandler } from './config.js'
import { MODULE, ROLL_TYPE } from './constants.js';
import { RollHandlerActorData } from '../models/actor-data.js';
import { Settings } from './settings.js';

export class RollHandler extends CoreRollHandler {

    actorData = new RollHandlerActorData();

    get skipActionDialog() {
        const skip = Settings.pf1SkipActionDialogs;
        return skip !== this.shift;
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
    async doHandleActionEvent(event, encodedValue) {
        const action = JSON.parse(encodedValue);
        this.actorData = new RollHandlerActorData(action);

        const { actionId, actor, actors, enable, rollType, tokens } = this.actorData;

        switch (rollType) {
            case ROLL_TYPE.abilityCheck: await Promise.all(actors.map((actor) => actor.rollAbilityTest(actionId, { skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.addToCombat: await this.#_addToCombat(); break;
            case ROLL_TYPE.bab: await Promise.all(actors.map((actor) => actor.rollBAB({ skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.buff: await this.#_rollBuff(); break;
            case ROLL_TYPE.casterLevel: this.actorData.isMulti ? this.#logInvalidMulti() : await actor.rollCL(book, { skipDialog: this.skipActionDialog }); break;
            case ROLL_TYPE.cmb: await Promise.all(actors.map((actor) => actor.rollCMB({ skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.concentration: this.actorData.isMulti ? this.#logInvalidMulti() : await actor.rollConcentration(book, { skipDialog: this.skipActionDialog }); break;
            case ROLL_TYPE.condition: await Promise.all(actors.map((actor) => actor.setCondition(actionId, enable))); break;
            case ROLL_TYPE.defenses: await Promise.all(actors.map((actor) => actor.rollDefenses({ skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.endTurn: this.#_endTurn(); break;
            case ROLL_TYPE.initiative: await Promise.all(actors.map((actor) => actor.rollInitiative({ createCombatants: true, skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.item: await this.#_rollItem(); break;
            case ROLL_TYPE.makeInvisible: await this.#_makeInvisible(); break;
            case ROLL_TYPE.makeVisible: await this.#_makeVisible(); break;
            case ROLL_TYPE.melee: await Promise.all(actors.map((actor) => actor.rollAttack({ skipDialog: this.skipActionDialog, melee: true }))); break;
            case ROLL_TYPE.openSettings: await this.#_openSettings(); break;
            case ROLL_TYPE.openTokenConfig: tokens.map((token) => new TokenConfig(token.document).render(true)); break;
            case ROLL_TYPE.ranged: await Promise.all(actors.map((actor) => actor.rollAttack({ skipDialog: this.skipActionDialog, melee: false }))); break;
            case ROLL_TYPE.removeFromCombat: await this.#_removeFromCombat(); break;
            case ROLL_TYPE.rest: await this.#_rest(); break;
            case ROLL_TYPE.save: await Promise.all(actors.map((actor) => actor.rollSavingThrow(actionId, { skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.skill: await Promise.all(actors.map((actor) => actor.rollSkill(actionId, { skipDialog: this.skipActionDialog }))); break;
            case ROLL_TYPE.toggleSkip: await this.#_toggleSkipDialog(); break;
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
        if (!combat) {
            return;
        }

        const { actorId, tokenId } = this.actorData;
        const combatant = combat.combatants.find((combatant) => combatant.actorId === actorId && combatant.tokenId === tokenId);
        if (combat.current.combatantId === combatant.id) {
            await combat.nextTurn();
        }
    }

    async #_makeVisible() {
        await Promise.all(this.actorData.tokens
            .filter((token) => token.document.hidden)
            .map((token) => token.toggleVisibility())
        );
    }

    async #_makeInvisible() {
        await Promise.all(this.actorData.tokens
            .filter((token) => !token.document.hidden)
            .map((token) => token.toggleVisibility())
        );
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
        this.actorData.actors.forEach((actor) => new pf1.applications.actor.ActorRestDialog(actor).render(true));
    }

    async #_rollBuff() {
        const { enable, isMulti, item: buff } = this.actorData;
        if (isMulti) {
            this.#logInvalidMulti();
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

        if (this.rightClick) {
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
        await game.settings.set("pf1", "skipActionDialogs", !Settings.pf1SkipActionDialogs);
        Hooks.callAll('forceUpdateTokenActionHud');
    }
}
