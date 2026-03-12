"use client";

import { useEffect } from "react";

export default function AlertProvider() {

  useEffect(() => {

    const oldAlert = window.alert;

    window.alert = function (message?: unknown) {
      console.log("Alert:", message);

      const div = document.createElement("div");
      div.style.position = "fixed";
      div.style.top = "0";
      div.style.left = "0";
      div.style.right = "0";
      div.style.bottom = "0";
      div.style.background = "rgba(0,0,0,0.4)";
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.justifyContent = "center";
      div.style.zIndex = "9999";

      div.innerHTML = `
        <div style="background:white;padding:20px;border-radius:12px;text-align:center;max-width:300px">
          <p style="margin-bottom:15px">${message}</p>
          <button id="close-alert" style="background:#f97316;color:white;padding:8px 16px;border-radius:8px">
            OK
          </button>
        </div>
      `;

      document.body.appendChild(div);

      document
        .getElementById("close-alert")
        ?.addEventListener("click", () => div.remove());
    };

    return () => {
      window.alert = oldAlert;
    };

  }, []);

  return null;
}
