import type { Component } from "vue"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { icons as lucideIcons } from "lucide-vue-next"

// Custom icons
import CleanSliceIcon from "./icons/CleanSlice.vue"

export { CleanSliceIcon as CleanSlice }

const customIcons: Record<string, Component> = {
  CleanSlice: CleanSliceIcon,
}

export function resolveIcon(name: string): Component | undefined {
  return customIcons[name] ?? (lucideIcons as Record<string, Component>)[name]
}

export const iconVariants = cva(
  "shrink-0",
  {
    variants: {
      size: {
        "default": "size-4",
        "xs": "size-3",
        "sm": "size-3.5",
        "lg": "size-5",
        "xl": "size-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

export type IconVariants = VariantProps<typeof iconVariants>
