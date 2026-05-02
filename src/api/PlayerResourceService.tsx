import { PlayerResourceDto } from "../type/type";
import http from "./common";

const getPlayerResources = (playerId: any) => {
  return http.get<Array<PlayerResourceDto>>(`/playerResources/${playerId}`);
};

const PlayerResourceService = {
  getPlayerResources
};

export default PlayerResourceService;