let iosHapticElement: HTMLInputElement | null = null;
let iosHapticLabel: HTMLLabelElement | null = null;

const initIOSHaptic = () => {
  if (typeof document === "undefined") return;
  if (iosHapticElement) return;

  iosHapticElement = document.createElement("input");
  iosHapticElement.type = "checkbox";
  iosHapticElement.style.position = "absolute";
  iosHapticElement.style.opacity = "0";
  iosHapticElement.style.pointerEvents = "none";
  iosHapticElement.style.width = "0";
  iosHapticElement.style.height = "0";
  iosHapticElement.style.zIndex = "-9999";

  iosHapticLabel = document.createElement("label");
  iosHapticLabel.style.position = "absolute";
  iosHapticLabel.style.width = "0";
  iosHapticLabel.style.height = "0";
  iosHapticLabel.style.pointerEvents = "none";
  iosHapticLabel.style.zIndex = "-9999";

  const id = "ios-haptic-trigger-" + Math.random().toString(36).substring(2);
  iosHapticElement.id = id;
  iosHapticLabel.htmlFor = id;

  document.body.appendChild(iosHapticElement);
  document.body.appendChild(iosHapticLabel);
};

const triggerIOSHaptic = () => {
  try {
    if (typeof document === "undefined") return;
    if (!iosHapticLabel) {
      initIOSHaptic();
    }
    if (iosHapticLabel) {
      iosHapticLabel.click();
    }
  } catch (err) {
    console.warn("iOS checkbox haptic hack failed:", err);
  }
};

/**
 * Utility to trigger haptic feedback vibrations.
 * Uses navigator.vibrate with standard fallback checks, and checkbox hack on iOS.
 */
export const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" | "warning" = "light") => {
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // iOS taptic feedback workaround via label clicking triggers
    switch (type) {
      case "light":
        triggerIOSHaptic();
        break;
      case "medium":
        triggerIOSHaptic();
        setTimeout(triggerIOSHaptic, 50);
        break;
      case "heavy":
        triggerIOSHaptic();
        setTimeout(triggerIOSHaptic, 50);
        setTimeout(triggerIOSHaptic, 100);
        break;
      case "success":
        triggerIOSHaptic();
        setTimeout(triggerIOSHaptic, 100);
        break;
      case "warning":
        triggerIOSHaptic();
        setTimeout(triggerIOSHaptic, 150);
        break;
    }
  } else if (typeof navigator !== "undefined" && navigator.vibrate) {
    // Android standard vibration API
    switch (type) {
      case "light":
        navigator.vibrate(15);
        break;
      case "medium":
        navigator.vibrate(35);
        break;
      case "heavy":
        navigator.vibrate(65);
        break;
      case "success":
        navigator.vibrate([20, 40, 20]);
        break;
      case "warning":
        navigator.vibrate([65, 100, 65]);
        break;
    }
  }
};
