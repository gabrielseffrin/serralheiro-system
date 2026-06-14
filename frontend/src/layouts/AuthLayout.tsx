import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Serralheiro</h1>
          <p className="mt-2 text-sm text-gray-400">Sistema de Gestão de Orçamentos</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-xl p-8 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
