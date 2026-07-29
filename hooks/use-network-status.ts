import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  isOffline: boolean;
}

const INITIAL_STATE: NetworkStatus = {
  isConnected: null,
  isInternetReachable: null,
  type: 'unknown',
  isOffline: false,
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(INITIAL_STATE);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOffline: state.isConnected === false || state.isInternetReachable === false,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
