import * as React from 'react';
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SideNav } from '../headless/side-nav/SideNav';
import { cn } from '../utils/compose';

/**
 * AppMenu - обёртка над headless SideNav:
 * - берёт активный путь из Router, делает navigate по onSelect;
 * - на DESKTOP: клик по заголовку группы ведёт на firstTo только в wide;
 * - в narrow - открывает поповер; в mobile - нижняя панель
 * - текст в сабменю виден и в wide, и в narrow (через именованную группу 'group/submenu').
 */

/* ---------------- AppMenu root + Variant ---------------- */

type AppMenuRootProps = Omit<
  React.ComponentPropsWithoutRef<typeof SideNav>,
  'selectedKey' | 'onSelect'
>;

type Variant = 'wide' | 'narrow' | 'mobile';
const AppMenuCtx = React.createContext<{ variant: Variant }>({ variant: 'wide' });

function AppMenu(props: React.PropsWithChildren<AppMenuRootProps>) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { children, className, breakpoint = '(min-width: 768px)', expanded, ...rest } = props as any;

  // определяем desktop/mobile по breakpoint
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.(breakpoint).matches ?? true;
  });

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia?.(breakpoint);
    const onChange = () => setIsDesktop(mediaQueryList.matches);
    mediaQueryList?.addEventListener?.('change', onChange);
    return () => mediaQueryList?.removeEventListener?.('change', onChange);
  }, [breakpoint]);

  // вычисляем тот же variant, что и внутри SideNav (нужно для логики firstTo только в wide)
  const variant: Variant = isDesktop ? (expanded ? 'wide' : 'narrow') : 'mobile';

  const getIsParentOfSelected = (submenuKey: React.Key, selectedKey: React.Key) => {
    const base = String(submenuKey).replace(/\/+$/,'');   // "/clients"
    const sel  = String(selectedKey || '');               // "/clients/all"

    return !!matchPath({ path: `${base}/*`, end: false }, sel);
  }

  return (
    <AppMenuCtx.Provider value={{ variant }}>
      <SideNav
        selectedKey={pathname}
        onSelect={(key) => navigate(String(key))}
        breakpoint={breakpoint}
        expanded={expanded}
        isParentOfSelected={getIsParentOfSelected}
        className={cn(
          'group',
          'relative transition-[width] duration-200 bg-white border-r',
          // desktop widths
          'data-[variant=wide]:w-[var(--panel-w-wide)]',
          'data-[variant=narrow]:w-[var(--panel-w-narrow)]',
          // mobile bottom bar container
          'data-[variant=mobile]:fixed data-[variant=mobile]:inset-x-0 data-[variant=mobile]:bottom-0',
          'data-[variant=mobile]:w-full data-[variant=mobile]:h-16 data-[variant=mobile]:border-t data-[variant=mobile]:bg-white',
          className
        )}
        {...rest}
      >
        {/* Корневой список; на мобиле - панель внизу (когда открыто сабменю - скрываем) */}
        <ul
          className={cn(
            'p-2 space-y-1',
            'group-data-[variant=mobile]:p-0',
            'group-data-[variant=mobile]:space-y-0',
            'group-data-[variant=mobile]:h-full',
            'group-data-[variant=mobile]:flex',
            'group-data-[variant=mobile]:flex-row',
            'group-data-[variant=mobile]:items-stretch',
            'group-data-[variant=mobile]:justify-between',
            'group-data-[mobile-open]:hidden'
          )}
        >
          {children}
        </ul>

        {/* Кнопка смены wide/narrow (desktop) */}
        <div className="p-2 absolute bottom-0 bg-white z-10 hidden group-data-[variant=wide]:flex group-data-[variant=narrow]:flex group-data-[variant=narrow]:rotate-180 hover:cursor-pointer items-center gap-2">
          <SideNav.Toggle className="px-2 py-1 rounded border text-sm hover:cursor-pointer">
            &#706;
          </SideNav.Toggle>
        </div>
      </SideNav>
    </AppMenuCtx.Provider>
  );
}

