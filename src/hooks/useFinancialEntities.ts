import { useState, useEffect } from 'react';
import type { Entity } from '@/types/finance';

const STORAGE_KEY = 'financeiro_entities';

export function useFinancialEntities() {
  const [entities, setEntities] = useState<Entity[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
  }, [entities]);

  const addEntity = (e: Omit<Entity, 'id'>): Entity => {
    const newEntity: Entity = { ...e, id: crypto.randomUUID() };
    setEntities(prev => [...prev, newEntity]);
    return newEntity;
  };

  const updateEntity = (id: string, data: Partial<Entity>) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteEntity = (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
  };

  return { entities, addEntity, updateEntity, deleteEntity };
}
