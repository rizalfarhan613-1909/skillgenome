export const ease = [0.22, 1, 0.36, 1] as const;
export const stagger = { show: { transition: { staggerChildren: 0.06 } } };
export const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
export const press = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };
