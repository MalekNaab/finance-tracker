import React, { useState, useEffect } from 'react';
import { Router as WouterRouter, Switch, Route } from 'wouter';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';
import { getSettings, saveSettings, seedInitialData } from './utils/storage';
import './styles/buttons.css';

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    seedInitialData();

    const stored = getSettings();
    const savedTheme = stored?.theme || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t) => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    const current = getSettings();
    saveSettings({ ...current, theme: newTheme });
  };

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <WouterRouter base={basePath}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/budgets" component={Budgets} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings">
            {() => <Settings onThemeChange={handleThemeChange} />}
          </Route>
          <Route>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Page not found</h2>
              <a href={basePath + '/'} style={{ color: 'hsl(var(--primary))' }}>Go back home</a>
            </div>
          </Route>
        </Switch>
      </Layout>
    </WouterRouter>
  );
}

export default App;
