import {PlayerBattleInfoDto} from "../type/type";
import http from "./common";

const getPlayerBattleInfos = (playerId: any) => {
    return http.get<Array<PlayerBattleInfoDto>>(`/playerbattle/${playerId}`);
};

const PlayerBattleService = {
    getPlayerBattleInfos
};

export default PlayerBattleService;