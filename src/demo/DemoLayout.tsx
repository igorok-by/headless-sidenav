import * as React from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SideNav } from '../headless/side-nav/SideNav';
import Page from './pages';
import { cn } from '../utils/compose';

export function DemoLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Сохраняем состояние wide/narrow между перезагрузками
  const [expanded, setExpanded] = React.useState<boolean>(() => {
    const s = localStorage.getItem('expanded');
    return s ? s === '1' : true;
  });
  React.useEffect(() => {
    localStorage.setItem('expanded', expanded ? '1' : '0');
  }, [expanded]);

  // открыта ли мобильная панель
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex">
      <SideNav
        ariaLabel="Main"
        selectedKey={pathname} // связываем выделение пункта с роутером
        onSelect={(key) => navigate(`${key}`)}
        expanded={expanded} // controlled expanded (desktop)
        onExpandedChange={setExpanded}
        mobileOpen={mobileOpen} // controlled панель (mobile)
        onMobileOpenChange={setMobileOpen}
        // базовые размеры и позиционирование панели в разных режимах
        className={cn(
          'group', // нужен для group-data-* в потомках
          'relative transition-[width] duration-200 bg-white border-r',
          // desktop widths
          'data-[variant=wide]:w-[var(--panel-w-wide)]',
          'data-[variant=narrow]:w-[var(--panel-w-narrow)]',
          // mobile: панель на ширину экрана
          'data-[variant=mobile]:fixed data-[variant=mobile]:inset-x-0 data-[variant=mobile]:bottom-0',
          'data-[variant=mobile]:w-full data-[variant=mobile]:h-16 data-[variant=mobile]:border-t data-[variant=mobile]:bg-white'
        )}
      >
        {/* Список корневых пунктов. На мобиле — горизонтальная панель внизу */}
        <ul
          className={cn(
            'p-2 space-y-1',
            // mobile bar — горизонтально и без вертикальных отступов
            'group-data-[variant=mobile]:p-0',
            'group-data-[variant=mobile]:space-y-0',
            'group-data-[variant=mobile]:h-full',
            'group-data-[variant=mobile]:flex',
            'group-data-[variant=mobile]:flex-row',
            'group-data-[variant=mobile]:items-stretch',
            'group-data-[variant=mobile]:justify-between',
            // список раскрыт — скрываем нижний бар
            'group-data-[mobile-open]:hidden'
          )}
        >
          {/* Home — простой пункт без подменю */}
          <li className="group-data-[variant=mobile]:flex-1 group-data-[variant=mobile]:flex group-data-[variant=mobile]:items-stretch">
            <SideNav.Item itemKey="/" asChild>
              <NavLink
                to="/"
                className={({ isActive }) => cn(baseItem, isActive && activeItem, mobileItem)}
              >
                <Icon>🏠</Icon>
                <LabelWide>Home</LabelWide>
                <LabelMobile>Home</LabelMobile>
              </NavLink>
            </SideNav.Item>
          </li>

          {/* Clients — пункт с подменю */}
          <li className="group-data-[variant=mobile]:flex-1 group-data-[variant=mobile]:flex group-data-[variant=mobile]:items-stretch group-data-[variant=narrow]:relative">
            <SideNav.Submenu itemKey="/clients">
              {/* Триггер: подсветка при открытии и если активна ветка */}
              <SideNav.Submenu.Trigger
                className={cn(
                  baseItem,
                  'data-[open]:text-blue-600 data-[open]:bg-blue-50',
                  'data-[current-branch]:text-blue-600 data-[current-branch]:bg-blue-50',
                  mobileItem
                )}
              >
                <Icon>👥</Icon>
                <LabelWide>Clients</LabelWide>
                <LabelMobile>Clients</LabelMobile>
              </SideNav.Submenu.Trigger>

              {/* Контент подменю:
                  - wide: обычный список
                  - narrow: поповер справа от пункта
                  - mobile: панель внизу */}
              <SideNav.Submenu.Content className={cn(...submenuContent)}>
                {/* Небольшой заголовок внутри sheet (только mobile) */}
                <li className="hidden group-data-[variant=mobile]:block sticky top-0 z-10" data-variant="mobile">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                    <h3 className="text-lg font-semibold">Clients</h3>
                  </div>
                </li>

                {/* Пункты подменю. По клику: навигация и закрытие sheet */}
                <li>
                  <SideNav.Item itemKey="/clients/all" asChild>
                    <NavLink to="/clients/all" className={subItem}>List</NavLink>
                  </SideNav.Item>
                </li>
                <li>
                  <SideNav.Item itemKey="/clients/reviews" asChild>
                    <NavLink to="/clients/reviews" className={subItem}>Reviews</NavLink>
                  </SideNav.Item>
                </li>
                <li>
                  <SideNav.Item itemKey="/clients/notifications" asChild>
                    <NavLink to="/clients/notifications" className={subItem}>Notifications</NavLink>
                  </SideNav.Item>
                </li>
              </SideNav.Submenu.Content>
            </SideNav.Submenu>
          </li>

          {/* Reports — второй пункт с подменю */}
          <li className="group-data-[variant=mobile]:flex-1 group-data-[variant=mobile]:flex group-data-[variant=mobile]:items-stretch group-data-[variant=narrow]:relative">
            <SideNav.Submenu itemKey="/reports">
              <SideNav.Submenu.Trigger
                className={cn(
                  baseItem,
                  'data-[open]:text-blue-600 data-[open]:bg-blue-50',
                  'data-[current-branch]:text-blue-600 data-[current-branch]:bg-blue-50',
                  mobileItem
                )}
              >
                <Icon>📊</Icon>
                <LabelWide>Reports</LabelWide>
                <LabelMobile>Reports</LabelMobile>
              </SideNav.Submenu.Trigger>

              <SideNav.Submenu.Content className={cn(...submenuContent)}>
                <li className="hidden group-data-[variant=mobile]:block sticky top-0 z-10" data-variant="mobile">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                    <h3 className="text-lg font-semibold">Reports</h3>
                  </div>
                </li>

                <li>
                  <SideNav.Item itemKey="/reports/daily" asChild>
                    <NavLink to="/reports/daily" className={subItem}>Daily</NavLink>
                  </SideNav.Item>
                </li>
                <li>
                  <SideNav.Item itemKey="/reports/monthly" asChild>
                    <NavLink to="/reports/monthly" className={subItem}>Monthly</NavLink>
                  </SideNav.Item>
                </li>
              </SideNav.Submenu.Content>
            </SideNav.Submenu>
          </li>
        </ul>

        {/* Кнопка смены режима панели narrow-wide (desktop) */}
        <div className="p-2 absolute bottom-0 bg-white z-10 hidden group-data-[variant=wide]:flex group-data-[variant=narrow]:flex group-data-[variant=narrow]:rotate-180 hover:cursor-pointer items-center gap-2">
          <SideNav.Toggle className="px-2 py-1 rounded border text-sm hover:cursor-pointer">
            &#706; {/* символ-стрелка */}
          </SideNav.Toggle>
        </div>
      </SideNav>

      {/* Контентная часть. На мобиле оставляем нижний отступ, чтобы бар не перекрывал контент */}
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

