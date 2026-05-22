import type { Site } from '../types'

export const SITES: Site[] = [
  {
    id: 'ss-badger',
    name: 'SS Badger',
    checkpoints: [
      { id: 'ss-badger-ludington', siteId: 'ss-badger', siteName: 'SS Badger', label: 'Ferry Dock — Ludington', lat: 43.9491, lng: -86.4511, routingLat: 43.9555, routingLng: -86.4530, points: 10, region: 'LP' },
      { id: 'ss-badger-manitowoc', siteId: 'ss-badger', siteName: 'SS Badger', label: 'Ferry Dock — Manitowoc, WI', lat: 44.0902, lng: -87.6512, routingLat: 44.0944, routingLng: -87.6650, points: 10, region: 'X', outOfState: true },
      { id: 'ss-badger-water', siteId: 'ss-badger', siteName: 'SS Badger', label: 'On the Water', lat: 43.9527, lng: -86.4694, points: 21, region: 'Water', ferryCostRoundTrip: '$292' },
    ],
  },
  {
    id: 'lake-express',
    name: 'Lake Express',
    checkpoints: [
      { id: 'lake-express-muskegon', siteId: 'lake-express', siteName: 'Lake Express', label: 'Ferry — Muskegon', lat: 43.2195, lng: -86.2918, routingLat: 43.2240, routingLng: -86.2820, points: 10, region: 'LP' },
      { id: 'lake-express-milwaukee', siteId: 'lake-express', siteName: 'Lake Express', label: 'Ferry Dock — Milwaukee, WI', lat: 43.0037, lng: -87.8858, routingLat: 43.0091, routingLng: -87.8975, points: 10, region: 'X', outOfState: true },
      { id: 'lake-express-water', siteId: 'lake-express', siteName: 'Lake Express', label: 'On the Water', lat: 43.2248, lng: -86.3475, points: 21, region: 'Water', ferryCostRoundTrip: '$367' },
    ],
  },
  {
    id: 'mackinac-island',
    name: 'Mackinac Island',
    checkpoints: [
      { id: 'mackinac-starline', siteId: 'mackinac-island', siteName: 'Mackinac Island', label: 'Star Line / Arnold Transit Dock — Mackinaw City', lat: 45.7722, lng: -84.7259, points: 10, region: 'LP' },
      { id: 'mackinac-shepler', siteId: 'mackinac-island', siteName: 'Mackinac Island', label: "Shepler's Mackinac Ferry Dock — Mackinaw City", lat: 45.7825, lng: -84.7234, points: 10, region: 'LP' },
      { id: 'mackinac-island', siteId: 'mackinac-island', siteName: 'Mackinac Island', label: 'Mackinac Island', lat: 45.8504, lng: -84.6166, points: 21, region: 'Island', ferryCostRoundTrip: '$39' },
    ],
  },
  {
    id: 'les-cheneaux',
    name: 'Les Cheneaux Islands',
    checkpoints: [
      { id: 'les-cheneaux-gateway', siteId: 'les-cheneaux', siteName: 'Les Cheneaux Islands', label: 'Gateway to Les Cheneaux Islands', lat: 45.9952, lng: -84.3634, points: 10, region: 'UP' },
    ],
  },
  {
    id: 'beaver-island',
    name: 'Beaver Island',
    checkpoints: [
      { id: 'beaver-charlevoix', siteId: 'beaver-island', siteName: 'Beaver Island', label: 'Ferry Dock — Charlevoix (Mainland)', lat: 45.3183, lng: -85.2581, points: 10, region: 'LP' },
      { id: 'beaver-island', siteId: 'beaver-island', siteName: 'Beaver Island', label: 'Ferry Dock — Island', lat: 45.7470, lng: -85.5191, points: 21, region: 'Island', ferryCostRoundTrip: '$167' },
    ],
  },
  {
    id: 'drummond-island',
    name: 'Drummond Island',
    checkpoints: [
      { id: 'drummond-mainland', siteId: 'drummond-island', siteName: 'Drummond Island', label: 'Ferry — Mainland', lat: 45.9923, lng: -83.8988, points: 10, region: 'UP' },
      { id: 'drummond-island', siteId: 'drummond-island', siteName: 'Drummond Island', label: 'Ferry — Island', lat: 45.9887, lng: -83.8780, points: 21, region: 'Island', ferryCostRoundTrip: '$10' },
    ],
  },
  {
    id: 'sugar-island',
    name: 'Sugar Island',
    checkpoints: [
      { id: 'sugar-mainland', siteId: 'sugar-island', siteName: 'Sugar Island', label: 'Ferry — Mainland', lat: 46.4861, lng: -84.3023, points: 10, region: 'UP' },
      { id: 'sugar-island', siteId: 'sugar-island', siteName: 'Sugar Island', label: 'Ferry — Island', lat: 46.4849, lng: -84.2970, points: 21, region: 'Island', ferryCostRoundTrip: '$10' },
    ],
  },
  {
    id: 'neebish-island',
    name: 'Neebish Island',
    checkpoints: [
      { id: 'neebish-mainland', siteId: 'neebish-island', siteName: 'Neebish Island', label: 'Ferry — Mainland', lat: 46.2846, lng: -84.2128, points: 10, region: 'UP' },
      { id: 'neebish-island', siteId: 'neebish-island', siteName: 'Neebish Island', label: 'Ferry — Island', lat: 46.2852, lng: -84.2091, points: 21, region: 'Island', ferryCostRoundTrip: '$10' },
    ],
  },
  {
    id: 'ironton-ferry',
    name: 'Ironton Ferry',
    checkpoints: [
      { id: 'ironton-west', siteId: 'ironton-ferry', siteName: 'Ironton Ferry', label: 'West Landing', lat: 45.2562, lng: -85.1857, points: 10, region: 'LP', ferryCostRoundTrip: '$5', warning: 'The Ironton Ferry crosses Lake Charlevoix in ~4 min. This planner routes by road around the lake (~30 min longer) — if you take the ferry, your actual ride time will be shorter than shown.', warningLabel: 'Ferry shortcut' },
      { id: 'ironton-east', siteId: 'ironton-ferry', siteName: 'Ironton Ferry', label: 'East Landing', lat: 45.2559, lng: -85.1822, points: 10, region: 'LP', ferryCostRoundTrip: '$5', warning: 'The Ironton Ferry crosses Lake Charlevoix in ~4 min. This planner routes by road around the lake (~30 min longer) — if you take the ferry, your actual ride time will be shorter than shown.', warningLabel: 'Ferry shortcut' },
    ],
  },
  {
    id: 'bois-blanc',
    name: 'Bois Blanc Island',
    checkpoints: [
      { id: 'bois-blanc-mainland', siteId: 'bois-blanc', siteName: 'Bois Blanc Island', label: 'Ferry — Mainland', lat: 45.6455, lng: -84.4744, points: 10, region: 'LP' },
      { id: 'bois-blanc-island', siteId: 'bois-blanc', siteName: 'Bois Blanc Island', label: 'Ferry — Island', lat: 45.7277, lng: -84.4523, points: 21, region: 'Island', ferryCostRoundTrip: '$60' },
    ],
  },
  {
    id: 'algonac-walpole',
    name: 'Algonac / Walpole',
    checkpoints: [
      { id: 'algonac-dock', siteId: 'algonac-walpole', siteName: 'Algonac / Walpole', label: 'Algonac Ferry Dock', lat: 42.6188, lng: -82.5300, points: 10, region: 'LP' },
      { id: 'walpole-island', siteId: 'algonac-walpole', siteName: 'Algonac / Walpole', label: 'Walpole Island Ferry — Canada!', lat: 42.6150, lng: -82.5145, points: 21, region: 'X', ferryCostRoundTrip: '$12', outOfState: true },
    ],
  },
  {
    id: 'harsens-island',
    name: 'Harsens Island',
    checkpoints: [
      { id: 'harsens-mainland', siteId: 'harsens-island', siteName: 'Harsens Island', label: 'Ferry — Mainland', lat: 42.6180, lng: -82.5606, points: 10, region: 'LP' },
      { id: 'harsens-island', siteId: 'harsens-island', siteName: 'Harsens Island', label: 'Ferry — Island', lat: 42.6141, lng: -82.5613, points: 21, region: 'Island', ferryCostRoundTrip: '$8' },
    ],
  },
  {
    id: 'saugatuck',
    name: 'Saugatuck',
    checkpoints: [
      { id: 'saugatuck-chain', siteId: 'saugatuck', siteName: 'Saugatuck', label: 'Saugatuck Chain Ferry', lat: 42.6584, lng: -86.2055, points: 10, region: 'LP' },
    ],
  },
  {
    id: 'dealership',
    name: 'BMW Dealership',
    checkpoints: [
      { id: 'dealership-check', siteId: 'dealership', siteName: 'BMW Dealership', label: 'BMW Dealership', lat: 42.855651, lng: -85.664084, points: 10, region: 'LP' },
    ],
  },
  {
    id: 'manitou-islands',
    name: 'Manitou Islands',
    checkpoints: [
      { id: 'manitou-leland', siteId: 'manitou-islands', siteName: 'Manitou Islands', label: 'Manitou Island Transit Dock — Leland', lat: 45.0238, lng: -85.7619, points: 10, region: 'LP' },
      { id: 'manitou-north', siteId: 'manitou-islands', siteName: 'Manitou Islands', label: 'North Manitou Island Dock', lat: 45.1214, lng: -85.9755, points: 21, region: 'Island', warning: 'Closed for the entire 2026 season — Manitou Island Transit is not running any trips. Points are still in play if you want to try.', warningLabel: 'Closed', warningLink: 'https://manitoutransit.com/rates-schedule/' },
      { id: 'manitou-south', siteId: 'manitou-islands', siteName: 'Manitou Islands', label: 'South Manitou Island Dock', lat: 45.0122, lng: -86.0946, points: 21, region: 'Island', warning: 'Closed for the entire 2026 season — Manitou Island Transit is not running any trips. Points are still in play if you want to try.', warningLabel: 'Closed', warningLink: 'https://manitoutransit.com/rates-schedule/' },
    ],
  },
  {
    id: 'grand-island',
    name: 'Grand Island',
    checkpoints: [
      { id: 'grand-mainland', siteId: 'grand-island', siteName: 'Grand Island', label: 'Ferry — Mainland', lat: 46.4449, lng: -86.6646, points: 10, region: 'UP' },
      { id: 'grand-island', siteId: 'grand-island', siteName: 'Grand Island', label: 'Ferry — Island', lat: 46.4512, lng: -86.6713, points: 21, region: 'Island', ferryCostRoundTrip: '$25' },
    ],
  },
  {
    id: 'isle-royale',
    name: 'Isle Royale',
    checkpoints: [
      { id: 'isle-royale-mainland', siteId: 'isle-royale', siteName: 'Isle Royale', label: 'Ferry Dock — Mainland', lat: 47.4702, lng: -87.8908, routingLat: 47.4685, routingLng: -87.8810, points: 10, region: 'UP' },
      { id: 'isle-royale-houghton', siteId: 'isle-royale', siteName: 'Isle Royale', label: 'Visitors Center — Houghton', lat: 47.1229, lng: -88.5637, routingLat: 47.1240, routingLng: -88.5680, points: 10, region: 'UP' },
      { id: 'isle-royale-island', siteId: 'isle-royale', siteName: 'Isle Royale', label: 'Ferry Dock — Island', lat: 48.1458, lng: -88.4860, points: 21, region: 'Island', ferryCostRoundTrip: '$175' },
    ],
  },
]

export const ALL_CHECKPOINTS = SITES.flatMap((s) => s.checkpoints)

export const CHECKPOINTS_BY_ID = new Map(ALL_CHECKPOINTS.map((c) => [c.id, c]))

/** First mainland (LP/UP) checkpoint per site — used to substitute islands for routing. */
export const MAINLAND_FOR_SITE = new Map<string, typeof ALL_CHECKPOINTS[number]>()
for (const site of SITES) {
  const mainland = site.checkpoints.find((c) => c.region === 'LP' || c.region === 'UP')
  if (mainland) MAINLAND_FOR_SITE.set(site.id, mainland)
}

export const DEFAULT_HOME_BASE = {
  lat: 42.855651,
  lng: -85.664084,
  label: 'BMW Motorcycles of Grand Rapids',
}
