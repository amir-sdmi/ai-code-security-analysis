import { world, system, Player } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

class PlayerDataModel { // only use this for small stats because dynamic prop data limit!
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.coins = 0;
        this.joinTime = Date.now();
    }
};

Player.prototype.getData = function () {
    return JSON.parse(getPlayerDynamicProperty(this, 'playerData'));
}

Player.prototype.setData = function (data) {
    setPlayerDynamicProperty(this, 'playerData', JSON.stringify(data));
}

function printKeysAndMethods(obj) {
    console.warn('Keys:', Object.keys(obj));
    console.warn('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(name => typeof obj[name] === 'function'));
}

function getPlayerDynamicProperty(player, objective) {
    return world.getDynamicProperty(`${player.id}:${objective}`)
}

function setPlayerDynamicProperty(player, objective, value, add = false) {
    add && typeof value === 'number' ? world.setDynamicProperty(`${player.id}:${objective}`,  world.getDynamicProperty(`${player.id}:${objective}`) + value) : world.setDynamicProperty(`${player.id}:${objective}`, value)
}

function getGlobalDynamicProperty(objective) {
    return world.getDynamicProperty(objective)
}

function setGlobalDynamicProperty(objective, value, add = false) {
    add && typeof value === 'number' ? world.setDynamicProperty(objective, world.getDynamicProperty(objective)+value) : world.setDynamicProperty(objective, value)
}

function ensureKeys(obj, cls) { // powered by chatgpt ahh code
    const instance = new cls();
    const clsKeys = Object.keys(instance);

    // Check for missing keys in obj and remove keys not present in the class
    for (let key in obj) { if (!clsKeys.includes(key)) delete obj[key]; }

    // Check for missing keys in obj and add missing keys with default values from the class
    clsKeys.forEach(key => { if (!obj.hasOwnProperty(key)) obj[key] = instance[key]; });
    return obj;
}


/**@param {Player} player */
function showStatsMenu(player) {
    /** @type {PlayerDataModel} */
    const stats = player.getData();
    const statsMenu = new ActionFormData()
        .title("Stats!")
        .body(`\nName - ${stats.name}\nID - ${stats.id}\nCoins - ${stats.coins}\nOogaBooga - ${stats.oogabooga}\n\n\n`)
        .button("Sweet!")
        .show(player).then(a => { if (a.canceled) return; })
}

world.afterEvents.playerSpawn.subscribe(data => {
    const player = data.player;
    if (data.initialSpawn) {
        if (!player.getData()) {
            player.setData(new PlayerDataModel(player.id, player.name));
        }
        player.setData(ensureKeys(player.getData(), PlayerDataModel));
    }
})


world.afterEvents.itemUse.subscribe(data => {
    const player = data.source;
    player.setData(new PlayerDataModel(player.id, player.name));
    //player.setData(ensureKeys(player.getData(), PlayerDataModel));

    if (data.itemStack.typeId == 'minecraft:compass') {
        showStatsMenu(player);
    }
})
