import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import * as CheckboxPrimitive from "@rn-primitives/checkbox"
import { Platform } from "react-native"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const DEFAULT_HIT_SLOP = 24

function Checkbox({
  className,
  checkedClassName,
  indicatorClassName,
  iconClassName,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  checkedClassName?: string
  indicatorClassName?: string
  iconClassName?: string
}) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "border-input dark:bg-input/30 size-4 shrink-0 rounded-[6px] border",
        Platform.select({
          web: "peer focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 cursor-default transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed",
          native: "overflow-hidden",
        }),
        props.checked && cn("border-primary", checkedClassName),
        props.disabled && "opacity-50",
        className
      )}
      hitSlop={DEFAULT_HIT_SLOP}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("bg-primary h-full w-full items-center justify-center", indicatorClassName)}
      >
        <Icon
          icon={Tick02Icon}
          strokeWidth={Platform.OS === "web" ? 2.5 : 3}
          className={cn("text-primary-foreground size-3.5", iconClassName)}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
