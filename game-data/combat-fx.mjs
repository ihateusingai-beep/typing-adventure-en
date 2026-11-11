// AI-painted protection and impact art. Presentation only.
import {effectSignature} from './signature-arts.mjs';
export const COMBAT_FX={
  "ward": {
    "src": "assets/v3/combat-fx/ward.webp",
    "columns": 4,
    "rows": 1,
    "count": 4,
    "cellSize": 512,
    "inkBounds": [
      99,
      26,
      407,
      471
    ]
  },
  "blade": {
    "src": "assets/v3/combat-fx/blade.webp",
    "columns": 4,
    "rows": 1,
    "count": 4,
    "cellSize": 512,
    "inkBounds": [
      27,
      98,
      484,
      413
    ]
  },
  "thunder": {
    "src": "assets/v3/combat-fx/thunder.webp",
    "columns": 4,
    "rows": 1,
    "count": 4,
    "cellSize": 512,
    "inkBounds": [
      87,
      26,
      424,
      485
    ]
  },
  "frost": {
    "src": "assets/v3/combat-fx/frost.webp",
    "columns": 4,
    "rows": 1,
    "count": 4,
    "cellSize": 512,
    "inkBounds": [
      27,
      98,
      484,
      413
    ]
  },
  "flame": {
    "src": "assets/v3/combat-fx/flame.webp",
    "columns": 4,
    "rows": 1,
    "count": 4,
    "cellSize": 512,
    "inkBounds": [
      87,
      26,
      424,
      485
    ]
  }
};
export function impactTheme(hero){
 const id=effectSignature(hero?.effectId,hero?.id).id;
 if(['O03','O06','O14'].includes(id))return 'frost';
 if(['O05','O12'].includes(id))return 'flame';
 if(['O07','O08','O09','O13'].includes(id)||hero?.attackStyle!=='sword'&&hero?.attackStyle)return 'thunder';
 return 'blade';
}