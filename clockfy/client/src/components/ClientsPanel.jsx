import { Building2, Pencil, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';

export default function ClientsPanel() {
  const { clients, createClient, updateClient, deleteClient } = useApp();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState('');
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await createClient({ name });
      setName('');
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(client) {
    setEditingId(client.id);
    setDraftName(client.name);
    setError('');
  }

  async function save(client) {
    setError('');
    try {
      await updateClient(client.id, { name: draftName });
      setEditingId('');
      setDraftName('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(client) {
    setError('');
    if (!window.confirm(`Delete ${client.name}?`)) return;
    try {
      await deleteClient(client.id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="clientsPanel">
      <div className="clientsHead">
        <div>
          <span><Building2 size={17} /> Clients</span>
          <h2>Client directory</h2>
        </div>
        <strong>{clients.length}</strong>
      </div>

      <form className="clientCreateForm" onSubmit={submit}>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Client name" />
        <Button><Building2 size={16} /> Add client</Button>
        {error && <em>{error}</em>}
      </form>

      <div className="clientsList">
        {clients.map((client) => {
          const isEditing = editingId === client.id;
          return (
            <div className="clientRow" key={client.id}>
              <Building2 size={17} />
              {isEditing ? (
                <input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
              ) : (
                <span>{client.name}</span>
              )}
              <small>{new Date(client.updatedAt).toLocaleDateString()}</small>
              {isEditing ? (
                <>
                  <button type="button" onClick={() => save(client)} title="Save client"><Save size={17} /></button>
                  <button type="button" onClick={() => setEditingId('')} title="Cancel"><X size={17} /></button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(client)} title="Edit client"><Pencil size={16} /></button>
                  <button type="button" className="danger" onClick={() => remove(client)} title="Delete client"><Trash2 size={16} /></button>
                </>
              )}
            </div>
          );
        })}
        {!clients.length && <div className="clientsEmpty">No clients yet</div>}
      </div>
    </section>
  );
}
