export function GoalProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      {/* width and color come from data, so they stay inline styles */}
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-[ease]"
        style={{ backgroundColor: color, width: `${percent}%` }}
      />
    </div>
  )
}
