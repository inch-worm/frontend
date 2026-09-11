import React from "react";
import { Route, Routes } from "react-router-dom";
import {PlayerBattleComponent} from "./view/PlayerBattleComponent";
 
  function Index() {
   return <h2>Home</h2>;
    }
 
 function AppRouter() {
   return (
     <Routes>
         <Route path="/" element={<Index/>} />
         <Route path="/playerBattle/:playerId" element={<PlayerBattleComponent />} />
     </Routes>
   );
 }
 
 export default AppRouter;