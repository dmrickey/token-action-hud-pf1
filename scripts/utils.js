import { MODULE } from './constants.js'

export class Utils {
    static isEmptyObject = (obj) => !Object.keys(obj).length;

    static localize = (key, opts = {}) => {
        const myKey = `${MODULE.ID}.${key}`;
        return Utils.isEmptyObject(opts)
            ? (game.i18n.localize(myKey) === myKey ? game.i18n.localize(key) : game.i18n.localize(myKey))
            : (game.i18n.format(myKey, opts) === myKey ? game.i18n.format(key, opts) : game.i18n.format(myKey, opts));
    }

    static getFirstActiveGM = () => pf1.utils.getFirstActiveGM();
    static isFirstGM = () => this.getFirstActiveGM() === game.user;
    static isCurrentUser = (userId) => game.user.id === userId;
    static doOnce = (func) => this.handleSingleOwner(game.user.id, func);
    static handleSingleOwner = async (userId, func) => {
        const gm = this.getFirstActiveGM();

        if (this.isFirstGM() || (!gm && this.isCurrentUser(userId))) {
            await func();
        }
    }

    static #itemHasActions = (item) => !!this.getItemActions(item).length;
    static canUseItem = (item) => this.#itemHasActions(item) || !!item.getScriptCalls("use").length;
    static getItemActions = (item) => {
        const actions = item.actions;
        return actions ? [...actions] : [];
        // const unchained = game.settings.get('pf1', 'unchainedActionEconomy');

        // disabling this but leaving it here for future use -- "passive" actions are still actions because they can still be used.
        // const isActive = (action) => unchained
        //     ? action.data.unchainedAction?.activation?.type && action.data.unchainedAction.activation.type !== 'passive'
        //     : action.data.activation?.type && action.data.activation?.type !== 'passive';

        // leaving this here again -- it seems right, but an action might not have an activation type configured but can still be used
        // const isAction = (action) => unchained
        //     ? action.data.unchainedAction?.activation?.type
        //     : action.data.activation?.type;
        // return (actions || []).filter(isAction);
    }

    /**
     * Get actor from the token or actor object
     * @param {string} actorId The actor id
     * @param {string} tokenId The token id
     * @returns {object}       The actor
     */
    static getActor(actorId, tokenId) {
        let token = null
        if (tokenId) token = canvas.tokens.placeables.find((token) => token.id === tokenId)
        if (token) return token.actor
        return game.actors.get(actorId)
    }

    /**
     * Get item from the actor object
     * @param {object} actor  The actor
     * @param {string} itemId The item id
     * @returns {object}      The item
     */
    static getItem(actor, itemId) {
        return actor.items.get(itemId)
    }

    /**
     * Get token
     * @param {string} tokenId The token id
     * @returns {object}       The token
     */
    static getToken(tokenId) {
        return canvas.tokens.placeables.find((token) => token.id === tokenId)
    }
}
