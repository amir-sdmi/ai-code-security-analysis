export class Present {
    constructor(
        public readonly from: string,
        public readonly to: string) {

    }
}

function isForbidden(
    shuffle: string[],
    forbiddenRules: [((f: string, t: string) => boolean)]) {
    for (let i = 0; i < shuffle.length; i++) {
        const from = shuffle[i];
        const to = shuffle[(i + 1) % shuffle.length];
        if(forbiddenRules.find(f => f(from, to))) {
            return true
        }
    }
    return false;
}

/**
 *
 * generated with ChatGPT by the following question:
 * "an algo that determine who will give a gift to another in an assembly"
 * <code>
 * # participants is a list of strings representing the names of the participants
 *
 * # Shuffle the list of participants randomly
 * shuffle(participants)
 *
 * # Iterate through the participants
 * for i, participant in enumerate(participants):
 *   # Assign the next participant in the list as the recipient of the gift
 *   recipient = participants[(i + 1) % len(participants)]
 *   assign_gift_recipient(participant, recipient)
 *  </code>
 * @param participants
 */
export function presentGenerator(participants: string[], ...forbiddenRules: [(f: string, t: string) => boolean]) {
    const result = new Array<Present>();
    let shuffle = participants.sort(() => Math.random() - 0.5);

    let count = 0
    while (isForbidden(shuffle, forbiddenRules) && count < 100){
        shuffle = participants.sort(() => Math.random() - 0.5);
        count++
    }


    for (let i = 0; i < shuffle.length; i++) {
        const participant = shuffle[i];
        const recipient = shuffle[(i + 1) % shuffle.length];
        result.push(new Present(participant, btoa(recipient)));
    }

    return result
}
