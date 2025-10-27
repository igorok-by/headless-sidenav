# Headless Side Navigation · React 19 + Tailwind v4

[![Build & Deploy – GitHub Pages](https://img.shields.io/github/actions/workflow/status/YOUR_GH_USERNAME/headless-sidenav/deploy.yml?label=deploy)](https://github.com/YOUR_GH_USERNAME/headless-sidenav/actions)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#-лицензия)

> Headless-компонент бокового меню с **JSX-API**
> Поддержка режимов **wide**, **narrow**, **mobile**, интеграция с React Router.

**Live Demo:** 👉 https://igorok-by.github.io/headless-sidenav/

---

## ✨ Особенности

- **Headless UI**: логика и `data-*` атрибуты – внутри, стили – у потребителя.
- **JSX-нотация**: конфигурация только через компоненты, без JSON/JS-like объектов.
- **3 режима**:
  - **wide** – широкая панель с подписями;
  - **narrow** – узкая панель (иконки) + поповер субменю при hover/click;
  - **mobile** – панель снизу.
- **Аккордеон**: открыт ровно один корневой субменю.
- **Интеграция с Router**: `selectedKey` + `onSelect` → работает с `react-router-dom` (или любым внешним стейтом).
- **Tailwind v4 `data-*` классы**: `group-data-[variant=...]`, `data-[open]`, и т.п.

---

## 🧱 Стек

- React **19**
- TypeScript **5.9**
- Vite **7**
- Tailwind CSS **v4** (`@tailwindcss/vite`)
- React Router **7** (в демо — **HashRouter** для GitHub Pages)

---

## ⚙️ Установка и запуск

```bash
# Требуется Node 20.x
npm i
npm run dev       # локальная разработка
npm run build     # сборка в dist/
npm run preview   # предпросмотр сборки
npm run lint      # ESLint

```

---

## 🧩 Основные пропсы

```bash
<SideNav />
```
- selectedKey?: Key — текущий выбранный пункт.

- onSelect?: (key: Key) => void — колбэк выбора пункта.

- expanded?/defaultExpanded? + onExpandedChange? — управление wide/narrow.

- mobileOpen?/defaultMobileOpen? + onMobileOpenChange? — управление mobile sheet.

- breakpoint?: string — переключение desktop/mobile (по умолчанию '(min-width: 768px)').

- isParentOfSelected?(submenuKey, selectedKey) — логика «родитель активной ветки».


```bash
<SideNav.Item />
```
- itemKey: Key

- asChild?: boolean — проброс пропсов в дочерний элемент (например, NavLink).


```bash
<SideNav.Submenu /> + .Trigger + .Content
```
- itemKey: Key

- defaultOpen?/open?/onOpenChange? — управление открытием.

- Аккордеон: открыт ровно один корневой саб-меню.