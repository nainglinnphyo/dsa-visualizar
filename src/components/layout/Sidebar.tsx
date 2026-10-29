import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV_SECTIONS } from '@/app/navigation';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { cn } from '@/lib/cn';

interface SidebarProps {
  /** Mobile drawer state. On desktop the sidebar is always visible. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <nav
        aria-label="Main"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col border-r border-line bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-4">
          <NavLink to="/" className="flex items-center gap-2" onClick={onClose}>
            <span className="flex items-end gap-[2px]" aria-hidden>
              <span className="h-2.5 w-1 rounded-sm bg-accent" />
              <span className="h-4 w-1 rounded-sm bg-cyan" />
              <span className="h-5.5 w-1 rounded-sm bg-violet" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              DSA Visualizer
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon lg:hidden"
            aria-label="Close navigation"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading} className="mb-4 last:mb-0">
              <p className="panel-title px-2 pb-1.5">{section.heading}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/dashboard'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors',
                          isActive
                            ? 'bg-surface-3 font-medium text-ink'
                            : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={15}
                            aria-hidden
                            className={isActive ? 'text-accent' : 'text-ink-dim'}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="panel-title mb-1.5">Theme</p>
          <ThemeToggle size="full" className="w-full" />
        </div>

        <div className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-dim">
          <p className="mb-1 font-medium text-ink-soft">Keyboard</p>
          <p>
            <kbd className="chip">Space</kbd> play · <kbd className="chip">←</kbd>
            <kbd className="chip">→</kbd> step · <kbd className="chip">R</kbd> reset
          </p>
        </div>
      </nav>
    </>
  );
}