/* -------- visuals -------- */

// обертка иконки
function Icon(props: React.PropsWithChildren) {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-xs"
    >
      {props.children}
    </span>
  );
}

// текст только в wide (на узкой панели скрываем подписи)
function LabelWide(props: React.PropsWithChildren) {
  return (
    <span className="hidden group-data-[variant=wide]:inline" data-variant="wide">
      {props.children}
    </span>
  );
}

// подпись на мобиле (в нижнем баре)
function LabelMobile(props: React.PropsWithChildren) {
  return <span className="group-data-[variant=mobile]:block hidden">{props.children}</span>;
}

/* -------- class sets -------- */

// Базовый стиль пункта списка
const baseItem =
  'flex items-center gap-3 w-full rounded px-2 py-2 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors';

// Подсветка активного пункта
const activeItem = 'text-blue-600 bg-blue-50';

// Варианты для кнопок в нижнем мобильном баре
const mobileItem =
  'group-data-[variant=mobile]:rounded-none group-data-[variant=mobile]:px-1 group-data-[variant=mobile]:py-0 ' +
  'group-data-[variant=mobile]:flex-1 group-data-[variant=mobile]:flex group-data-[variant=mobile]:flex-col ' +
  'group-data-[variant=mobile]:items-center group-data-[variant=mobile]:justify-center group-data-[variant=mobile]:text-xs';

// Стиль для элементов подменю
const subItem =
  'block rounded px-4 py-3 hover:bg-gray-100 aria-[current=page]:text-blue-600 aria-[current=page]:bg-blue-50';

// Стиль для элементов контента
const submenuContent = [
  // wide: обычный столбец
  'space-y-1',
  // narrow: позиционируем как поповер
  'data-[variant=narrow]:absolute data-[variant=narrow]:left-full data-[variant=narrow]:top-0',
  'data-[variant=narrow]:z-50 data-[variant=narrow]:min-w-56',
  'data-[variant=narrow]:bg-white data-[variant=narrow]:border data-[variant=narrow]:rounded-md',
  'data-[variant=narrow]:shadow-lg data-[variant=narrow]:p-2 data-[variant=narrow]:ml-1',
  // mobile: фиксированная панель
  'data-[variant=mobile]:fixed data-[variant=mobile]:left-0 data-[variant=mobile]:right-0 data-[variant=mobile]:bottom-0',
  'data-[variant=mobile]:z-[9999] data-[variant=mobile]:rounded-t-2xl data-[variant=mobile]:border',
  'data-[variant=mobile]:bg-white data-[variant=mobile]:shadow-2xl data-[variant=mobile]:max-h-[60vh] data-[variant=mobile]:overflow-y-auto'
];

