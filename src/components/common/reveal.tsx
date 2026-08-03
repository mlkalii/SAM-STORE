"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const variants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

interface RevealProps extends React.ComponentProps<typeof motion.div> {
  delay?: number;
}

/** Fades and lifts its children into view the first time they cross the viewport. */
export function Reveal({ delay = 0, className, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggers direct children that use the `Reveal` variants. */
export function RevealGroup({
  className,
  stagger = 0.08,
  children,
  ...props
}: React.ComponentProps<typeof motion.div> & { stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = variants;
