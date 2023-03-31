const coreModulePath = '../token-action-hud-core/scripts/token-action-hud-core.min.js'
const coreModule = await import(coreModulePath)

export const CoreActionHandler = coreModule.ActionHandler
export const CoreActionListExtender = coreModule.ActionListExtender
export const CoreCategoryManager = coreModule.CategoryManager
export const CorePreRollHandler = coreModule.PreRollHandler
export const CoreRollHandler = coreModule.RollHandler
export const CoreSystemManager = coreModule.SystemManager
export const CoreUtils = coreModule.Utils
export const Logger = coreModule.Logger
