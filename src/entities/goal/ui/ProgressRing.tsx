import { ProgressRing as SharedProgressRing } from "@/shared/ui/progress-ring"

export function ProgressRing({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="shrink-0 w-[60px] h-[60px]">
      <SharedProgressRing
        progress={progress}
        color={color}
        strokeWidth={5}
        trackColor={`color-mix(in srgb, ${color} 16%, transparent)`}
        labelClassName="text-[13px] font-extrabold"
      />
    </div>
  )
}
