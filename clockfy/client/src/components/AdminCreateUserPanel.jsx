import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function AdminCreateUserPanel() {
  const { createUser } = useApp();
  const [newUser, setNewUser] = useState({ name: '' });
  const [createdCredential, setCreatedCredential] = useState(null);
  const [createError, setCreateError] = useState('');

  async function submitUser(event) {
    event.preventDefault();
    setCreateError('');
    setCreatedCredential(null);
    try {
      const result = await createUser(newUser);
      setCreatedCredential(result.credential);
      setNewUser({ name: '' });
    } catch (error) {
      setCreateError(error.message);
    }
  }

  return (
    <aside className="adminCreateUserPanel">
      <div className="panelTitle">
        <h2>Create user</h2>
        <UserPlus size={17} />
      </div>
      <form className="sideCreateUserForm" onSubmit={submitUser}>
        <label>
          Full name
          <input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} placeholder="New user name" />
        </label>
        <button>Add user</button>
        {createError && <em>{createError}</em>}
        {createdCredential && <em>Login · {createdCredential.loginId} / {createdCredential.password}</em>}
      </form>
    </aside>
  );
}
