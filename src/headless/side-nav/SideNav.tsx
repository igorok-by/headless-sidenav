import * as React from 'react';
import { composeHandlers } from '../../utils/compose';

export type Variant = 'wide' | 'narrow' | 'mobile';

export type SideNavProps = React.ComponentPropsWithoutRef<'nav'> & {
  selectedKey?: React.Key;
  onSelect?: (key: React.Key) => void;

  // controlled/uncontrolled для ширины (wide/narrow)
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (v: boolean) => void;

  // controlled/uncontrolled для мобильной панели
  mobileOpen?: boolean;
  defaultMobileOpen?: boolean;
  onMobileOpenChange?: (v: boolean) => void;

  // для desktop vs mobile
  breakpoint?: string; // '(min-width: 768px)'
  ariaLabel?: string;

  // является ли submenu родителем выбранного маршрута?
  isParentOfSelected?: (submenuKey: React.Key, selectedKey?: React.Key) => boolean;
};

// Контекст для доступа к состоянию SideNav во всех дочерних компонентах
type RootCtx = {
  selectedKey?: React.Key;
  onSelect?: (key: React.Key) => void;

  variant: Variant; // текущий режим UI (зависит от брейкпоинта и expanded)
  expanded: boolean;
  setExpanded: (v: boolean) => void;

  mobileOpen: boolean; // открыта ли мобильная панель
  setMobileOpen: (v: boolean) => void;

  // аккордеон корневых submenu: открыт только один
  openKey: React.Key | null;
  isOpen: (k: React.Key) => boolean;
  openOnly: (k: React.Key | null, opts?: { manual?: boolean }) => void;
  toggleOne: (k: React.Key) => void;
  manualOpen: boolean; // пользователь вручную раскрывал/скрывал
  setManualOpen: (v: boolean) => void;

  // hover для narrow
  hoverKey: React.Key | null;
  setHoverKey: (k: React.Key | null) => void;
  scheduleCloseIfNoHover: (forKey: React.Key) => void;
  cancelHoverClose: () => void;

  isParentOfSelected: (submenuKey: React.Key, selectedKey?: React.Key) => boolean;
};

const RootContext = React.createContext<RootCtx | null>(null);
const useRoot = () => {
  const ctx = React.useContext(RootContext);
  if (!ctx) throw new Error('SideNav.* must be used within <SideNav>');
  return ctx;
};

const LevelContext = React.createContext<string | null>(null);

/* ------------------------------ Root ------------------------------ */

// Базовая проверка "ветка активна", используется для подсветки родителя
const defaultIsParent = (submenuKey: React.Key, selectedKey?: React.Key) => {
  if (selectedKey == null) return false;
  const p = `${submenuKey}`;
  const s = `${selectedKey}`;
  return s === p || s.startsWith(p + '/');
};

