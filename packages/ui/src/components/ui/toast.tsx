"use client";

import { toast } from "./sonner";

export type ToastOptions = Parameters<typeof toast>[1];
export type ToastPromiseOptions = Parameters<typeof toast.promise>[1];

const Toast = {
  show(message: Parameters<typeof toast>[0], options?: ToastOptions) {
    return toast(message, options);
  },
  success(
    message: Parameters<typeof toast.success>[0],
    options?: ToastOptions,
  ) {
    return toast.success(message, options);
  },
  info(message: Parameters<typeof toast.info>[0], options?: ToastOptions) {
    return toast.info(message, options);
  },
  warning(
    message: Parameters<typeof toast.warning>[0],
    options?: ToastOptions,
  ) {
    return toast.warning(message, options);
  },
  error(message: Parameters<typeof toast.error>[0], options?: ToastOptions) {
    return toast.error(message, options);
  },
  loading(
    message: Parameters<typeof toast.loading>[0],
    options?: ToastOptions,
  ) {
    return toast.loading(message, options);
  },
  promise<TData>(
    promiseOrFactory: Promise<TData> | (() => Promise<TData>),
    options: ToastPromiseOptions,
  ) {
    return toast.promise(promiseOrFactory, options);
  },
  dismiss(id?: Parameters<typeof toast.dismiss>[0]) {
    return toast.dismiss(id);
  },
};

export type ToastHelper = typeof Toast;

export { Toast };
