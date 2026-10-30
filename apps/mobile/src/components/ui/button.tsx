import { cva, type VariantProps } from "class-variance-authority"
import { Platform, Pressable } from "react-native"

import { TextClassContext } from "@/components/ui/text"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-1.5 rounded-4xl border border-transparent",
    Platform.select({
      web: "whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary active:bg-primary/80",
          Platform.select({ web: "hover:bg-primary/80" })
        ),
        destructive: cn(
          "bg-destructive/10 active:bg-destructive/20 dark:bg-destructive/20 dark:active:bg-destructive/30",
          Platform.select({
            web: "hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          })
        ),
        outline: cn(
          "border-border bg-input/30 active:bg-input/50",
          Platform.select({
            web: "hover:bg-input/50",
          })
        ),
        secondary: cn(
          "bg-secondary active:bg-secondary/80",
          Platform.select({ web: "hover:bg-secondary/80" })
        ),
        ghost: cn(
          "active:bg-muted dark:active:bg-muted/50",
          Platform.select({ web: "hover:bg-muted dark:hover:bg-muted/50" })
        ),
        link: "",
      },
      size: {
        // Same size names and values as apps/web/src/components/ui/button.tsx (maia).
        default: "h-9 px-3",
        xs: "h-6 gap-1 px-2.5",
        sm: "h-8 gap-1 px-3",
        lg: "h-10 px-4",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonTextVariants = cva(
  cn(
    "text-sm font-medium text-foreground",
    Platform.select({ web: "pointer-events-none transition-colors" })
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-destructive",
        outline: cn(
          "group-active:text-foreground",
          Platform.select({ web: "group-hover:text-foreground" })
        ),
        secondary: "text-secondary-foreground",
        ghost: "group-active:text-foreground",
        link: cn(
          "text-primary group-active:underline",
          Platform.select({ web: "underline-offset-4 group-hover:underline hover:underline" })
        ),
      },
      size: {
        default: "",
        xs: "text-xs",
        sm: "",
        lg: "",
        icon: "",
        "icon-xs": "",
        "icon-sm": "",
        "icon-lg": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && "opacity-50", buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  )
}

export { Button, buttonTextVariants, buttonVariants }
export type { ButtonProps }
