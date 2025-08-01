import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  // Only use database adapter for Twitter auth, not for demo auth
  ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? {
    adapter: PrismaAdapter(prisma)
  } : {}),
  providers: [
    // Twitter provider (only enabled if OAuth 2.0 credentials are present)
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        version: '2.0',
      })
    ] : []),
    
    // Local development provider
    CredentialsProvider({
      id: 'demo',
      name: 'Demo User',
      credentials: {},
      async authorize() {
        // For local development, create a demo user
        return {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
};