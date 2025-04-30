import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bortoli.pwm_control",
  appName: "Controle PWM",
  webDir: "dist",
  server: {
    // url: "http://localhost:5173",
    cleartext: true,
  },
  android: {
    // mixed content e cleartext: permitem o aplicativo compilado contatar o servidor HTTP de telemetria
    allowMixedContent: true,
  },
};

export default config;
