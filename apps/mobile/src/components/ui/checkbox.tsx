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
        "size-4 shrink-0 rounded-[6px] border border-input dark:bg-input/30",
        Platform.select({
          web: "peer cursor-default transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
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
        className={cn("h-full w-full items-center justify-center bg-primary", indicatorClassName)}
      >
        <Icon
          icon={Tick02Icon}
          strokeWidth={Platform.OS === "web" ? 2.5 : 3}
          className={cn("size-3.5 text-primary-foreground", iconClassName)}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
