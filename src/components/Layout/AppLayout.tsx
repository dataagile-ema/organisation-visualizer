import type { ReactNode } from 'react';
import type { OrgUnit } from '../../types';
import { ChevronRight, Building2 } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  breadcrumbs: OrgUnit[];
  onBreadcrumbClick: (unit: OrgUnit) => void;
}

export function AppLayout({ children, sidebar, breadcrumbs, onBreadcrumbClick }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-800">
              Organisationsöversikt
            </h1>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((unit, index) => (
              <div key={unit.id} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-slate-400 mx-1" />
                )}
                <button
                  onClick={() => onBreadcrumbClick(unit)}
                  className={`px-2 py-1 rounded hover:bg-slate-200 transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'font-medium text-blue-600'
                      : 'text-slate-600'
                  }`}
                >
                  {unit.name}
                </button>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 min-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Organisation
            </h2>
            {sidebar}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
