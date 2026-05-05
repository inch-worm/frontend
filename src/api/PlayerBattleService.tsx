import {PlayerBattlePathInfoDto} from "../type/type";
import http from "./common";
const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

const moveUnitsOneTurn = (data: PlayerBattlePathInfoDto[]) => {
    const newData = deepClone(data);

    newData.forEach((path: PlayerBattlePathInfoDto) => {
        const nodeCount = path.nodeDtos.length;

        // prepare empty units
        const nextUnits = path.nodeDtos.map(() => [] as any[]);

        path.nodeDtos.forEach((node, index) => {
            node.groupInfoDtos?.forEach(unit => {
                let targetIndex = index;

                if (unit.owner === "player") {
                    targetIndex = Math.max(0, index - 1);
                } else {
                    targetIndex = Math.min(nodeCount - 1, index + 1);
                }

                // merge units if same type+owner exists
                const existing = nextUnits[targetIndex].find(
                    (u: any) =>
                        u.unitType === unit.unitType &&
                        u.owner === unit.owner
                );

                if (existing) {
                    existing.count += unit.count;
                } else {
                    nextUnits[targetIndex].push({ ...unit });
                }
            });
        });

        // assign new units
        path.nodeDtos.forEach((node, i) => {
            node.groupInfoDtos = nextUnits[i];
        });
    });

    return newData;
};

const getPlayerBattlePathInfoDtos = async (playerId: any, turn: number = 0) => {
    const response = await http.get<Array<PlayerBattlePathInfoDto>>(
        `/playerBattlePathInfoDtos/${playerId}`
    );

    let data = deepClone(response.data); // ✅ THIS is your array

    for (let i = 0; i < turn; i++) {
        data = moveUnitsOneTurn(data);
    }

    return { data };
};

const PlayerBattleService = {
    getPlayerBattlePathInfoDtos: getPlayerBattlePathInfoDtos
};

export default PlayerBattleService;
