export function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full px-[var(--gutter)] lg:px-[var(--gutter-lg)] pt-28 pb-14 text-center">
      <div className="mx-auto flex max-w-[var(--max-content)] flex-col items-center gap-2">
        <span className="font-display italic text-[1.25rem] leading-none text-[color-mix(in_srgb,var(--cosmos-text)_78%,transparent)]">
          Hiep Trong
        </span>
        <p className="text-[length:var(--fs-micro)] tracking-[var(--ls-support)] text-[color-mix(in_srgb,var(--cosmos-text-muted)_60%,transparent)]">
          Personal universe · {year}
        </p>
        <details className="mt-3 max-w-[var(--max-narrow)] text-[length:var(--fs-micro)] text-cosmos-text-muted">
          <summary className="cursor-pointer">Earth imagery credits</summary>
          <p className="mt-2">
            Earth textures by{' '}
            <a className="underline" href="https://www.solarsystemscope.com/textures/">
              Solar System Scope (INOVE)
            </a>
            , based on NASA imagery. Licensed under{' '}
            <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">
              CC BY 4.0
            </a>
            . Resized, converted and optimized. Globe lighting and rendering adapted for Hiep Trong
            Space.
          </p>
        </details>
      </div>
    </footer>
  );
}
