import { createContext } from "react";

type AuthContextType = {
	logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({ logout: () => {} });
