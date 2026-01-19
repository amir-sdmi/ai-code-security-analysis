import finalQuest from './assets/final-quest.png';
import firepit from './assets/firepit.png';
import lockedChest from './assets/locked-chest.png';
import piece1 from './assets/piece-1.png';
import piece2 from './assets/piece-2.png';
import piece3 from './assets/piece-3.png';
import piece4 from './assets/piece-4.png';
import piece5 from './assets/piece-5.png';
import puzzle from './assets/puzzle.png';
import shadow3 from './assets/shadow-3.png';
import shadow4 from './assets/shadow-4.png';
import shadow5 from './assets/shadow-5.png';
import spaceSearch from './assets/space-search.png';
import unlockedChest from './assets/unlocked-chest.png';
import worldTravel from './assets/world-travel.png';

export const levels = [
  { image: spaceSearch, name: 'spaceSearch', screen: 'VTHSpaceSearchScreen', location: { x: 0.21, y: 0.73 }, width: 369 / 1290, height: 462 / 2796 },
  { image: puzzle, name: 'puzzle', screen: 'VTHPuzzleScreen', location: { x: 0.63, y: 0.632 }, width: 377 / 1290, height: 339 / 2796 },
  { image: worldTravel, name: 'worldTravel', screen: 'VTHWorldTravelScreen', location: { x: 0.3, y: 0.51 }, width: 479 / 1290, height: 374 / 2796 },
  { image: finalQuest, name: 'finalQuest', screen: 'VTHFinalQuestScreen', location: { x: 0.32, y: 0.263 }, width: 465 / 1290, height: 438 / 2796 },
  { image: firepit, name: 'firepit', screen: 'VTHLandingScreen', location: { x: 0.68, y: 0.85 }, width: 281 / 1290, height: 280 / 2796 },
];

export const finalChest = {
  locked: {
    image: lockedChest,
    name: 'chest',
    screen: 'VTHFinalQuestScreen',
    location: { x: 0.345, y: 0.115 },
    width: 198 / 645,
    height: 149 / 1398,
  },
  unlocked: {
    image: unlockedChest,
    name: 'chest',
    screen: 'VTHFinalQuestScreen',
    location: { x: 0.355, y: 0.09 },
    width: 189 / 645,
    height: 177 / 1398,
  },
};

export const deviceInfo = {
  spaceSearch: {
    name: 'Vivivault 101',
    ledServiceUUID: '90f8afe4-40c0-4be2-89d3-9f77ecb42fde',
    switchCharacteristicUUID: '3556a3ae-f0b6-47cf-8ffb-ae4b51be4793',
  },
  puzzle: {
    name: 'Vivivault 102',
    ledServiceUUID: '50d2b27a-61ba-4ac4-aeb6-5633887eff1d',
    switchCharacteristicUUID: 'd81a39d6-1d12-4000-b1f7-04340651dc68',
  },
  worldTravel: {
    name: 'Vivivault 103',
    ledServiceUUID: '604d5f22-33a9-4ce8-bc9a-54412a09ca4d',
    switchCharacteristicUUID: '82d7712a-dc1a-417b-89e8-c85a4e494ae1',
  },
  finalQuest: {
    name: 'Vivivault 104',
    ledServiceUUID: '634fdd54-4411-40b5-ba87-dabdeb1c9f9e',
    switchCharacteristicUUID: 'c7324a86-7188-48f0-ba32-0cb60d8e382b',
  },
};

export const spells = [
  'VIVISTOP is the most creative place in the world',
  // 'This is an extremely fun game',
  // 'I use chatGPT to write the spells',
];

export const stops = [
  { id: 0, name: 'Kanazawa', country: 'Japan', countryISO: 'JP', continent: 'Asia' },
  { id: 1, name: 'Honolulu', country: 'United States', countryISO: 'US', continent: 'Oceania' },
  { id: 2, name: 'Wellington', country: 'New Zealand', countryISO: 'NZ', continent: 'Oceania' },
  { id: 3, name: 'Tokatsu', country: 'Japan', countryISO: 'JP', continent: 'Asia' },
  { id: 4, name: 'Hakata', country: 'Japan', countryISO: 'JP', continent: 'Asia' },
  { id: 5, name: 'Baguio', country: 'Philippines', countryISO: 'PH', continent: 'Asia' },
  { id: 6, name: 'Singapore', country: 'Singapore', countryISO: 'SG', continent: 'Asia' },
  { id: 7, name: 'Uzupis', country: 'Lithuania', countryISO: 'LT', continent: 'Europe' },
  { id: 8, name: 'Telliskivi', country: 'Estonia', countryISO: 'EE', continent: 'Europe' },
];

export const coordinates = [
  { x: 0.1, y: 0.1 },
  { x: 0.35, y: 0.15 },
  { x: 0.58, y: 0.22 },
  { x: 0.72, y: 0.4 },
  { x: 0.5, y: 0.5 },
  { x: 0.28, y: 0.6 },
  { x: 0.42, y: 0.78 },
  { x: 0.65, y: 0.85 },
  { x: 0.9, y: 0.9 },
];

export const pieces = [
  { image: piece1, name: 'piece-1', location: { x: 0, y: 0 }, width: 432 / 512, height: 205 / 512 },
  { image: piece2, name: 'piece-2', location: { x: 0.4629, y: 0.5215 }, width: 275 / 512, height: 245 / 512 },
  { image: piece3, name: 'piece-3', location: { x: 0.666, y: 0 }, width: 171 / 512, height: 482 / 512 },
  { image: piece4, name: 'piece-4', location: { x: 0, y: 0.5383 }, width: 283 / 512, height: 236 / 512 },
  { image: piece5, name: 'piece-5', location: { x: 0, y: 0.2082 }, width: 359 / 512, height: 264 / 512 },
];

export const shadows = [
  { image: piece1, name: 'piece-1', location: { x: 0, y: 0 }, width: 432 / 512, height: 205 / 512 },
  { image: piece2, name: 'piece-2', location: { x: 0.4629, y: 0.5215 }, width: 275 / 512, height: 245 / 512 },
  { image: shadow3, name: 'shadow-3', location: { x: 0.666, y: 0 }, width: 171 / 512, height: 482 / 512 },
  { image: shadow4, name: 'shadow-4', location: { x: 0, y: 0.5383 }, width: 283 / 512, height: 236 / 512 },
  { image: shadow5, name: 'shadow-5', location: { x: 0, y: 0.2082 }, width: 359 / 512, height: 264 / 512 },
];
