import { createContext, useContext } from 'react';
import { ContextMenuState, ContextMenuLayout, ContextMenuItemData } from './types';

export interface ContextMenuContextType {
    showMenu: (params: {
        layout: ContextMenuLayout;
        items: ContextMenuItemData[];
    }) => void;
    hideMenu: () => void;
    state: ContextMenuState;
}

export const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const useContextMenu = () => {
    const context = useContext(ContextMenuContext);
    if (!context) {
        throw new Error('useContextMenu must be used within a ContextMenuProvider');
    }
    return context;
};
