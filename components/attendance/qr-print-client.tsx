"use client";

import { useEffect } from "react";

export function QrPrintClient() {
  useEffect(() => {
    let closed = false;

    const waitForImage = (img: HTMLImageElement | null) =>
      new Promise<void>((resolve) => {
        if (!img) {
          resolve();
          return;
        }
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
        window.setTimeout(finish, 2500);
      });

    const printWhenReady = async () => {
      const qr = document.getElementById("print-qr") as HTMLImageElement | null;
      const logo = document.getElementById("print-logo") as HTMLImageElement | null;
      await Promise.all([waitForImage(qr), waitForImage(logo)]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.focus();
          window.print();
        });
      });
    };

    const closeAfterPrint = () => {
      if (closed) return;
      closed = true;
      window.close();
    };

    window.addEventListener("afterprint", closeAfterPrint);
    const closeFallback = window.setTimeout(closeAfterPrint, 4000);
    void printWhenReady();

    return () => {
      window.removeEventListener("afterprint", closeAfterPrint);
      window.clearTimeout(closeFallback);
    };
  }, []);

  return null;
}
