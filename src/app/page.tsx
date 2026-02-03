// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl text-center px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TaskFlow
        </h1>
        <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-10">
          Gérez vos projets et tâches en équipe, simplement et efficacement.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-lg">
              Se connecter
            </button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition text-lg">
              S'inscrire gratuitement
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}