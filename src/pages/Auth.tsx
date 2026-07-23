import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Email inválido").max(255, "Email muito longo");
const passwordSchema = z.string().min(6, "Mínimo 6 caracteres").max(72, "Máximo 72 caracteres");

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      if (mode !== "forgot") {
        passwordSchema.parse(password);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate("/");
      } else if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Você já pode fazer login e começar a treinar.",
        });
        setMode("login");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
        setMode("login");
      }
    } catch (error: any) {
      let message = "Ocorreu um erro. Tente novamente.";
      if (error.message.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos.";
      } else if (error.message.includes("User already registered")) {
        message = "Este email já está cadastrado. Faça login.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Confirme seu email antes de fazer login.";
      }
      toast({
        variant: "destructive",
        title: "Erro",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 pt-12 pb-8">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg glow animate-scale-in">
            <Dumbbell className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 animate-slide-up">
            Treino IA
          </h1>
          <p className="text-muted-foreground animate-slide-up stagger-1">
            Seu coach pessoal com inteligência artificial
          </p>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto">
          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </button>
          )}

          <h2 className="text-2xl font-display font-bold mb-2">
            {mode === "login" && "Bem-vindo de volta!"}
            {mode === "signup" && "Criar conta"}
            {mode === "forgot" && "Recuperar senha"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login" && "Entre para continuar seu treino"}
            {mode === "signup" && "Comece sua jornada fitness hoje"}
            {mode === "forgot" && "Enviaremos um link para redefinir sua senha"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12"
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "login" ? (
                "Entrar"
              ) : mode === "signup" ? (
                "Criar conta"
              ) : (
                "Enviar link"
              )}
            </Button>
          </form>

          {mode !== "forgot" && (
            <p className="text-center mt-8 text-muted-foreground">
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "login" ? "Cadastre-se" : "Fazer login"}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos{" "}
          <a href="/termos" className="text-primary hover:underline">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="/privacidade" className="text-primary hover:underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
