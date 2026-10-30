import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react-native"
import * as React from "react"
import { withUniwind } from "uniwind"

import { TextClassContext } from "@/components/ui/text"
import { cn } from "@/lib/utils"

const StyledIcon = withUniwind(HugeiconsIcon, {
  size: { fromClassName: "className", styleProperty: "width" },
  color: { fromClassName: "className", styleProperty: "color" },
})

type IconProps = Omit<HugeiconsProps, "color"> & { className?: string }

/**
 * Hugeicons icon with Uniwind `className` support (`size-*`, `text-*`).
 * Same icon set and names as the web. Import icons one by one (Metro does not tree-shake, the
 * barrel holds ~12k icons): `import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"`.
 *
 * @example <Icon icon={Delete02Icon} className="text-muted-foreground size-5" />
 */
function Icon({ className, strokeWidth = 2, ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext)
  return (
    <StyledIcon
      strokeWidth={strokeWidth}
      className={cn("size-4 text-foreground", textClass, className)}
      {...props}
    />
  )
}

export { Icon }
export type { IconProps }
