import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Terminal } from "./Terminal.vue"
export { default as TerminalLine } from "./TerminalLine.vue"

export const terminalVariants = cva(
  "rounded-xl border overflow-hidden font-mono text-sm",
  {
    variants: {
      variant: {
        default: "border-border/60 bg-card/50 backdrop-blur-sm",
        solid: "border-border bg-card",
        ghost: "border-border/40 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type TerminalVariants = VariantProps<typeof terminalVariants>
