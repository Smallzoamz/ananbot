import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: { params: { scope: "identify guilds" } },
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            try {
                if (account) {
                    token.accessToken = account.access_token;
                    token.id = profile.id;
                }
                return token;
            } catch (err) {
                console.error("JWT Callback Error:", err);
                return token;
            }
        },
        async session({ session, token }) {
            try {
                session.accessToken = token.accessToken;
                session.user.id = token.id;
                return session;
            } catch (err) {
                console.error("Session Callback Error:", err);
                return session;
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/',
        error: '/',
    },
    debug: true, // Enable debug to see full error in console
};
