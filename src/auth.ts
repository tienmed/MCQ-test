import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    secret: process.env.AUTH_SECRET || "fallback_secret_for_trial_runs_only",
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnQuiz = nextUrl.pathname.startsWith('/quiz');
            if (isOnQuiz) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }
            return true;
        },
    }
});
