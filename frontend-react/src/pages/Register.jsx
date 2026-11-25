import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../shared/auth/authHooks';

const fieldClass = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2';

export default function Register() {
    const [registerUser, { isLoading: saving }] = useRegister();
    const [role, setRole] = useState('customer');
    const [registered, setRegistered] = useState(null);
    const [error, setError] = useState('');

    async function register(event) {
        event.preventDefault();
        if (saving) return;
        const fields = Object.fromEntries(new FormData(event.currentTarget));
        setError('');
        try {
            await registerUser({
                role,
                name: fields.name.trim(),
                email: fields.email.trim().toLowerCase(),
                password: fields.password,
                ...(fields.company ? { company: fields.company.trim() } : {}),
            }).unwrap();
            setRegistered(role);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10">
            <section className="mx-auto max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6">
                <h1 className="text-xl font-bold text-gray-900">Create a SwiftTrack account</h1>
                {registered ? (
                    <p role="status" className="text-sm text-emerald-700">{registered === 'customer' ? 'Your account is ready. You can sign in now.' : 'Your account is pending administrator approval.'}</p>
                ) : (
                    <form onSubmit={register} className="space-y-4 text-sm">
                        <label className="block space-y-1"><span>Account type</span><select className={fieldClass} value={role} onChange={event => setRole(event.target.value)}>
                            <option value="customer">Customer</option><option value="merchant">Merchant</option>
                        </select></label>
                        <label className="block space-y-1"><span>Name</span><input name="name" autoComplete="name" className={fieldClass} required /></label>
                        <label className="block space-y-1"><span>Email</span><input type="email" name="email" autoComplete="email" className={fieldClass} required /></label>
                        {role === 'merchant' && <label className="block space-y-1"><span>Company</span><input name="company" autoComplete="organization" className={fieldClass} required /></label>}
                        <label className="block space-y-1"><span>Password</span><input type="password" name="password" autoComplete="new-password" className={fieldClass} minLength={6} required /></label>
                        {error && <p role="alert" className="text-red-700">{error}</p>}
                        <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Creating account…' : 'Create account'}</button>
                    </form>
                )}
                <Link to="/login" className="inline-flex text-sm font-semibold text-orange-700">Back to sign in</Link>
            </section>
        </main>
    );
}
