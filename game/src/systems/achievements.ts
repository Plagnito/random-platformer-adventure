// Succès V0 (6). Stockés en local. Voir PLAN §3.13 pour les 80+.

export interface AchDef {
  id: string;
  name: string;
  desc: string;
}

export const ACH_DEFS: AchDef[] = [
  { id: 'dash', name: 'Ça glisse !', desc: 'Dasher pour la première fois' },
  { id: 'pogo', name: 'Ping !', desc: 'Pogoter sur un Bouftout' },
  { id: 'mort10', name: 'Persévérant', desc: 'Mourir 10 fois (le Conservateur prend des notes)' },
  { id: 'foudre', name: 'Foudre', desc: 'Atteindre le rang de style Foudre' },
  { id: 'fin', name: 'Spécimen en fuite', desc: 'Finir une run complète' },
  { id: 'daily', name: 'Lève-tôt', desc: 'Finir la daily du jour' },
];

export class AchSys {
  private set = new Set<string>();

  load(ids: string[]): void {
    this.set = new Set(ids);
  }
  ids(): string[] {
    return [...this.set];
  }
  unlock(id: string): AchDef | null {
    if (this.set.has(id)) return null;
    const d = ACH_DEFS.find((a) => a.id === id) ?? null;
    if (d) this.set.add(id);
    return d;
  }
}