const SideNavRoot = React.forwardRef<HTMLElement, SideNavProps>(function SideNav(
  {
    selectedKey,
    onSelect,
    expanded: controlledExpanded,
    defaultExpanded = true,
    onExpandedChange,
    mobileOpen: cMobileOpen,
    defaultMobileOpen = false,
    onMobileOpenChange,
    breakpoint = '(min-width: 768px)',
    ariaLabel = 'Main navigation',
    isParentOfSelected = defaultIsParent,
    children,
    ...rest
  },
  ref
) {
  // Определяем desktop/mobile по media-query (listen + cleanup)
  const [isDesktop, setDesktop] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.(breakpoint).matches ?? true;
  });

  React.useEffect(() => {
    const windowMatchMedia = window.matchMedia?.(breakpoint);
    const onChange = () => setDesktop(windowMatchMedia.matches);

    windowMatchMedia?.addEventListener?.('change', onChange);

    return () => windowMatchMedia?.removeEventListener?.('change', onChange);
  }, [breakpoint]);

  // controlled/uncontrolled для expanded (desktop)
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
  const expanded = controlledExpanded ?? uncontrolledExpanded;
  const setExpanded = (v: boolean) =>
    onExpandedChange ? onExpandedChange(v) : setUncontrolledExpanded(v);

  // controlled/uncontrolled для mobileOpen (раскрытие панели)
  const [uncontrolledMobileOpen, setUncontrolledMobileOpen] = React.useState(defaultMobileOpen);
  const mobileOpen = cMobileOpen ?? uncontrolledMobileOpen;
  const setMobileOpen = (v: boolean) =>
    onMobileOpenChange ? onMobileOpenChange(v) : setUncontrolledMobileOpen(v);

  // Вычисляем текущий вариант UI (wide/narrow на desktop, либо mobile)
  const variant: Variant = isDesktop ? (expanded ? 'wide' : 'narrow') : 'mobile';

  // Аккордеон: храним ключ единственного открытого submenu
  const [openKey, setOpenKey] = React.useState<React.Key | null>(null);
  const isOpen = React.useCallback((k: React.Key) => openKey === k, [openKey]);
  const [manualOpen, setManualOpen] = React.useState(false);

  // Принудительно открыть только один (или закрыть все), с пометкой manual
  const openOnly = React.useCallback((k: React.Key | null, opts?: { manual?: boolean }) => {
    setOpenKey(k);
    if (opts?.manual) setManualOpen(true);
  }, []);
  const toggleOne = React.useCallback((k: React.Key) => {
    openOnly(openKey === k ? null : k, { manual: true });
  }, [openKey, openOnly]);

  // Если сменился выбранный маршрут — сбрасываем manual (чтобы снова работало авто-раскрытие на desktop)
  const prevSel = React.useRef(selectedKey);
  React.useEffect(() => {
    if (prevSel.current !== selectedKey) {
      setManualOpen(false);
      prevSel.current = selectedKey;
    }
  }, [selectedKey]);

  // Управление hover-закрытием (для narrow): небольшой таймаут, чтобы успеть "перескочить" курсором
  const [hoverKey, setHoverKeyState] = React.useState<React.Key | null>(null);
  const hoverKeyRef = React.useRef<React.Key | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);

  const cancelHoverClose = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const setHoverKey = React.useCallback((k: React.Key | null) => {
    hoverKeyRef.current = k;
    setHoverKeyState(k);

    if (k !== null) cancelHoverClose();
  }, [cancelHoverClose]);

  const scheduleCloseIfNoHover = React.useCallback((forKey: React.Key) => {
    if (variant !== 'narrow') return; // только для узкого режима

    cancelHoverClose();

    closeTimerRef.current = window.setTimeout(() => {
      // Закрываем, если курсора нет ни на триггере, ни на поповере
      if (hoverKeyRef.current == null && openKey === forKey) {
        openOnly(null, { manual: true });
      }
    }, 100);
  }, [variant, openKey, openOnly, cancelHoverClose]);

  // Собираем контекст (мемо, чтобы не дёргать лишние рендеры)
  const ctx: RootCtx = React.useMemo(() => ({
    selectedKey,
    onSelect,
    variant,
    expanded,
    setExpanded,
    mobileOpen,
    setMobileOpen,
    openKey,
    isOpen,
    openOnly,
    toggleOne,
    manualOpen,
    setManualOpen,
    hoverKey,
    setHoverKey,
    scheduleCloseIfNoHover,
    cancelHoverClose,
    isParentOfSelected,
  }), [
    selectedKey,
    onSelect,
    variant,
    expanded,
    mobileOpen,
    openKey,
    isOpen,
    openOnly,
    toggleOne,
    manualOpen,
    hoverKey,
    setHoverKey,
    scheduleCloseIfNoHover,
    cancelHoverClose,
    isParentOfSelected
  ]);

  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label={ariaLabel}
      data-variant={variant}
      data-expanded={expanded || undefined}
      data-mobile-open={variant === 'mobile' && mobileOpen ? '' : undefined}
      {...rest}
    >
      <RootContext.Provider value={ctx}>
        <LevelContext.Provider value="root">{children}</LevelContext.Provider>

        {/* Прозрачный оверлей для mobile: клик вне панели закрывает меню */}
        {variant === 'mobile' && mobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            data-mobile-overlay
            onClick={() => {
              setMobileOpen(false);
              openOnly(null, { manual: true }); // заодно схлопываем аккордеон
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'transparent',
              border: 0,
              padding: 0,
              margin: 0,
              zIndex: 9998, // ниже чем сама панель
            }}
          />
        )}
      </RootContext.Provider>
    </nav>
  );
});
SideNavRoot.displayName = 'SideNav';

