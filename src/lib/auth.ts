import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Twitter provider (only enabled if API keys are present)
    ...(process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET ? [
      TwitterProvider({
        clientId: process.env.TWITTER_API_KEY,
        clientSecret: process.env.TWITTER_API_SECRET,
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
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};