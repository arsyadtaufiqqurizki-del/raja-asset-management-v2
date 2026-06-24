import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../lib/firebase';

export type Asset = {
  id: string; // This will map to assetId
  name: string;
  subsidiary: string; 
  category: string;
  date: string;
  val: string;
  condition: string;
  conditionLevel: 'good' | 'warning' | 'error';
  status: string;
  statusLevel: 'success' | 'warning' | 'error' | 'neutral';
  assetBook?: string;
  serialNumber?: string;
  assetType?: string;
  prorateConvention?: string;
  assetUnits?: number;
  categorySegment1?: string;
  categorySegment2?: string;
  categorySegment3?: string;
  keySegment1?: string;
  keySegment2?: string;
  keySegment3?: string;
  amortizationStartDate?: string;
  depreciationMethod?: string;
  lifeInMonths?: number;
  costClearingAccount1?: string;
  costClearingAccount2?: string;
  costClearingAccount3?: string;
  costClearingAccount4?: string;
  costClearingAccount5?: string;
  costClearingAccount6?: string;
  costClearingAccount7?: string;
  costClearingAccount8?: string;
  listed?: string;
  listedStatus?: string;
  assetNumber?: string;
  assetDescription?: string;
  assetCost?: string;
  datePlacedInService?: string;
};

