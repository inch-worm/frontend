import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PlayerResourceService from "../api/PlayerResourceService";
import { PlayerResourceDto } from "../type/type";


export function PlayerResourceComponent() {
    let { playerId } = useParams<"playerId">();
    const [playerResources, setPlayerResources] = useState<Array<PlayerResourceDto>>([]);

    useEffect(() => {
        retrieveData();
    }, []);
    
      const retrieveData = () => {
        PlayerResourceService.getPlayerResources(playerId)
          .then((response: any) => {
            setPlayerResources(response.data);
          })
          .catch((e: Error) => {
            console.log(e);
          });
      };
      console.log(playerResources);

    return <h2>{playerId}</h2>;
}