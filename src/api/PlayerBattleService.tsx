import {PlayerBattleInfoDto} from "../type/type";
import http from "./common";

const getPlayerBattleInfos = (playerId: any) => {
    const mockData: PlayerBattleInfoDto[] = [
        // Path A (3 nodes)
        {
            nodes: [
                { id: "A1", xCoordinate: 0, yCoordinate: 0 },
                { id: "A2", xCoordinate: 1, yCoordinate: 1 },
                { id: "A3", xCoordinate: 2, yCoordinate: 2 }
            ],
            edges: [
                { fromNodeId: "A1", toNodeId: "A2" },
                { fromNodeId: "A2", toNodeId: "A3" }
            ]
        },

        // Path B (4 nodes)
        {
            nodes: [
                { id: "B1", xCoordinate: 3, yCoordinate: 0 },
                { id: "B2", xCoordinate: 4, yCoordinate: 1 },
                { id: "B3", xCoordinate: 5, yCoordinate: 2 },
                { id: "B4", xCoordinate: 6, yCoordinate: 3 }
            ],
            edges: [
                { fromNodeId: "B1", toNodeId: "B2" },
                { fromNodeId: "B2", toNodeId: "B3" },
                { fromNodeId: "B3", toNodeId: "B4" }
            ]
        },

        // Path C (5 nodes)
        {
            nodes: [
                { id: "C1", xCoordinate: 0, yCoordinate: 3 },
                { id: "C2", xCoordinate: 1, yCoordinate: 4 },
                { id: "C3", xCoordinate: 2, yCoordinate: 5 },
                { id: "C4", xCoordinate: 3, yCoordinate: 6 },
                { id: "C5", xCoordinate: 4, yCoordinate: 7 }
            ],
            edges: [
                { fromNodeId: "C1", toNodeId: "C2" },
                { fromNodeId: "C2", toNodeId: "C3" },
                { fromNodeId: "C3", toNodeId: "C4" },
                { fromNodeId: "C4", toNodeId: "C5" }
            ]
        }
    ];

    return Promise.resolve({ data: mockData });
};

const PlayerBattleService = {
    getPlayerBattleInfos
};

export default PlayerBattleService;