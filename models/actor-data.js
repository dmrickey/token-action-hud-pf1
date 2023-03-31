import { CoreUtils } from "../scripts/config";
import { ROLL_TYPE } from "../scripts/constants";

export class ActionBuilderActorData {
    #_knownActorTypes = ['character', 'npc'];

    #_fallbackActor = null;
    get actor() { return this.#_fallbackActor || this.actors[0] || {}; }

    #_fallbackToken = null;
    get token() { return this.#_fallbackToken || this.tokens[0] || {}; }

    get actors() { return this.#_fallbackActor ? [this.#_fallbackActor] : this.tokens.map(token => token.actor); }
    get tokens() { return this.#_fallbackToken ? [this.#_fallbackToken] : canvas.tokens.controlled; }

    get actorId() { return this.actor?.id; }
    get actorIds() { return this.actors?.map(x => x.id) ?? []; }
    get isMulti() { return (this.actors?.length ?? 0) > 1; }
    get tokenId() { return this.token?.id; }
    get tokenIds() { return this.tokens?.map(x => x.id) ?? []; }

    get isValid() {
        const filter = (actor) => this.#_knownActorTypes.includes(actor.type);
        const isValid = this.actors?.some(filter) ?? false;
        if (!this.actors.every(filter)) {
            console.warn('TAH detected invalid selected actor');
        }
        return isValid;
    }

    get inCombat() {
        return this.combatants.length === this.actors.length;
    }

    get combatant() { return this.combatants[0] || {}; }
    get combatants() {
        if (this.#_fallbackActor) {
            return game.combat?.combatants.filter((combatant) => combatant.actorId === this.#_fallbackActor.id) ?? [];
        }

        const combatantants = game.combat?.combatants ?? [];
        return combatantants.filter((combatant) => this.tokenIds.find((id) => combatant.tokenId === id));
    }

    #_items = null;
    get items() {
        return this.#_items ??=
            this.actor.items
                ? [...this.actor.items.entries()]
                    .sort((a, b) => a[1].name < b[1].name ? -1 : 1)
                : [];
    }

    constructor(character) {
        character ||= {};
        if (!canvas.tokens.controlled.length) {
            // covers the case for "always show my actor bar" when this is called without a selection
            const { actor, token } = character;
            this.#_fallbackActor = actor;
            this.#_fallbackToken = token;
        }
    }
}

export class RollHandlerActorData extends ActionBuilderActorData {
    actionId = null;
    book = null;
    enable = null;
    item = null;
    rollType = null;
    subAction = null;

    constructor(action = {}) {
        const { actorId, book, enable, tokenId, actionId, rollType, subActionId } = action;
        const itemId = [ROLL_TYPE.buff, ROLL_TYPE.item].includes(rollType) ? actionId : '';

        const actor = CoreUtils.getActor(actorId, tokenId);
        const token = CoreUtils.getToken(tokenId);

        super({ actor, token });

        if (itemId) {
            this.item = CoreUtils.getItem(actor, action.actionId);

            if (subActionId) {
                this.subAction = this.item.actions.find((a) => a.id === subActionId);
            }
        }

        this.actionId = actionId;
        this.book = book;
        this.enable = enable || false;
        this.rollType = rollType;
    }
}
