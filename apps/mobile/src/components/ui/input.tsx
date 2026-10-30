import { Platform, TextInput } from "react-native"

import { cn } from "@/lib/utils"

function Input({
  className,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      placeholderTextColorClassName="accent-muted-foreground"
      className={cn(
        "border-input bg-input/30 text-foreground flex h-9 w-full min-w-0 flex-row items-center rounded-4xl border px-3 py-1 font-sans text-base leading-5",
        props.editable === false &&
          cn(
            "opacity-50",
            Platform.select({ web: "disabled:pointer-events-none disabled:cursor-not-allowed" })
          ),
        Platform.select({
          web: cn(
            "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground transition-[color,box-shadow] outline-none md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
          ),
        }),
        className
      )}
      {...props}
    />
  )
}

export { Input }
