import { createContext, useState, ReactNode, useContext } from "react";
import { Socket } from "socket.io-client";
import {ContextType} from "../data/types/ContextType.tsx";

export const MyContext = createContext<ContextType | undefined>(undefined);

interface MyProviderProps {
    children: ReactNode;
}

export default function MyProvider({ children }: MyProviderProps) {
    const [socket, setSocket] = useState<typeof Socket | null>(null);

    return (
        <MyContext.Provider value={{ socket, setSocket }}>
            {children}
        </MyContext.Provider>
    );
}

export const useMyContext = (): ContextType => {
    const context = useContext(MyContext);
    if (!context) {
        throw new Error("useMyContext must be used within a MyProvider");
    }
    return context;
};
