import {PlayerBattleInfoDto} from "../type/type";
import http from "./common";

export type PlayerBattleNextTurnRequest = {
    unitPlacementDtos: {
        unplacedGroupInfoId: string;
        nodeId: string;
    }[];
};

const getPlayerBattlePathInfoDto = async (playerId: any) => {
    return http.get<PlayerBattleInfoDto>(`/currentPlayerBattlePathInfoDto/${playerId}`);
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
    getPlayerBattlePathInfoDto: getPlayerBattlePathInfoDto,
    playerBattlePathNextTurn: playerBattlePathNextTurn
};

export default PlayerBattleService;
