export const MODULE_ID = 'lookfar-extension';

export const TYPE_MAP = {
    weapon:    { containerKey: 'weaponsData',     arrayKey: 'weaponQualities',    capitalized: 'Weapon' },
    armor:     { containerKey: 'armorData',       arrayKey: 'armorQualities',     capitalized: 'Armor' },
    shield:    { containerKey: 'shieldsData',     arrayKey: 'shieldQualities',    capitalized: 'Shield' },
    accessory: { containerKey: 'accessoriesData', arrayKey: 'accessoryQualities', capitalized: 'Accessory' }
};

export const DEFAULT_CATEGORIES = [
    'basic', 'aerial', 'ardent', 'thunderous', 'paradox',
    'terrestrial', 'glacial', 'spiritual', 'corrupted',
    'aquatic', 'mechanical'
];

export const ALL_TYPES = [
    { key: 'weapon',    label: 'Arma' },
    { key: 'armor',     label: 'Armadura' },
    { key: 'shield',    label: 'Escudo' },
    { key: 'accessory', label: 'Accesorio' }
];