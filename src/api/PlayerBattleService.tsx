import {PlayerBattleInfoDto} from "../type/type";
import http from "./common";

const getPlayerBattlePathInfoDtos = async (playerId: any) => {
    return http.get<PlayerBattleInfoDto>(`/playerBattlePathInfoDtos/${playerId}`);
};

const playerBattlePathNextTurn = async (playerId: any) => {
    return http.post<PlayerBattleInfoDto>(`/playerBattlePathNextTurn/${playerId}`);
};


const PlayerBattleService = {
    getPlayerBattlePathInfoDtos: getPlayerBattlePathInfoDtos,
    playerBattlePathNextTurn: playerBattlePathNextTurn
};

export default PlayerBattleService;
