"use client";

import { useState } from "react";
import { supabase } from "../../utils/supabaseClient"

export default function LoginForm() {
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);

        const randomEmail = `${Math.random().toString(36).substring(7)}@example.com`;
        const randomPassword = "Password69420";

        const { data, error } = await supabase.auth.signUp({
            email: randomEmail,
            password: randomPassword
        });

        if (error) {
            console.error("Error:", error);
        } else {
            console.log("User created and login in:", data);
        }

        setLoading(false);
    };

    return (
        <button
            className="btn btn-primary"
            onClick={handleSignUp}
            disabled={loading}
        >
            {loading ? "Signing up..." : "Sign up with random email and password"}
        </button>
    );
}