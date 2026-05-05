'use client'

import { useState, useEffect } from 'react'
import { Client } from '../../data/types'
import { dbGetAllClients, dbUpsertClient, dbDeleteClient } from '../../lib/db'

const emptyClient = (): Omit<Client, 'createdAt' | 'updatedAt'> => ({
  id: `client-${Date.now()}`,
  name: '', phone: '', adresse: '', ville: '', codePostal: '', interphone: '',
})

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editClient, setEditClient] = useState<Omit<Client, 'createdAt' | 'updatedAt'> | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { setClients(await dbGetAllClients()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.adresse.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q)
  })

  const handleSave = async () => {
    if (!editClient) return
    setSaving(true)
    try {
      await dbUpsertClient(editClient)
      await load()
      setEditClient(null)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await dbDeleteClient(id)
      await load()
      setConfirmDelete(null)
    } catch (e) { console.error(e) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 12, padding: '10px 16px', alignItems: 'center',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>👥 Clients</span>
        <span style={{ fontSize: 13, color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 10px', borderRadius: 12 }}>
          {clients.length} client{clients.length !== 1 ? 's' : ''}
        </span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom, téléphone, adresse..."
          style={{
            flex: 1, padding: '7px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: 14,
          }}
        />
        <button onClick={() => setEditClient(emptyClient())} style={{
          padding: '7px 16px', borderRadius: 8, border: 'none',
          background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>+ Nouveau client</button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 40 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div>{search ? 'Aucun résultat' : 'Aucun client enregistré'}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Les clients sont ajoutés automatiquement lors des livraisons</div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Nom', 'Téléphone', 'Adresse', 'Ville', 'Code postal', 'Interphone', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{client.name || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--accent)', fontWeight: 600 }}>{client.phone || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{client.adresse || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{client.ville || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{client.codePostal || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{client.interphone || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditClient({ id: client.id, name: client.name, phone: client.phone, adresse: client.adresse, ville: client.ville, codePostal: client.codePostal, interphone: client.interphone })} style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                          background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 12,
                        }}>✏️ Modifier</button>
                        <button onClick={() => setConfirmDelete(client.id)} style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid var(--danger)',
                          background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: 12,
                        }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal édition */}
      {editClient && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setEditClient(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 28, width: 440,
            border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
              {clients.find(c => c.id === editClient.id) ? '✏️ Modifier le client' : '👤 Nouveau client'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Nom</label>
                  <input style={inputStyle} value={editClient.name} onChange={e => setEditClient({ ...editClient, name: e.target.value })} placeholder="Ex: Dupont" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Téléphone</label>
                  <input style={inputStyle} value={editClient.phone} onChange={e => setEditClient({ ...editClient, phone: e.target.value })} placeholder="Ex: 0612345678" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Adresse</label>
                <input style={inputStyle} value={editClient.adresse} onChange={e => setEditClient({ ...editClient, adresse: e.target.value })} placeholder="Ex: 12 rue de la Paix" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Ville</label>
                  <input style={inputStyle} value={editClient.ville} onChange={e => setEditClient({ ...editClient, ville: e.target.value })} placeholder="Ex: Paris" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Code postal</label>
                  <input style={inputStyle} value={editClient.codePostal} onChange={e => setEditClient({ ...editClient, codePostal: e.target.value })} placeholder="75001" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Interphone / Code d'accès</label>
                <input style={inputStyle} value={editClient.interphone} onChange={e => setEditClient({ ...editClient, interphone: e.target.value })} placeholder="Ex: B245" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditClient(null)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              }}>{saving ? 'Enregistrement...' : '✓ Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110,
        }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 360, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Supprimer ce client ?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Cette action est irréversible.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
