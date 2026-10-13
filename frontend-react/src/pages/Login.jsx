import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {API, Token} from '../services/api';

// import '../pages/Login.css'




export default function Login() {

    const navigate = useNavigate();
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try{
            const result = await API.auth.login(email, password);
            const token = result.data.token;
            const user = result.data.user;

            Token.set(token);
            localStorage.setItem("user",JSON.stringify(user));

            const routes = {
                super_user: "/admin/dashboard",
                admin: "/admin/dashboard",
                hub_manager: "/hub/dashboard",
                customer: "/customer/dashboard",
                merchant: "/merchant/dashboard",
                delivery_agent: "/agent/dashboard",
            };

            const destination = routes[user.role];
            if(destination){
                navigate(destination);
            }else{
                Token.clear();
                localStorage.removeItem("user");
                setError("no dsahboard set for this role");
            }

        }

        catch(err){
            setError(err.message || "login failed please try again later");
        }
        finally{
            setLoading(false);
        }
    }


    return (
        <div className ="login-page">
            <div className = "login-brand">
                <h1>SwiftTrack</h1>
                <h2>move smarter</h2>
                <h2>deliver better</h2>
                <p>manage shipments, dispatches, and deliveries in one place</p>
            </div>

            <div className = "login-form-section">
                <form className = "login-form" onSubmit = {handleSubmit}>
                    <h2>welcome back</h2>
                    <p>sign in to your account</p>

                    <label htmlFor='email'>Email</label>
                    <input
                    id = "email"
                    type='email'
                    value = {email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder='name@swiftTrack.com'
                    required
                    />


                    <label htmlFor="password">Password</label>
                    <input
                    id = "password"
                    type= "password"
                    value={password}
                    onChange={(event) =>setPassword(event.target.value)}
                    placeholder='Enter your password...'
                    required
                    />

                    {error && <p className="login-error">{error}</p>}

                    <button type = "submit" disabled = {loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}