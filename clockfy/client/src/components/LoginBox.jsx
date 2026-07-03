import { ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function LoginBox() {
  const { users, login, loading } = useApp();
  const [loginId, setLoginId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const admins = users.filter((user) => user.role === 'admin');
  const team = users.filter((user) => user.role !== 'admin');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await login({ loginId, password });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="loginScreen">
      <section className="loginBox">
        <div className="loginBrand">
          <div className="logoMark">C</div>
          <strong>clockify</strong>
        </div>
        <h1>Workspace login</h1>
        <p>Admin creates users. Users track time, and super-users can manage tasks and time.</p>
        <form className="loginForm" onSubmit={submit}>
          <label>Login ID<input value={loginId} onChange={(event) => setLoginId(event.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <strong className="loginError">{error}</strong>}
          <button disabled={loading}>Sign in</button>
        </form>
        <div className="credentialHints">
          <span><ShieldCheck size={17} /> Admin</span>
          {admins.map((user) => <button key={user.id} onClick={() => { setLoginId(user.loginId); setPassword(user.password || ''); }}><i style={{ background: user.color }} /> {user.loginId}</button>)}
          <span><UserRound size={17} /> Users</span>
          {team.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                setLoginId(user.loginId);
                setPassword(user.password || '');
              }}
            >
              <i style={{ background: user.color }} /> {user.loginId}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
