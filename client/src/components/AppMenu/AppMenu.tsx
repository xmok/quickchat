import React, { useCallback, useContext } from "react";
import type { AppMenuProps } from "stream-chat-react";
import { AuthContext } from "../../App";

import "./AppMenu.css";

export const AppMenu = ({ close }: AppMenuProps) => {
  const { logout } = useContext(AuthContext);

  const handleSelect = useCallback(() => {
    logout();
    close?.();
  }, [close, logout]);

  return (
    <div className="app-menu__container">
      <ul className="app-menu__item-list">
        <li className="app-menu__item" onClick={handleSelect}>
          Logout
        </li>
      </ul>
    </div>
  );
};