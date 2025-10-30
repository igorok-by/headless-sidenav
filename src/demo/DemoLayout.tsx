import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppMenu } from './AppMenu';
import Page from './pages';

export function DemoLayout() {
  // wide/narrow в localStorage
  const [expanded, setExpanded] = React.useState<boolean>(() => {
    const s = localStorage.getItem('expanded');
    return s ? s === '1' : true;
  });

  React.useEffect(() => {
    localStorage.setItem('expanded', expanded ? '1' : '0');
  }, [expanded]);

  // панель mobile
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex">
      <AppMenu
        ariaLabel="Main"
        expanded={expanded}
        onExpandedChange={setExpanded}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      >
        <AppMenu.Item label="Home" to="/" icon='🏠' />

        <AppMenu.Group label="Clients" icon='👥'>
          <AppMenu.Item label="List" to="/clients/all" />
          <AppMenu.Item label="Reviews" to="/clients/reviews" />
          <AppMenu.Item label="Notifications" to="/clients/notifications" />
        </AppMenu.Group>

        <AppMenu.Group label="Reports" icon='📊'>
          <AppMenu.Item label="Daily" to="/reports/daily" />
          <AppMenu.Item label="Monthly" to="/reports/monthly" />
        </AppMenu.Group>
      </AppMenu>

      <main className="flex-1 min-h-screen bg-gray-50 pb-16">
        <Routes>
          <Route path="/" element={<Page title="Home" />} />
          <Route path="/clients/all" element={<Page title="Clients / List" />} />
          <Route path="/clients/reviews" element={<Page title="Clients / Reviews" />} />
          <Route path="/clients/notifications" element={<Page title="Clients / Notifications" />} />
          <Route path="/reports/daily" element={<Page title="Reports / Daily" />} />
          <Route path="/reports/monthly" element={<Page title="Reports / Monthly" />} />
        </Routes>
      </main>
    </div>
  );
}
