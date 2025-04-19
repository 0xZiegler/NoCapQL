import { renderProfile } from "./handlers.js";
import { displayError } from "./utils/utils.js";

export const API = {
    DATA_ENDPOINT: 'https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT: 'https://learn.zone01oujda.ma/api/auth/signin'
};

// Set up the login form and handle submission request
export async function loginAPI() {
    const form = document.getElementById("login-form");

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = form.username.value.trim();
        const password = form.password.value

        try {
            const encodedAuth = btoa(`${username}:${password}`);

            const response = await fetch(API.SIGNIN_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${encodedAuth}`
                }
            });

            const token = await response.json();

            if (token.error) throw token.error;

            localStorage.setItem('JWT', token);
            renderProfile();
        } catch (error) {
            displayError("login-error", error || "Login failed. Please try again.");
        }
    });
};

// GraphQL API service (GraphQL request)
export const graphQLRequest = async (query, token) => {
    try {
        const response = await fetch(API.DATA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` ,
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`Network error: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0]?.message || "GraphQL error");
        }

        return result;
    } catch (error) {
        console.error("GraphQL request failed:", error);
    }
};
