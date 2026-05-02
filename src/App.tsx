import React from "react";
import { Route, Routes } from "react-router-dom";
import { PlayerResourceComponent } from "./view/PlayerResourceComponent";
 
  function Index() {
   return <h2>Home</h2>;
    }
 
 function AppRouter() {
   return (
     <Routes>
         <Route path="/" element={<Index/>} />
         <Route path="/playerResources/:playerId" element={<PlayerResourceComponent />} />
     </Routes>
   );
 }
 
 export default AppRouter;