import { useContext } from "react";
import { AuthContext } from "./AuthContextProvider";

export function useAuth() {
  return useContext(AuthContext);
}
