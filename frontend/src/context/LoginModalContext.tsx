import { createContext, useContext } from "react";

type LoginModalContextType = {
  openLoginModal: () => void;
};

export const LoginModalContext = createContext<LoginModalContextType>({
  openLoginModal: () => {}
})

export const useLoginModal = () => useContext(LoginModalContext);