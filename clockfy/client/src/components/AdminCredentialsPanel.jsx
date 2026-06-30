import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function AdminCredentialsPanel() {
  const { users, updateUserPassword, deleteUser } = useApp();
  const [passwordEdits, setPasswordEdits] = useState({});
  const [panelError, setPanelError] = useState('');
  const normalUsers = users.filter((user) => user.role === 'user');

  async function savePassword(user) {
    setPanelError('');
    try {
      await updateUserPassword(user.id, passwordEdits[user.id] ?? user.password);
      setPasswordEdits((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    } catch (error) {
      setPanelError(error.message);
    }
  }

  async function removeUser(user) {
    setPanelError('');
    if (!window.confirm(`Remove ${user.name}? This will also remove this user's tracked time.`)) return;
    try {
      await deleteUser(user.id);
      setPasswordEdits((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    } catch (error) {
      setPanelError(error.message);
    }
  }

  return (
    <aside className="adminCredentials">
      <div className="adminCredentialsHead">
        <span><KeyRound size={15} /> User credentials</span>
        {panelError && <em>{panelError}</em>}
      </div>
      <div className="credentialTable">
        {normalUsers.map((user) => (
          <div className="credentialTableRow" key={user.id}>
            <span>{user.name}</span>
            <code>{user.loginId}</code>
            <input
              value={passwordEdits[user.id] ?? user.password ?? ''}
              onChange={(event) => setPasswordEdits({ ...passwordEdits, [user.id]: event.target.value })}
            />
            <div className="credentialActions">
              <button type="button" onClick={() => savePassword(user)}>Save</button>
              <button type="button" className="danger" onClick={() => removeUser(user)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
