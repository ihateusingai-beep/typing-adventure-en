export const FIRST_CHALLENGE_CHAPTER = 'S02-04';
export const CHALLENGE_MIN_ACCURACY = 20;
export const CHALLENGE_REWARD_STONES = 50;

export function passesChallenge({correct, attempted}) {
 return Number.isInteger(correct) && Number.isInteger(attempted) && attempted > 0 &&
  correct <= attempted && correct * 100 >= attempted * CHALLENGE_MIN_ACCURACY;
}

export function shouldGuideChallenge(save) {
 return save.completedNodeIds.includes(FIRST_CHALLENGE_CHAPTER) && !save.collection.firstChallengeReward;
}