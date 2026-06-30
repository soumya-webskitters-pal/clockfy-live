import { ChevronDown, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function AdminCredentialsPanel() {
  const { users, updateUserPassword, deleteUser } = useApp();
  const [passwordEdits, setPasswordEdits] = useState({});
  const [panelError, setPanelError] = useState('');
  const [openUsers, setOpenUsers] = useState({});
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
        {normalUsers.map((user) => {
          const isOpen = Boolean(openUsers[user.id]);
          return (
          <div className={`credentialTableRow ${isOpen ? 'open' : ''}`} key={user.id}>
            <button
              className="credentialAccordionButton"
              type="button"
              onClick={() => setOpenUsers((current) => ({ ...current, [user.id]: !current[user.id] }))}
              aria-expanded={isOpen}
            >
              <span>{user.name}</span>
              <code>{user.loginId}</code>
              <ChevronDown size={17} />
            </button>
            {isOpen && (
              <div className="credentialAccordionBody">
                <label>
                  Password
                  <input
                    value={passwordEdits[user.id] ?? user.password ?? ''}
                    onChange={(event) => setPasswordEdits({ ...passwordEdits, [user.id]: event.target.value })}
                  />
                </label>
                <div className="credentialActions">
                  <button type="button" onClick={() => savePassword(user)}>Save</button>
                  <button type="button" className="danger" onClick={() => removeUser(user)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        );})}
      </div>
    </aside>
  );
}