/* ------------------------------ Item ------------------------------ */

export type ItemProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'onSelect'> & {
  itemKey: React.Key;
  asChild?: boolean;
  children: React.ReactNode;
};

const Item = React.forwardRef<HTMLButtonElement, ItemProps>(function Item(
  { itemKey, asChild, onClick, children, ...rest },
  ref
) {
  const { selectedKey, onSelect, variant, setMobileOpen, openOnly } = useRoot();
  const isActive = selectedKey === itemKey;

  // на выбор пункта: сообщаем наружу, закрываем аккордеон и мобильную панель
  const selectAndClose = () => {
    onSelect?.(itemKey);
    openOnly(null, { manual: true });
    if (variant === 'mobile') setMobileOpen(false);
  };

  // тут важен порядок: сначала своя функция, затем — потребителя (NavLink)
  const handleClick: React.MouseEventHandler<any> = (e) => {
    selectAndClose();
    (onClick as any)?.(e);
  };

  const injected = {
    role: 'treeitem',
    'aria-current': isActive ? 'page' : undefined,
    'data-active': isActive || undefined,
    onClick: handleClick,
  } as const;

  if (asChild) {
    return React.cloneElement(React.Children.only(children) as any, injected);
  }

  return <button ref={ref} tabIndex={0} {...injected} {...rest}>{children}</button>;
});
Item.displayName = 'SideNav.Item';

/* ---------------------------- Submenu ---------------------------- */

// Контекст одного сабменю (ключ, открыт ли сейчас, связь с родителем)
const SubCtx = React.createContext<{
  itemKey: React.Key;
  open: boolean;
  setOpen: (v: boolean) => void;
  id: string;
  parentActive: boolean;
} | null>(null);
const useSub = () => {
  const ctx = React.useContext(SubCtx);

  if (!ctx) throw new Error('SideNav.Submenu.* must be inside <SideNav.Submenu>');
  
  return ctx;
};

export type SubmenuProps = {
  itemKey: React.Key;
  defaultOpen?: boolean; // открыть по умолчанию (только desktop)
  controlledOpen?: boolean; // controlled режим
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
};

