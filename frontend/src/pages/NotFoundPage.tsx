import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
        <p className="text-6xl font-bold text-indigo-600">404</p>
        <h1 className="mt-4 text-xl font-bold text-slate-800">Página não encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
