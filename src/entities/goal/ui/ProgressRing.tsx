import { ProgressRing as SharedProgressRing } from "@/shared/ui/progress-ring"

export function ProgressRing({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="shrink-0 w-[52px] h-[52px]">
      <SharedProgressRing progress={progress} color={color} />
    </div>
  )
}
