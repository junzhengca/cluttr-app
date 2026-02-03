import React, { useState, useCallback, ReactNode } from 'react';
import { ContextMenuState, ContextMenuLayout, ContextMenuItemData } from './types';
import { ContextMenuOverlay } from './ContextMenuOverlay';
import { ContextMenuContext } from './ContextMenuContext';

export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ContextMenuState>({
        isVisible: false,
        layout: null,
        items: [],
    });

    const showMenu = useCallback(({ layout, items }: {
        layout: ContextMenuLayout;
        items: ContextMenuItemData[];
    }) => {
        setState({
            isVisible: true,
            layout,
            items,
        });
    }, []);

    const hideMenu = useCallback(() => {
        setState((prev) => ({ ...prev, isVisible: false }));
    }, []);

    return (
        <ContextMenuContext.Provider value={{ showMenu, hideMenu, state }}>
            {children}
            <ContextMenuOverlay />
        </ContextMenuContext.Provider>
    );
};

