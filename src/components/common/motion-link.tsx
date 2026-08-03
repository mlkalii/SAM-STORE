"use client";

import { motion } from "motion/react";
import Link from "next/link";

/** `next/link` with Framer Motion's props attached — usable inside RevealGroup. */
export const MotionLink = motion.create(Link);
