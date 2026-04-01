/**
 * Types manuels alignés sur le schéma Supabase (compléter au fil des migrations).
 * Génération automatique possible plus tard : `supabase gen types typescript`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Ligne telle que retournée par `select *` sur `ventes_journalieres`. */
export type VentesJournalieresRow = {
  id: string
  client_id: string
  jour: string
  fiche_id: string
  quantite_vendue: number
  prix_vente_net: number
  created_at: string
}

/**
 * Insertion via le client Supabase.
 * `client_id` est renseigné côté base par le trigger si omis (recommandé : laisser la base le déduire de `fiche_id`).
 */
export type VentesJournalieresInsert = {
  id?: string
  client_id?: string
  jour: string
  fiche_id: string
  quantite_vendue: number
  prix_vente_net: number
  created_at?: string
}

export type VentesJournalieresUpdate = Partial<
  Omit<VentesJournalieresRow, 'id' | 'created_at'>
> & {
  id?: string
  created_at?: string
}

/** Sous-ensemble utile pour typage des réponses `.select(...)` ciblées. */
export type VentesJournalieresPreview = Pick<
  VentesJournalieresRow,
  'id' | 'jour' | 'fiche_id' | 'quantite_vendue' | 'prix_vente_net'
>

/** Mémorisation Lightspeed → fiche (`designation_norm` est généré côté base). */
export type MappingVentesRow = {
  id: string
  client_id: string
  designation_lightspeed: string
  fiche_id: string
  source_table: 'fiches' | 'fiches_bar'
  designation_norm: string
  created_at: string
  updated_at: string
}

export type MappingVentesInsert = {
  id?: string
  client_id: string
  designation_lightspeed: string
  fiche_id: string
  source_table: 'fiches' | 'fiches_bar'
  /** Rempli par trigger si omis */
  designation_norm?: string
  created_at?: string
  updated_at?: string
}

export type Database = {
  public: {
    Tables: {
      mapping_ventes: {
        Row: MappingVentesRow
        Insert: MappingVentesInsert
        Update: Partial<MappingVentesInsert>
        Relationships: [
          {
            foreignKeyName: 'mapping_ventes_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      ventes_journalieres: {
        Row: VentesJournalieresRow
        Insert: VentesJournalieresInsert
        Update: VentesJournalieresUpdate
        Relationships: [
          {
            foreignKeyName: 'ventes_journalieres_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ventes_journalieres_fiche_id_fkey'
            columns: ['fiche_id']
            referencedRelation: 'fiches'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type PublicTableName = keyof Database['public']['Tables']
