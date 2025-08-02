import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  // Temporarily disable database adapter while fixing Supabase connectivity
  // adapter: PrismaAdapter(prisma),
  providers: [
    // Twitter provider (only enabled if OAuth 2.0 credentials are present)
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        version: '2.0',
        authorization: {
          params: {
            scope: 'tweet.read users.read bookmark.read offline.access',
          },
        },
        httpOptions: {
          timeout: 10000,
        },
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
  pages: {
    error: '/auth/error', // Custom error page for rate limiting
  },
};