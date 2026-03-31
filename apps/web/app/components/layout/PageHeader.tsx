import { type ReactNode } from "react";

type PageHeaderProps = {
  lead: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function PageHeader({ lead, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2">{lead}</div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">{subtitle}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
