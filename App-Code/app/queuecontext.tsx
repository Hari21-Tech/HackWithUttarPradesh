// app/components/queueContext.tsx
import React, { createContext, useContext, useState } from 'react';

type QueueContextType = {
  joinedShopId: number | null;
  joinShop: (shopId: number) => void;
  leaveShop: () => void;
};

const defaultValue: QueueContextType = {
  joinedShopId: null,
  joinShop: () => {},
  leaveShop: () => {},
};

const QueueContext = createContext<QueueContextType>(defaultValue);

export const useQueue = () => useContext(QueueContext);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [joinedShopId, setJoinedShopId] = useState<number | null>(null);

  const joinShop = (shopId: number) => setJoinedShopId(shopId);
  const leaveShop = () => setJoinedShopId(null);

  return (
    <QueueContext.Provider value={{ joinedShopId, joinShop, leaveShop }}>
      {children}
    </QueueContext.Provider>
  );
};