/* ----------------- AppMenu.Item ----------------- */

type ItemProps = {
  label: React.ReactNode;
  to: string;
  icon?: React.ReactNode;
  className?: string;
};

/**
 * В корне: подпись видна в wide, скрыта в narrow/mobile
 * В сабменю: подпись видна в wide/narrow (через именованную группу 'group/submenu')
 * В mobile: подпись рендерим отдельным спаном для нижнего бара
 */
function AppMenuItem({ label, to, icon, className }: ItemProps) {
  return (
    <li className="group-data-[variant=mobile]:flex-1 group-data-[variant=mobile]:flex group-data-[variant=mobile]:items-stretch">
      <SideNav.Item itemKey={to} asChild>
        <NavLink
          to={to}
          className={({ isActive }) =>
            cn(
              baseItem,
              isActive && activeItem,
              mobileBarItem,
              submenuMobileOverrides,
              className
            )
          }
        >
          {icon && <Icon>{icon}</Icon>}
          {/* Подпись для элементов сабменю (wide/narrow) */}
          <span className="hidden group-data-[variant=wide]/submenu:inline group-data-[variant=narrow]/submenu:inline">
            {label}
          </span>

          {/* Подпись для mobile нижней панели */}
          <span className="group-data-[variant=mobile]:block hidden">{label}</span>
        </NavLink>
      </SideNav.Item>
    </li>
  );
}
(AppMenuItem as any).$$kind = 'AppMenu.Item';
AppMenuItem.displayName = 'AppMenu.Item';

/* ----------------- AppMenu.Group ----------------- */

type ItemEl = React.ReactElement<React.ComponentProps<typeof AppMenuItem>>;

const isAppMenuItemElement = (node: unknown): node is ItemEl => {
  return (
    React.isValidElement(node) &&
    (node.type === AppMenuItem || (node.type as any)?.$$kind === 'AppMenu.Item')
  );
};

const isElementWithChildren = (
  node: unknown
): node is React.ReactElement<{ children?: React.ReactNode }> => {
  return React.isValidElement(node);
};

type GroupProps = {
  label: React.ReactNode;
  icon?: React.ReactNode;
  firstTo?: string; // Куда вести по клику на заголовок группы (только wide)
  children: React.ReactNode;
};

// Возвращает путь первого дочернего <AppMenu.Item to="..."/>
const findFirstItemTo = (children: React.ReactNode): string | undefined => {
  for (const child of React.Children.toArray(children)) {
    if (isAppMenuItemElement(child)) {
      return child.props.to;
    }

    if (isElementWithChildren(child) && child.props?.children) {
      const nested = findFirstItemTo(child.props.children);

      if (nested) return nested;
    }
  }
  return undefined;
};


