import {PlayerBattleInfoDto} from "../type/type";
import http from "./common";

export type PlayerBattleNextTurnRequest = {
    unitPlacementDtos: {
        unplacedGroupInfoId: string;
        nodeId: string;
    }[];
};

const getPlayerBattlePathInfoDtos = async (playerId: any) => {
    return http.get<PlayerBattleInfoDto>(`/playerBattlePathInfoDtos/${playerId}`);
};

const playerBattlePathNextTurn = async (
    playerId: any,
    request: PlayerBattleNextTurnRequest
) => {
    return http.post<PlayerBattleInfoDto>(
        `/playerBattlePathNextTurn/${playerId}`,
        request
    );
};


const PlayerBattleService = {
    getPlayerBattlePathInfoDtos: getPlayerBattlePathInfoDtos,
    playerBattlePathNextTurn: playerBattlePathNextTurn
};

export default PlayerBattleService;
