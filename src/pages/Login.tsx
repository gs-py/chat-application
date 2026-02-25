import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const [showSignUp, setShowSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950 p-6 md:p-12">
      <div className="w-full max-w-[420px] md:max-w-[380px] lg:max-w-[420px]">
        {showSignUp ? (
          <SignUpForm
            onSuccess={() => navigate('/chat', { replace: true })}
            onLoginClick={() => setShowSignUp(false)}
            signUp={signUp}
          />
        ) : (
          <LoginForm
            onSuccess={() => navigate('/chat', { replace: true })}
            onSignUpClick={() => setShowSignUp(true)}
            signIn={signIn}
          />
        )}
      </div>
    </div>
  );
}