function AppMenuGroup({ label, icon, firstTo, children }: GroupProps) {
  const { variant } = React.useContext(AppMenuCtx);
  const navigate = useNavigate();
  
  // если firstTo не задан — вычисляем из детей
  const autoFirstTo = React.useMemo(
    () => firstTo ?? findFirstItemTo(children),
    [firstTo, children]
  );
  
  // в wide кликом по группе ведём на первый пункт
  const onGroupClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (variant === 'wide' && autoFirstTo) {
      e.preventDefault(); // остановим дефолт SideNav Toggle
      e.stopPropagation();
      
      navigate(autoFirstTo); // переходим на первый пункт
    }
  };
  
  const triggerClasses = cn(
    baseItem,
    'data-[open]:text-blue-600 data-[open]:bg-blue-50',
    'data-[current-branch]:text-blue-600 data-[current-branch]:bg-blue-50',
    mobileBarItem
  );

  return (
    <li className="
      group-data-[variant=mobile]:flex-1
      group-data-[variant=mobile]:flex
      group-data-[variant=mobile]:items-stretch
      group-data-[variant=narrow]:relative
    ">
      <SideNav.Submenu itemKey={`${label}`}>
        <SideNav.Submenu.Trigger className={triggerClasses} onClick={onGroupClick}>
          <Icon>{icon}</Icon>
          <span className="hidden group-data-[variant=wide]:inline" data-variant="wide">
            {label}
          </span>
          <span className="group-data-[variant=mobile]:block hidden">{label}</span>
        </SideNav.Submenu.Trigger>

        <SideNav.Submenu.Content
          className={cn(
            'group/submenu',
            'relative',
            // "прокладка" для наведения на поповер в narrow
            'data-[variant=narrow]:before:content-[""] data-[variant=narrow]:before:absolute',
            'data-[variant=narrow]:before:top-0 data-[variant=narrow]:before:bottom-0',
            'data-[variant=narrow]:before:-left-3 data-[variant=narrow]:before:w-3',
            'data-[variant=narrow]:before:bg-transparent data-[variant=narrow]:before:pointer-events-auto',
            'space-y-1',
            // narrow: поповер справа
            'data-[variant=narrow]:absolute data-[variant=narrow]:left-full data-[variant=narrow]:top-0',
            'data-[variant=narrow]:z-50 data-[variant=narrow]:min-w-56',
            'data-[variant=narrow]:bg-white data-[variant=narrow]:border data-[variant=narrow]:rounded-md',
            'data-[variant=narrow]:shadow-lg data-[variant=narrow]:p-2 data-[variant=narrow]:ml-1',
            // mobile: bottom-sheet
            'data-[variant=mobile]:fixed data-[variant=mobile]:left-0 data-[variant=mobile]:right-0 data-[variant=mobile]:bottom-0',
            'data-[variant=mobile]:z-[9999] data-[variant=mobile]:rounded-t-2xl data-[variant=mobile]:border',
            'data-[variant=mobile]:bg-white data-[variant=mobile]:shadow-2xl data-[variant=mobile]:max-h-[60vh] data-[variant=mobile]:overflow-y-auto'
          )}
        >
          {/* Заголовок только для мобильной панели */}
          <li className="hidden group-data-[variant=mobile]:block sticky top-0 z-10" data-variant="mobile">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
              <h3 className="text-lg font-semibold">{label}</h3>
            </div>
          </li>

          {children}
        </SideNav.Submenu.Content>
      </SideNav.Submenu>
    </li>
  );
}

AppMenuGroup.displayName = 'AppMenu.Group';

/* ------------- экспорт dot-notation ------------- */

type AppMenuComponent = React.FC<React.PropsWithChildren<AppMenuRootProps>> & {
  Item: typeof AppMenuItem;
  Group: typeof AppMenuGroup;
};

const _AppMenu = AppMenu as unknown as AppMenuComponent;
(_AppMenu as any).Item = AppMenuItem;
(_AppMenu as any).Group = AppMenuGroup;

export { _AppMenu as AppMenu };

/* ------- visuals & classes ------- */

function Icon({ children }: React.PropsWithChildren) {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-xs"
    >
      {children}
    </span>
  );
}

const baseItem =
  'flex items-center gap-3 w-full rounded px-2 py-2 outline-none hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors';
const activeItem = 'text-blue-600 bg-blue-50';
const mobileBarItem =
  'group-data-[variant=mobile]:rounded-none group-data-[variant=mobile]:px-1 group-data-[variant=mobile]:py-0 ' +
  'group-data-[variant=mobile]:flex-1 group-data-[variant=mobile]:flex group-data-[variant=mobile]:flex-col ' +
  'group-data-[variant=mobile]:items-center group-data-[variant=mobile]:justify-center group-data-[variant=mobile]:text-xs';
const submenuMobileOverrides =
  'group-data-[variant=mobile]/submenu:rounded group-data-[variant=mobile]/submenu:px-4 group-data-[variant=mobile]/submenu:py-3 ' +
  'group-data-[variant=mobile]/submenu:flex-none group-data-[variant=mobile]/submenu:flex-row ' +
  'group-data-[variant=mobile]/submenu:items-start group-data-[variant=mobile]/submenu:justify-start ' +
  'group-data-[variant=mobile]/submenu:text-base';
