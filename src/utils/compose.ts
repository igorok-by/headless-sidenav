export function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

export function composeHandlers<T extends (...a: any[]) => any>(
  theirs?: T,
  ours?: T
) {
  return (...args: Parameters<T>) => {
    theirs?.(...args);

    const e = args[0];

    if (e
      && typeof e === 'object'
      && 'defaultPrevented' in e
      && (e as any).defaultPrevented
    ) return;

    ours?.(...args);
  };
}