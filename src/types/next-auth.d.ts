import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      googleAccessToken?: string | null;
      googleRefreshToken?: string | null;
      linkedProviders?: string[];
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }
}
