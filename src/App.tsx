import * as React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Outlet } from 'react-router';
import type { User } from 'firebase/auth';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import type { Navigation, Authentication } from '@toolpad/core/AppProvider';
import { firebaseSignOut, signInWithGoogle, onAuthStateChanged } from './firebase/auth';
import SessionContext, { type Session } from './SessionContext';
import Logo from './assets/logo.webp';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'stocks',
    title: 'Stocks',
    icon: <ShowChartIcon />,
  },
  {
    segment: 'portfolio',
    title: 'Portfolio Management',
    icon: <AccountBalanceIcon />,
  },
  {
    segment: 'screener',
    title: 'Stock Screener',
    icon: <FilterListIcon />,
  },
];

const BRANDING = {
  title: 'MEFIC App',
  homeUrl: '/',
  logo: (<img src={Logo} alt="MEFIC Logo" style={{ maxWidth: '100%' }} />),
};

const AUTHENTICATION: Authentication = {
  signIn: signInWithGoogle,
  signOut: firebaseSignOut,
};

export default function App() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const sessionContextValue = React.useMemo(
    () => ({
      session,
      setSession,
      loading,
    }),
    [session, loading],
  );

  React.useEffect(() => {
    // Returns an `unsubscribe` function to be called during teardown
    const unsubscribe = onAuthStateChanged((user: User | null) => {
      if (user) {
        setSession({
          user: {
            name: user.displayName || '',
            email: user.email || '',
            image: user.photoURL || '',
          },
        });
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      session={session}
      authentication={AUTHENTICATION}
    >
      <SessionContext.Provider value={sessionContextValue}>
        <Outlet />
      </SessionContext.Provider>
    </ReactRouterAppProvider>
  );
}
