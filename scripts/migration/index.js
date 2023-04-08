import { CORE_MODULE, MODULE } from "../constants";
import { Settings } from "../settings";

const migrate = async () => {
    game.settings.register(MODULE.ID, 'migrationVersion', {
        config: false,
        scope: 'client',
        default: '',
        type: String,
    });

    const lastMigrated = Settings.migrationVersion || 1;

    if (foundry.utils.isNewerVersion('1.1.4', lastMigrated)) {
        await game.user.unsetFlag(CORE_MODULE.ID, 'categories');
        await game.user.unsetFlag(CORE_MODULE.ID, 'default.categories');
    }

    const current = game.modules.get(MODULE.ID).version;
    Settings.migrationVersion = current;
};

export {
    migrate,
};
