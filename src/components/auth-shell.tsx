import Link from "next/link";
import { TrendingUp, CheckCircle2 } from "lucide-react";

export const authInputCls =
  "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

const FEATURES = [
  "Data-driven tips across 10+ top leagues",
  "Premium in-depth match analysis",
  "Secure payments powered by Paystack",
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-pitch relative hidden flex-col justify-between p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <TrendingUp className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Goal<span className="text-emerald-400">Edge</span>
          </span>
        </Link>

        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Win smarter with data-driven football predictions.
          </h2>
          <p className="mt-3 max-w-md text-sm text-slate-300">
            Expert tips, real odds, and deep analysis — all in one clean
            dashboard.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} GoalEdge. Predictions are for
          informational purposes only.
        </p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Goal<span className="text-emerald-600">Edge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && (
            <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