const SubmenuRoot = ({
  itemKey,
  defaultOpen,
  controlledOpen,
  onOpenChange,
  children,
}: SubmenuProps) => {
  const {
    isOpen,
    openOnly,
    selectedKey,
    isParentOfSelected,
    openKey,
    manualOpen,
    variant,
  } = useRoot();

  const parentActive = isParentOfSelected(itemKey, selectedKey); // родитель активной ветки?
  const isAccordionOpen = isOpen(itemKey);
  const open = typeof controlledOpen === 'boolean' ? controlledOpen : isAccordionOpen;

  // Меняем открытость в неконтролируемом режиме через состояние аккордеона
  const setOpen = (v: boolean) => {
    if (typeof controlledOpen === 'boolean') return onOpenChange?.(v);

    openOnly(v ? itemKey : null, { manual: true });
  };

  // Автооткрытие по умолчанию и по активной ветке (для desktop)
  React.useEffect(() => {
    if (variant !== 'mobile' && defaultOpen && openKey == null) {
      openOnly(itemKey, { manual: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (variant !== 'mobile' && !manualOpen && parentActive && !isAccordionOpen) {
      openOnly(itemKey, { manual: false });
    }
  }, [variant, manualOpen, parentActive, isAccordionOpen, itemKey, openOnly]);

  const id = React.useId();

  return (
    <SubCtx.Provider value={{ itemKey, open, setOpen, id, parentActive }}>
      <LevelContext.Provider value={String(itemKey)}>{children}</LevelContext.Provider>
    </SubCtx.Provider>
  );
};
SubmenuRoot.displayName = 'SideNav.Submenu';

/* ---------------------------- SubmenuTrigger ---------------------------- */

export type SubmenuTriggerProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'onSelect'> & {
  asChild?: boolean;
  children: React.ReactNode;
};

const SubmenuTrigger = React.forwardRef<HTMLButtonElement, SubmenuTriggerProps>(function SubmenuTrigger(
  { asChild, onClick, onMouseEnter, onMouseLeave, children, ...rest },
  ref
) {
  const {
    variant,
    setMobileOpen,
    setHoverKey,
    scheduleCloseIfNoHover,
    openOnly,
    openKey,
  } = useRoot();
  const { open, setOpen, id, parentActive, itemKey } = useSub();

  // Открыть/закрыть: на мобиле - панель, десктоп - аккордеон
  const setBoth = (next: boolean) => {
    if (variant === 'mobile') setMobileOpen(next);

    setOpen(next);
  };

  const handleClick = composeHandlers(onClick as any, () => setBoth(!open));

  // Hover-раскрытие (для narrow)
  const handleMouseEnter = composeHandlers(onMouseEnter as any, () => {
    if (variant !== 'narrow') return;

    setHoverKey(itemKey);

    if (openKey !== itemKey) {
      openOnly(itemKey, { manual: true });
    }
  });
  const handleMouseLeave = composeHandlers(onMouseLeave as any, () => {
    if (variant !== 'narrow') return;

    setHoverKey(null);
    scheduleCloseIfNoHover(itemKey);
  });

  const injected = {
    'aria-expanded': open,
    'aria-controls': `submenu-${id}`,
    'data-open': open || undefined, // для стилизации (Tailwind data-classes)
    'data-current-branch': parentActive || undefined, // родитель активной ветки
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  } as const;

  if (asChild) {
    return React.cloneElement(React.Children.only(children) as any, injected);
  }

  return <button ref={ref} {...injected} {...rest}>{children}</button>;
});
SubmenuTrigger.displayName = 'SideNav.Submenu.Trigger';

/* ---------------------------- SubmenuContent ---------------------------- */

export type SubmenuContentProps = React.ComponentPropsWithoutRef<'ul'>;

const SubmenuContent = React.forwardRef<HTMLUListElement, SubmenuContentProps>(function SubmenuContent(
  { onMouseEnter, onMouseLeave, style, children, ...rest },
  ref
) {
  const { variant, setHoverKey, scheduleCloseIfNoHover } = useRoot();
  const { open, id, itemKey } = useSub();

  // показываем по open;
  // в mobile стилизуется как панель (через классы у потребителя)
  const node = (
    <ul
      id={`submenu-${id}`}
      role="group"
      hidden={!open}
      data-open={open || undefined}
      data-variant={variant}
      ref={ref}
      {...rest}
      style={{ ...(style || {}) }}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        if (variant === 'narrow') setHoverKey(itemKey);
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        if (variant === 'narrow') {
          setHoverKey(null);
          scheduleCloseIfNoHover(itemKey);
        }
      }}
    >
      {children}
    </ul>
  );

  return node;
});
SubmenuContent.displayName = 'SideNav.Submenu.Content';

/* ------------------------------ Toggle ------------------------------ */

// Кнопка "переключить ширину панели" (desktop)
export type ToggleProps = React.ComponentPropsWithoutRef<'button'>;

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { onClick, children = 'Toggle', ...rest },
  ref
) {
  const { expanded, setExpanded } = useRoot();

  const injected = {
    onClick: composeHandlers(onClick as any, () => setExpanded(!expanded)),
  } as const;

  return <button ref={ref} {...injected} {...rest}>{children}</button>;
});
Toggle.displayName = 'SideNav.Toggle';

/* ---------------------- dot-notation ---------------------- */

// Экспорт через dot-notation API
export type SideNavComponent = React.ForwardRefExoticComponent<
  SideNavProps & React.RefAttributes<HTMLElement>
> & {
  Item: typeof Item;
  Submenu: typeof SubmenuRoot & {
    Trigger: typeof SubmenuTrigger;
    Content: typeof SubmenuContent;
  };
  Toggle: typeof Toggle;
};

export const SideNav = SideNavRoot as SideNavComponent;
(SideNav as any).Item = Item;
(SideNav as any).Submenu = SubmenuRoot as any;
(SideNav.Submenu as any).Trigger = SubmenuTrigger;
(SideNav.Submenu as any).Content = SubmenuContent;
(SideNav as any).Toggle = Toggle;