const initialAssets: Asset[] = [];

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Asset) => Promise<void>;
  addAssetsBulk: (assets: Asset[]) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  isLoading: boolean;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function AssetProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const dbAssets = await response.json();
      
      const mappedAssets: Asset[] = dbAssets.map((asset: any) => ({
        id: asset.assetId,
        name: asset.name,
        subsidiary: asset.subsidiary,
        category: asset.category,
        date: asset.date,
        val: asset.val,
        condition: asset.condition,
        conditionLevel: asset.conditionLevel,
        status: asset.status,
        statusLevel: asset.statusLevel,
        assetBook: asset.assetBook,
        serialNumber: asset.serialNumber,
        assetType: asset.assetType,
        prorateConvention: asset.prorateConvention,
        assetUnits: asset.assetUnits,
        categorySegment1: asset.categorySegment1,
        categorySegment2: asset.categorySegment2,
        categorySegment3: asset.categorySegment3,
        keySegment1: asset.keySegment1,
        keySegment2: asset.keySegment2,
        keySegment3: asset.keySegment3,
        amortizationStartDate: asset.amortizationStartDate,
        depreciationMethod: asset.depreciationMethod,
        lifeInMonths: asset.lifeInMonths,
        costClearingAccount1: asset.costClearingAccount1,
        costClearingAccount2: asset.costClearingAccount2,
        costClearingAccount3: asset.costClearingAccount3,
        costClearingAccount4: asset.costClearingAccount4,
        costClearingAccount5: asset.costClearingAccount5,
        costClearingAccount6: asset.costClearingAccount6,
        costClearingAccount7: asset.costClearingAccount7,
        costClearingAccount8: asset.costClearingAccount8,
        listed: asset.listed,
        listedStatus: asset.listedStatus,
        assetNumber: asset.assetNumber,
        assetDescription: asset.assetDescription,
        assetCost: asset.assetCost,
        datePlacedInService: asset.datePlacedInService,
      }));

      mappedAssets.sort((a, b) => b.id.localeCompare(a.id));
      setAssets(mappedAssets);
    } catch (error) {
      console.error("Error fetching assets: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAssets();
      } else {
        setAssets([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addAsset = async (asset: Asset) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          assetId: asset.id,
          name: asset.name,
          subsidiary: asset.subsidiary,
          category: asset.category,
          date: asset.date,
          val: asset.val,
          condition: asset.condition,
          conditionLevel: asset.conditionLevel,
          status: asset.status,
          statusLevel: asset.statusLevel,
          assetBook: asset.assetBook,
          serialNumber: asset.serialNumber,
          assetType: asset.assetType,
          prorateConvention: asset.prorateConvention,
          assetUnits: asset.assetUnits,
          categorySegment1: asset.categorySegment1,
          categorySegment2: asset.categorySegment2,
          categorySegment3: asset.categorySegment3,
          keySegment1: asset.keySegment1,
          keySegment2: asset.keySegment2,
          keySegment3: asset.keySegment3,
          amortizationStartDate: asset.amortizationStartDate,
          depreciationMethod: asset.depreciationMethod,
          lifeInMonths: asset.lifeInMonths,
          costClearingAccount1: asset.costClearingAccount1,
          costClearingAccount2: asset.costClearingAccount2,
          costClearingAccount3: asset.costClearingAccount3,
          costClearingAccount4: asset.costClearingAccount4,
          costClearingAccount5: asset.costClearingAccount5,
          costClearingAccount6: asset.costClearingAccount6,
          costClearingAccount7: asset.costClearingAccount7,
          costClearingAccount8: asset.costClearingAccount8,
          listed: asset.listed,
          listedStatus: asset.listedStatus,
          assetNumber: asset.assetNumber,
          assetDescription: asset.assetDescription,
          assetCost: asset.assetCost,
          datePlacedInService: asset.datePlacedInService,
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Network response was not ok');
      }
      const result = await response.json();
      await fetchAssets();
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  };

  const addAssetsBulk = async (newAssetsData: Asset[]) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // Generate IDs for new assets
      const itemsToInsert = newAssetsData.map(asset => ({
        assetId: asset.id,
        name: asset.name,
        subsidiary: asset.subsidiary,
        category: asset.category,
        date: asset.date,
        val: asset.val,
        condition: asset.condition,
        conditionLevel: asset.conditionLevel,
        status: asset.status,
        statusLevel: asset.statusLevel,
        assetBook: asset.assetBook,
        serialNumber: asset.serialNumber,
        assetType: asset.assetType,
        prorateConvention: asset.prorateConvention,
        assetUnits: asset.assetUnits,
        categorySegment1: asset.categorySegment1,
        categorySegment2: asset.categorySegment2,
        categorySegment3: asset.categorySegment3,
        keySegment1: asset.keySegment1,
        keySegment2: asset.keySegment2,
        keySegment3: asset.keySegment3,
        amortizationStartDate: asset.amortizationStartDate,
        depreciationMethod: asset.depreciationMethod,
        lifeInMonths: asset.lifeInMonths,
        costClearingAccount1: asset.costClearingAccount1,
        costClearingAccount2: asset.costClearingAccount2,
        costClearingAccount3: asset.costClearingAccount3,
        costClearingAccount4: asset.costClearingAccount4,
        costClearingAccount5: asset.costClearingAccount5,
        costClearingAccount6: asset.costClearingAccount6,
        costClearingAccount7: asset.costClearingAccount7,
        costClearingAccount8: asset.costClearingAccount8,
        listed: asset.listed,
        listedStatus: asset.listedStatus,
        assetNumber: asset.assetNumber,
        assetDescription: asset.assetDescription,
        assetCost: asset.assetCost,
        datePlacedInService: asset.datePlacedInService,
      }));

      const response = await fetch('/api/assets/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          assets: itemsToInsert
        })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Network response was not ok');
      }
      const result = await response.json();
      await fetchAssets();
    } catch (e) {
      console.error("Error bulk adding documents: ", e);
      throw e;
    }
  };

  const updateAsset = async (id: string, assetUpdates: Partial<Asset>) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload: any = { ...assetUpdates };
      if (assetUpdates.id) payload.assetId = assetUpdates.id;
      
      const response = await fetch(`/api/assets/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Network response was not ok');
      }
      fetchAssets();
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/assets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error("Error deleting document: ", e);
      throw e;
    }
  };

  return (
    <AssetContext.Provider value={{ assets, addAsset, addAssetsBulk, updateAsset, deleteAsset, isAddModalOpen, setIsAddModalOpen, isLoading }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAsset() {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
}

