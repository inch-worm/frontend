import {PlayerBattleInfoDto} from "../type/type";
import http from "./common";
const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

const moveUnitsOneTurn = (data: PlayerBattleInfoDto[]) => {
    const newData = deepClone(data);

    newData.forEach((path: PlayerBattleInfoDto) => {
        const nodeCount = path.nodes.length;

        // prepare empty units
        const nextUnits = path.nodes.map(() => [] as any[]);

        path.nodes.forEach((node, index) => {
            node.unitsInfo?.forEach(unit => {
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
        path.nodes.forEach((node, i) => {
            node.unitsInfo = nextUnits[i];
        });
    });

    return newData;
};

const initialData: PlayerBattleInfoDto[] = [
    {
        nodes: [
            {
                id: "A1",
                xCoordinate: 1,
                yCoordinate: 2,
                unitsInfo: [{ unitType: "infantry", count: 10, owner: "player" }]
            },
            {
                id: "A2",
                xCoordinate: 2,
                yCoordinate: 3,
                unitsInfo: [
                    { unitType: "archer", count: 5, owner: "enemy" },
                    { unitType: "infantry", count: 3, owner: "enemy" }
                ]
            },
            {
                id: "A3",
                xCoordinate: 1,
                yCoordinate: 4,
                unitsInfo: []
            }
        ],
        edges: [
            { fromNodeId: "A1", toNodeId: "A2" },
            { fromNodeId: "A2", toNodeId: "A3" }
        ]
    },
    {
        nodes: [
            {
                id: "B1",
                xCoordinate: 5,
                yCoordinate: 1,
                unitsInfo: [{ unitType: "cavalry", count: 7, owner: "player" }]
            },
            { id: "B2", xCoordinate: 4, yCoordinate: 2, unitsInfo: [] },
            {
                id: "B3",
                xCoordinate: 6,
                yCoordinate: 3,
                unitsInfo: [{ unitType: "archer", count: 12, owner: "enemy" }]
            },
            { id: "B4", xCoordinate: 5, yCoordinate: 4, unitsInfo: [] }
        ],
        edges: [
            { fromNodeId: "B1", toNodeId: "B2" },
            { fromNodeId: "B2", toNodeId: "B3" },
            { fromNodeId: "B3", toNodeId: "B4" }
        ]
    },
    {
        nodes: [
            { id: "C1", xCoordinate: 9, yCoordinate: 0, unitsInfo: [] },
            {
                id: "C2",
                xCoordinate: 10,
                yCoordinate: 1,
                unitsInfo: [{ unitType: "infantry", count: 20, owner: "enemy" }]
            },
            { id: "C3", xCoordinate: 8, yCoordinate: 2, unitsInfo: [] },
            {
                id: "C4",
                xCoordinate: 10,
                yCoordinate: 3,
                unitsInfo: [
                    { unitType: "cavalry", count: 4, owner: "player" },
                    { unitType: "archer", count: 6, owner: "player" }
                ]
            },
            { id: "C5", xCoordinate: 9, yCoordinate: 4, unitsInfo: [] }
        ],
        edges: [
            { fromNodeId: "C1", toNodeId: "C2" },
            { fromNodeId: "C2", toNodeId: "C3" },
            { fromNodeId: "C3", toNodeId: "C4" },
            { fromNodeId: "C4", toNodeId: "C5" }
        ]
    }
];

const getPlayerBattleInfos = (playerId: any, turn: number = 0) => {
    let data = deepClone(initialData);

    for (let i = 0; i < turn; i++) {
        data = moveUnitsOneTurn(data);
    }

    return Promise.resolve({ data });
};

const PlayerBattleService = {
    getPlayerBattleInfos
};

export default PlayerBattleService;