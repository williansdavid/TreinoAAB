import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function InstallButton() {
  const { isInstallable, isInstalled, install } = useInstallPrompt()

  // Não mostra se já instalou ou se o navegador não suporta
  if (isInstalled || !isInstallable) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <Button
        variant="default"
        size="lg"
        onClick={install}
        className="w-full gap-2 shadow-lg"
      >
        <Download className="h-5 w-5" />
        Instalar Treino IA na tela inicial
      </Button>
    </div>
  )
}