import {PlayerBattlePathInfoDto} from "../type/type";
import http from "./common";

const getPlayerBattlePathInfoDtos = async (playerId: any) => {
    return http.get<Array<PlayerBattlePathInfoDto>>(`/playerBattlePathInfoDtos/${playerId}`);
};

const playerBattlePathNextTurn = async (playerId: any) => {
    return http.post<Array<PlayerBattlePathInfoDto>>(`/playerBattlePathNextTurn/${playerId}`);
};


const PlayerBattleService = {
    getPlayerBattlePathInfoDtos: getPlayerBattlePathInfoDtos,
    playerBattlePathNextTurn: playerBattlePathNextTurn
};

export default PlayerBattleService;
