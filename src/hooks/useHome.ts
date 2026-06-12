import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { homeService } from '../services/HomeService';
import { Home, HomeLoadingState } from '../types/home';
import { setActiveHomeId } from '../store/slices/authSlice';
import { RootState } from '../store';

export const useHome = () => {
  const dispatch = useDispatch();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loadingState, setLoadingState] = useState<HomeLoadingState>(
    homeService.getLoadingState()
  );

  // Use Redux as the source of truth for the active home ID
  const activeHomeId = useSelector(
    (state: RootState) => state.auth.activeHomeId
  );
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [currentHome, setCurrentHome] = useState<Home | undefined>(undefined);

  // Subscribe to HomeService changes (fed by the live Firestore snapshot)
  useEffect(() => {
    const unsubscribe = homeService.subscribe(() => {
      setHomes(homeService.getHomes());
      setLoadingState(homeService.getLoadingState());
    });

    // Initial load
    setHomes(homeService.getHomes());

    return () => {
      unsubscribe();
    };
  }, []);

  // Update currentHome when activeHomeId or homes change
  useEffect(() => {
    if (activeHomeId && homes.length > 0) {
      setCurrentHome(homes.find((h) => h.id === activeHomeId));
    } else {
      setCurrentHome(undefined);
    }
  }, [activeHomeId, homes]);

  // Auto-correct stale activeHomeId: if the active home no longer exists
  // in the available homes list (e.g. access revoked), switch to the first available
  useEffect(() => {
    if (
      activeHomeId &&
      homes.length > 0 &&
      !homes.find((h) => h.id === activeHomeId)
    ) {
      dispatch(setActiveHomeId(homes[0].id));
    }
  }, [activeHomeId, homes, dispatch]);

  const handleSwitchHome = useCallback(
    (homeId: string) => {
      // Just dispatch the action, the saga will handle persistence and service sync
      dispatch(setActiveHomeId(homeId));
      homeService.switchHome(homeId);
    },
    [dispatch]
  );

  const handleCreateHome = useCallback(
    async (name: string, address?: string) => {
      if (!currentUserId) return null;
      const newHome = homeService.createHome(currentUserId, name, address);
      dispatch(setActiveHomeId(newHome.id));
      return newHome;
    },
    [dispatch, currentUserId]
  );

  const handleUpdateHome = useCallback(
    async (id: string, updates: { name?: string; address?: string }) => {
      return homeService.updateHome(id, updates);
    },
    []
  );

  const handleDeleteHome = useCallback(
    async (id: string) => {
      if (!currentUserId) return false;
      const wasActiveHome = activeHomeId === id;
      const success = await homeService.deleteHome(id, currentUserId);
      if (success && wasActiveHome) {
        // HomeService has already switched internally; sync Redux with the next available home
        const availableHomes = homeService.getHomes();
        dispatch(
          setActiveHomeId(
            availableHomes.length > 0 ? availableHomes[0].id : null
          )
        );
      }
      return success;
    },
    [activeHomeId, dispatch, currentUserId]
  );

  const handleUpdateSettings = useCallback(
    async (
      id: string,
      updates: Partial<{ canShareInventory: boolean; canShareTodos: boolean }>
    ) => {
      return homeService.updateSettings(id, updates);
    },
    []
  );

  return {
    homes,
    currentHomeId: activeHomeId,
    currentHome,
    loadingState,
    createHome: handleCreateHome,
    updateHome: handleUpdateHome,
    deleteHome: handleDeleteHome,
    switchHome: handleSwitchHome,
    updateHomeSettings: handleUpdateSettings,
  };
};
