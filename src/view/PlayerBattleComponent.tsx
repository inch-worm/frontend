import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PlayerBattleService from "../api/PlayerBattleService";
import {PlayerBattleInfoDto} from "../type/type";


export function PlayerBattleComponent() {
    let { playerId } = useParams<"playerId">();
    const [playerBattleInfos, setPlayerBattleInfos] = useState<Array<PlayerBattleInfoDto>>([]);

    useEffect(() => {
        retrieveData();
    }, []);
    
      const retrieveData = () => {
          PlayerBattleService.getPlayerBattleInfos(playerId)
          .then((response: any) => {
              setPlayerBattleInfos(response.data);
          })
          .catch((e: Error) => {
            console.log(e);
          });
      };
      console.log(playerBattleInfos);

    return <h2>{playerId}</h2>;
}