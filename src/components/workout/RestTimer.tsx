import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, SkipForward, Timer, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface RestTimerProps {
  seconds: number
  exerciseName: string
  serieNumber: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimer({
  seconds,
  exerciseName,
  serieNumber,
  onComplete,
  onSkip,
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [isRunning, setIsRunning] = useState(true)
  const [isFinished, setIsFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onSkipRef = useRef(onSkip)

  // Manter refs atualizadas
  onCompleteRef.current = onComplete
  onSkipRef.current = onSkip

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Iniciar/parar o intervalo
  useEffect(() => {
    if (!isRunning || isFinished || timeLeft <= 0) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return clearTimer
  }, [isRunning, isFinished, timeLeft])

  // Detectar quando zera
  useEffect(() => {
    if (timeLeft <= 0 && !isFinished) {
      setIsFinished(true)
      setIsRunning(false)
      clearTimer()

      // Beep
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = "sine"
        gain.gain.value = 0.3
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } catch {}

      // Vibrar
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200])
      }

      // Auto-fechar após 1.5s
      setTimeout(() => onCompleteRef.current(), 1500)
    }
  }, [timeLeft, isFinished])

  // Garantir que o timer comece ao montar
  useEffect(() => {
    setIsRunning(true)
    setTimeLeft(seconds)
    setIsFinished(false)

    return () => clearTimer()
  }, [seconds])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => clearTimer()
  }, [])

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((seconds - timeLeft) / seconds) * 100
  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const handlePauseResume = () => {
    if (!isFinished) setIsRunning((prev) => !prev)
  }

  const handleSkip = () => {
    clearTimer()
    onSkipRef.current()
  }

  const handleFinish = () => {
    clearTimer()
    onCompleteRef.current()
  }

  return (
    <Card
      className={cn(
        "p-5 border-2 shadow-lg transition-all duration-300",
        isFinished
          ? "border-green-500/50 bg-green-500/5"
          : "border-primary/20 bg-card"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              Descanso
            </span>
          </div>
          <p className="text-sm font-medium text-foreground truncate max-w-[280px] mx-auto">
            {exerciseName}
          </p>
          <p className="text-xs text-muted-foreground">
            {serieNumber}ª série concluída
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <svg width="150" height="150" className="transform -rotate-90">
            <circle
              cx="75" cy="75" r="60"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="75" cy="75" r="60"
              fill="none"
              stroke={isFinished ? "#22c55e" : "hsl(var(--primary))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isFinished ? (
              <>
                <Bell className="h-8 w-8 text-green-500 mb-1 animate-bounce" />
                <span className="text-sm font-bold text-green-500 animate-pulse">
                  PRONTO!
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isFinished ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 w-full">
          {!isFinished ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handlePauseResume}
              >
                {isRunning ? (
                  <><Pause className="h-3.5 w-3.5" /> Pausar</>
                ) : (
                  <><Play className="h-3.5 w-3.5" /> Continuar</>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleSkip}
              >
                <SkipForward className="h-3.5 w-3.5" /> Pular
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full gap-1.5"
              onClick={handleFinish}
            >
              <Play className="h-3.5 w-3.5" /> Próxima série
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}