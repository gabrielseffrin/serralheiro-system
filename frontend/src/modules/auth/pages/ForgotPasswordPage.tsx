import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/forgot-password';
import { authApi } from '../api';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data.email);
    } catch {
      // Silently handle or show error; the behavior matches B2B best practices
    } finally {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-semibold text-white">E-mail enviado</h2>
        <p className="text-sm text-gray-400">
          Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
        </p>
        <Link
          to="/login"
          className="inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Recuperar senha</h2>
        <p className="mt-1 text-sm text-gray-400">
          Informe seu e-mail para receber o link de redefinição
        </p>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar link'}
      </button>

      <div className="text-center">
        <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300">
          Voltar ao login
        </Link>
      </div>
    </form>
  );
}
