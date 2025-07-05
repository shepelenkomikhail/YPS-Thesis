import React from "react";
import {Socket} from "socket.io-client";

export interface ContextType {
    socket: typeof Socket| null;
    setSocket: React.Dispatch<React.SetStateAction<typeof Socket | null>>;
}
